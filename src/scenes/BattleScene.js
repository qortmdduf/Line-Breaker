// BattleScene.js — 메인 전투 씬

class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.stageId   = data.stageId || 1;
    // [PROTO BEGIN]
    this.isProto   = data.isProto || false;
    this.stageData = this.isProto ? window.PROTO_STAGE : window.STAGES[this.stageId - 1];
    // [PROTO END]
  }

  create() {
    const cfg  = window.GameConfig;
    const save = window.SaveSystem.get();

    window.SaveSystem.resetHeroUsed();
    this.cameras.main.setBounds(0, 0, cfg.WORLD_WIDTH, cfg.GAME_HEIGHT);

    this._buildBackground();

    this.costSystem  = new window.CostSystem();
    this._arrowAngle = cfg.ARROW_ANGLE;

    // 불화살 상태
    this._fireArrowCooldown = 0;   // 남은 쿨타임 ms
    this._fireArrowDuration = 0;   // 남은 활성 시간 ms
    this._FIRE_CD  = 10000;        // 쿨타임 10초
    this._FIRE_DUR = 5000;         // 지속 5초

    const arrowDmgLevel = (save.upgrades['arrow_dmg']) || 0;
    const arrowDmg = cfg.ARROW_BASE_DAMAGE + arrowDmgLevel * 10;

    this.allyCastle = new window.Castle(
      this, cfg.ALLY_CASTLE_X, true, cfg.CASTLE_HP_ALLY,
      arrowDmg, cfg.ARROW_INTERVAL,
      (castle) => this._spawnArrow(castle.x, cfg.BATTLE_Y - 80, castle.arrowAngle, arrowDmg)
    );

    this.enemyCastle = new window.Castle(
      this, cfg.ENEMY_CASTLE_X, false, this.stageData.enemyCastleHp,
      cfg.ARROW_BASE_DAMAGE, cfg.ARROW_INTERVAL,
      (castle, target) => this._spawnProjectile(castle.x, cfg.BATTLE_Y - 60, target, castle.arrowDamage, 300)
    );

    // 아군 성 HP 감소 시 긴장감 효과
    this.allyCastle.onDamageThreshold = () => this._triggerDamageEffect();

    this.allyUnits     = [];
    this.enemyUnits    = [];
    this.projectiles   = [];
    this.arcProjectiles = [];

    this.allyCastle.setTargets(this.enemyUnits);
    this.enemyCastle.setTargets(this.allyUnits);

    this.waveSystem = new window.WaveSystem(this, this.stageData, (unitId) => {
      this._spawnEnemy(unitId);
    });
    this.waveSystem.start();
    this._startAutoSpawn();

    this.hud = new window.BattleHUD(
      this, this.costSystem,
      (unitId)    => this._onSummonRequest(unitId),
      ()          => this._onSkillRequest(),
      (slotIndex) => this._onSkillSlotPressed(slotIndex),
      // [PROTO BEGIN]
      { isProto: this.isProto }
      // [PROTO END]
    );

    // 빨간 테두리 그래픽 (HP 감소 시 펄스)
    this._buildRedBorder();

    this._buildAngleIndicator();
    this._buildAimJoystick();
    this._buildMoveJoystick();
    this._startJoystickControls();

    this._battleOver = false;
    this._buildPauseButton();

    this.add.text(cfg.GAME_WIDTH / 2, 12, this.stageData.label, {
      fontSize: '14px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  _buildBackground() {
    const cfg     = window.GameConfig;
    const W       = cfg.WORLD_WIDTH;
    const H       = cfg.GAME_HEIGHT;
    const groundY = cfg.BATTLE_Y;

    this.add.graphics().fillStyle(cfg.COLOR.SKY).fillRect(0, 0, W, groundY);
    this.add.graphics().fillStyle(cfg.COLOR.GROUND).fillRect(0, groundY, W, H - groundY);
    const horizon = this.add.graphics();
    horizon.lineStyle(2, 0x2d5a27);
    horizon.lineBetween(0, groundY, W, groundY);
  }

  _buildPauseButton() {
    const cfg = window.GameConfig;
    const btn = this.add.text(cfg.GAME_WIDTH - 10, 8, '⏸', {
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(15).setScrollFactor(0).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.waveSystem.stop();
      if (this._autoSpawnTimer) this._autoSpawnTimer.remove(false);
      this.scene.start('LobbyScene');
    });
  }

  // ── 빨간 테두리 (긴장감 효과) ─────────────────────────────
  _buildRedBorder() {
    const cfg = window.GameConfig;
    const W   = cfg.GAME_WIDTH;
    const H   = cfg.GAME_HEIGHT;

    this._redBorder = this.add.graphics().setScrollFactor(0).setDepth(50);
    this._redBorder.lineStyle(12, 0xff0000, 1);
    this._redBorder.strokeRect(2, 2, W - 4, H - 4);
    this._redBorder.setAlpha(0);
  }

  _triggerDamageEffect() {
    this.cameras.main.shake(350, 0.014);
    this.tweens.add({
      targets: this._redBorder,
      alpha: { from: 0.9, to: 0 },
      duration: 250,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── 각도 표시기 (좌상단 고정) ──────────────────────────────
  _buildAngleIndicator() {
    const bg = this.add.graphics().setScrollFactor(0).setDepth(20);
    bg.fillStyle(0x112244, 0.80);
    bg.fillRoundedRect(6, 28, 72, 20, 5);

    this._angleText = this.add.text(42, 38,
      '조준 ' + Math.round(this._arrowAngle) + '\u00b0', {
        fontSize: '11px', color: '#ffdd88'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
  }

  // ── 조준 조이스틱 (floating) — 수직만 사용, 화살 각도 조절 ──
  _buildAimJoystick() {
    const R = 56;   // 베이스 반지름
    const r = 22;   // 노브 반지름
    this._aimJoy = {
      radius: R,
      active: false,
      pointerId: -1,
      baseX: 0, baseY: 0,
    };

    // 베이스: 불투명 테두리 + 옅은 채움
    this._aimBaseGfx = this.add.graphics().setScrollFactor(0).setDepth(30);
    this._aimBaseGfx.fillStyle(0xffffff, 0.10);
    this._aimBaseGfx.fillCircle(0, 0, R);
    this._aimBaseGfx.lineStyle(3, 0xffffff, 0.70);
    this._aimBaseGfx.strokeCircle(0, 0, R);
    this._aimBaseGfx.setAlpha(0);

    // 위아래 방향 힌트 삼각형
    this._aimDirGfx = this.add.graphics().setScrollFactor(0).setDepth(31);
    this._aimDirGfx.fillStyle(0xffffff, 0.25);
    this._aimDirGfx.fillTriangle(-7, -R + 12, 7, -R + 12, 0, -R + 3);
    this._aimDirGfx.fillTriangle(-7, R - 12, 7, R - 12, 0, R - 3);
    this._aimDirGfx.setAlpha(0);

    // 노브: 진한 흰색
    this._aimKnobGfx = this.add.graphics().setScrollFactor(0).setDepth(32);
    this._aimKnobGfx.fillStyle(0xffffff, 0.80);
    this._aimKnobGfx.fillCircle(0, 0, r);
    this._aimKnobGfx.lineStyle(2, 0xffffff, 1.0);
    this._aimKnobGfx.strokeCircle(0, 0, r);
    this._aimKnobGfx.setAlpha(0);
  }

  // ── 이동 조이스틱 (fixed) — 수평만 사용, 카메라 스크롤 ──────
  // 위치: 스킬 슬롯 첫 번째(불화살) 중앙 바로 위 (항상 화면에 표시)
  _buildMoveJoystick() {
    const cfg    = window.GameConfig;
    const R      = 40;   // 작은 고정 조이스틱
    const r      = 16;
    const hudY   = cfg.GAME_HEIGHT - cfg.HUD_HEIGHT;

    // 화면 가로 중앙 고정 — HUD 슬롯 개수 변경에 독립적
    const fixedX = cfg.GAME_WIDTH / 2;
    const fixedY = hudY - R - 10;

    this._moveJoy = {
      radius: R,
      active: false,
      pointerId: -1,
      baseX: fixedX,
      baseY: fixedY,
      horizRatio: 0,
    };

    // 베이스: 낮은 투명도로 항상 표시
    this._moveBaseGfx = this.add.graphics().setScrollFactor(0).setDepth(30);
    this._moveBaseGfx.fillStyle(0x44aaff, 0.12);
    this._moveBaseGfx.fillCircle(0, 0, R);
    this._moveBaseGfx.lineStyle(2, 0x44aaff, 0.50);
    this._moveBaseGfx.strokeCircle(0, 0, R);
    // 좌우 방향 힌트
    this._moveBaseGfx.fillStyle(0xffffff, 0.20);
    this._moveBaseGfx.fillTriangle(-R + 3, -5, -R + 3, 5, -R + 12, 0);
    this._moveBaseGfx.fillTriangle(R - 3, -5, R - 3, 5, R - 12, 0);
    this._moveBaseGfx.setPosition(fixedX, fixedY).setAlpha(0.4);

    // 노브
    this._moveKnobGfx = this.add.graphics().setScrollFactor(0).setDepth(31);
    this._moveKnobGfx.fillStyle(0x44aaff, 0.60);
    this._moveKnobGfx.fillCircle(0, 0, r);
    this._moveKnobGfx.lineStyle(2, 0x88ccff, 0.80);
    this._moveKnobGfx.strokeCircle(0, 0, r);
    this._moveKnobGfx.setPosition(fixedX, fixedY).setAlpha(0.4);
  }

  // ── 입력 처리: 두 조이스틱 동시 독립 동작 (pointerId 구분) ──
  _startJoystickControls() {
    const cfg = window.GameConfig;

    this.input.on('pointerdown', (pointer) => {
      const hudY = cfg.GAME_HEIGHT - cfg.HUD_HEIGHT;

      // HUD 영역 터치는 무시
      if (pointer.y >= hudY) return;

      const mx = this._moveJoy.baseX;
      const my = this._moveJoy.baseY;
      const distToMove = Math.sqrt(
        (pointer.x - mx) * (pointer.x - mx) +
        (pointer.y - my) * (pointer.y - my)
      );

      // 이동 조이스틱 영역 터치
      if (distToMove <= this._moveJoy.radius * 1.2 && !this._moveJoy.active) {
        this._moveJoy.active    = true;
        this._moveJoy.pointerId = pointer.id;
        this._moveBaseGfx.setAlpha(1.0);
        this._moveKnobGfx.setAlpha(1.0);
        return; // 조준 조이스틱과 겹치지 않도록 이른 반환
      }

      // 조준 조이스틱 영역 터치 (이동 조이스틱 영역 제외)
      if (!this._aimJoy.active) {
        this._aimJoy.active    = true;
        this._aimJoy.pointerId = pointer.id;
        this._aimJoy.baseX     = pointer.x;
        this._aimJoy.baseY     = pointer.y;

        this._aimBaseGfx.setPosition(pointer.x, pointer.y).setAlpha(1);
        this._aimDirGfx.setPosition(pointer.x, pointer.y).setAlpha(1);
        this._aimKnobGfx.setPosition(pointer.x, pointer.y).setAlpha(1);
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;

      // 이동 조이스틱 처리
      if (this._moveJoy.active && pointer.id === this._moveJoy.pointerId) {
        const dx    = pointer.x - this._moveJoy.baseX;
        const R     = this._moveJoy.radius;
        const clamp = Phaser.Math.Clamp(dx, -R, R);
        // 노브는 수평으로만 이동
        this._moveKnobGfx.setPosition(this._moveJoy.baseX + clamp, this._moveJoy.baseY);
        this._moveJoy.horizRatio = clamp / R;
        return;
      }

      // 조준 조이스틱 처리: 수직만 사용 (x는 baseX 고정)
      if (this._aimJoy.active && pointer.id === this._aimJoy.pointerId) {
        const dy = pointer.y - this._aimJoy.baseY;
        const R  = this._aimJoy.radius;
        const clampY = Phaser.Math.Clamp(dy, -R, R);

        // 노브: x 고정, y만 이동
        this._aimKnobGfx.setPosition(
          this._aimJoy.baseX,
          this._aimJoy.baseY + clampY
        );

        // 수직 비율 → 발사 각도 계산
        const vertRatio = -Phaser.Math.Clamp(dy / R, -1, 1);
        const mid  = (cfg.ARROW_ANGLE_MIN + cfg.ARROW_ANGLE_MAX) / 2;
        const half = (cfg.ARROW_ANGLE_MAX - cfg.ARROW_ANGLE_MIN) / 2;
        this._arrowAngle = mid + vertRatio * half;
        this._angleText.setText('조준 ' + Math.round(this._arrowAngle) + '\u00b0');
        this.allyCastle.setArrowAngle(this._arrowAngle);
      }
    });

    this.input.on('pointerup', (pointer) => {
      this._releaseJoystick(pointer.id);
    });
    this.input.on('pointerout', (pointer) => {
      this._releaseJoystick(pointer.id);
    });
  }

  _releaseJoystick(pointerId) {
    if (this._moveJoy.active && this._moveJoy.pointerId === pointerId) {
      this._moveJoy.active     = false;
      this._moveJoy.pointerId  = -1;
      this._moveJoy.horizRatio = 0;
      this._moveKnobGfx.setPosition(this._moveJoy.baseX, this._moveJoy.baseY);
      this._moveBaseGfx.setAlpha(0.4);
      this._moveKnobGfx.setAlpha(0.4);
    }
    if (this._aimJoy.active && this._aimJoy.pointerId === pointerId) {
      this._aimJoy.active    = false;
      this._aimJoy.pointerId = -1;
      this._aimBaseGfx.setAlpha(0);
      this._aimDirGfx.setAlpha(0);
      this._aimKnobGfx.setAlpha(0);
    }
  }

  // ── 자동 warrior 소환 ──────────────────────────────────────
  _startAutoSpawn() {
    const cfg = window.GameConfig;
    this._autoSpawnTimer = this.time.addEvent({
      delay: cfg.AUTO_SPAWN_INTERVAL,
      callback: () => { if (!this._battleOver) this._spawnAlly('warrior'); },
      loop: true,
    });
  }

  // ── 스킬 슬롯 입력 ─────────────────────────────────────────
  _onSkillSlotPressed(slotIndex) {
    if (slotIndex === 0) {
      // 불화살
      if (this._fireArrowCooldown > 0) return;
      this._fireArrowDuration = this._FIRE_DUR;
      this._fireArrowCooldown = this._FIRE_CD;
    }
  }

  // ── 소환 요청 ──────────────────────────────────────────────
  _onSummonRequest(unitId) {
    if (this._battleOver) return;
    const save = window.SaveSystem.get();
    const unit = window.UNITS[unitId];
    if (unit.isHero && save.heroUsed) return;
    if (!this.costSystem.spend(unit.cost)) return;
    if (unit.isHero) {
      save.heroUsed = true;
      window.SaveSystem.persist();
      this.hud.markHeroUsed();
    }
    // [PROTO BEGIN]
    // 프로토 모드는 해금 여부 미검사 — HUD에서 이미 처리됨
    // [PROTO END]
    this._spawnAlly(unitId);
  }

  _onSkillRequest() {
    const hero = this.allyUnits.find(u => u instanceof window.Hero);
    if (hero && hero.isSkillReady()) hero.useSkill(this.enemyUnits);
  }

  // ── 유닛 소환 ──────────────────────────────────────────────
  _spawnAlly(unitId) {
    const cfg   = window.GameConfig;
    const stats = window.getUnitStats(unitId, window.SaveSystem.get().upgrades);
    const x = cfg.ALLY_CASTLE_X + 30;
    const y = cfg.BATTLE_Y - stats.radius;
    let unit;
    if (unitId === 'hero') unit = new window.Hero(this, x, y, stats);
    // [PROTO BEGIN]
    else if (unitId === 'paladin') unit = new window.Paladin(this, x, y, stats);
    // [PROTO END]
    else unit = new window.AllyUnit(this, x, y, stats);
    this.allyUnits.push(unit);
  }

  _spawnEnemy(unitId) {
    const cfg   = window.GameConfig;
    const stats = Object.assign({}, window.UNITS[unitId]);
    const x = cfg.ENEMY_CASTLE_X - 30;
    const y = cfg.BATTLE_Y - stats.radius;
    const unit = new window.EnemyUnit(this, x, y, stats);
    // [PROTO BEGIN] — 킬 시 코스트 획득
    unit.onDie = (u) => this.costSystem.gainCost(u.stats.killCostReward || 5);
    // [PROTO END]
    this.enemyUnits.push(unit);
  }

  // ── 투사체 ─────────────────────────────────────────────────
  _spawnProjectile(x, y, target, damage, speed) {
    this.projectiles.push(new window.Projectile(this, x, y, target, damage, speed));
  }

  _spawnArrow(x, y, angleDeg, damage) {
    const cfg = window.GameConfig;
    const isFireArrow = this._fireArrowDuration > 0;
    this.arcProjectiles.push(new window.ArcProjectile(
      this, x, y, angleDeg,
      cfg.ARROW_PROJ_SPEED, cfg.ARROW_GRAVITY, damage, isFireArrow
    ));
  }

  // ── 매 프레임 업데이트 ────────────────────────────────────
  update(time, delta) {
    if (this._battleOver) return;

    this.costSystem.update(delta);

    // 이동 조이스틱 수평 → 카메라 연속 이동
    if (this._moveJoy.active && Math.abs(this._moveJoy.horizRatio) > 0.10) {
      const cfg   = window.GameConfig;
      const speed = 5 * this._moveJoy.horizRatio;
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.cameras.main.scrollX + speed,
        0, cfg.WORLD_WIDTH - cfg.GAME_WIDTH
      );
    }

    // 불화살 타이머
    if (this._fireArrowCooldown > 0) this._fireArrowCooldown -= delta;
    if (this._fireArrowDuration > 0) this._fireArrowDuration -= delta;

    this.allyUnits     = this.allyUnits.filter(u => u.alive);
    this.enemyUnits    = this.enemyUnits.filter(u => u.alive);
    this.projectiles   = this.projectiles.filter(p => p.alive);
    this.arcProjectiles = this.arcProjectiles.filter(p => p.alive);

    // [PROTO BEGIN] — 팔라딘 버프 매 프레임 리셋 (Paladin._applyAura가 재합산)
    for (const u of this.allyUnits) {
      u._paladinDmgReduction = 0;
      u._paladinAtkBonus = 0;
    }
    // [PROTO END]
    for (const u of this.allyUnits)  u.update(delta, this.enemyUnits, this.enemyCastle, this.allyUnits);
    for (const u of this.enemyUnits) u.update(delta, this.allyUnits,  this.allyCastle);
    for (const p of this.projectiles) p.update(delta);
    for (const p of this.arcProjectiles) p.update(delta, this.enemyUnits, this.allyUnits);

    const liveHero = this.allyUnits.find(u => u instanceof window.Hero) || null;

    // HUD에 스킬 슬롯 상태 전달 (6칸)
    this.hud.update(liveHero, [
      {
        active:        this._fireArrowDuration > 0,
        cooldownMs:    Math.max(0, this._fireArrowCooldown),
        durationMs:    Math.max(0, this._fireArrowDuration),
        maxCooldownMs: this._FIRE_CD,
      },
      null, null, null, null, null,  // 빈 슬롯 5개
    ]);

    this._checkBattleEnd();
  }

  _checkBattleEnd() {
    if (!this.enemyCastle.alive) this._endBattle(true);
    else if (!this.allyCastle.alive) this._endBattle(false);
  }

  _endBattle(victory) {
    if (this._battleOver) return;
    this._battleOver = true;

    this.waveSystem.stop();
    if (this._autoSpawnTimer) this._autoSpawnTimer.remove(false);

    if (victory) {
      // [PROTO BEGIN]
      if (!this.isProto) {
      // [PROTO END]
        const save = window.SaveSystem.get();
        window.CurrencySystem.addGold(this.stageData.reward);
        if (!save.clearedStages.includes(this.stageId)) save.clearedStages.push(this.stageId);
        window.SaveSystem.persist();
      // [PROTO BEGIN]
      }
      // [PROTO END]
    }

    this.time.delayedCall(800, () => {
      this.scene.start('ResultScene', {
        victory, stageId: this.stageId,
        reward: victory ? this.stageData.reward : 0,
      });
    });
  }
}

window.BattleScene = BattleScene;
