// BattleScene.js — 메인 전투 씬

class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.stageId = data.stageId || 1;
    this.stageData = window.STAGES[this.stageId - 1];
  }

  create() {
    const cfg = window.GameConfig;
    const save = window.SaveSystem.get();

    window.SaveSystem.resetHeroUsed();
    this.cameras.main.setBounds(0, 0, cfg.WORLD_WIDTH, cfg.GAME_HEIGHT);

    this._buildBackground();

    this.costSystem = new window.CostSystem();
    this._arrowAngle = cfg.ARROW_ANGLE;

    // 불화살 상태
    this._fireArrowCooldown = 0;   // 남은 쿨타임 ms
    this._fireArrowDuration = 0;   // 남은 활성 시간 ms
    this._FIRE_CD   = 10000;       // 쿨타임 10초
    this._FIRE_DUR  = 5000;        // 지속 5초

    const arrowDmgLevel = (save.upgrades['arrow_dmg']) || 0;
    const arrowDmg = cfg.ARROW_BASE_DAMAGE + arrowDmgLevel * 10;

    this.allyCastle = new window.Castle(
      this, cfg.ALLY_CASTLE_X, true, cfg.CASTLE_HP_ALLY,
      arrowDmg, cfg.ARROW_INTERVAL,
      (castle) => this._spawnArrow(castle.x, cfg.BATTLE_Y - 100, castle.arrowAngle, arrowDmg)
    );

    this.enemyCastle = new window.Castle(
      this, cfg.ENEMY_CASTLE_X, false, this.stageData.enemyCastleHp,
      cfg.ARROW_BASE_DAMAGE, cfg.ARROW_INTERVAL,
      (castle, target) => this._spawnProjectile(castle.x, cfg.BATTLE_Y - 80, target, castle.arrowDamage, 300)
    );

    // 아군 성 HP 감소 시 긴장감 효과
    this.allyCastle.onDamageThreshold = () => this._triggerDamageEffect();

    this.allyUnits    = [];
    this.enemyUnits   = [];
    this.projectiles  = [];
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
      (slotIndex) => this._onSkillSlotPressed(slotIndex)
    );

    // 빨간 테두리 그래픽 (HP 감소 시 펄스)
    this._buildRedBorder();

    this._buildAngleIndicator();
    this._startDragControls();

    this._battleOver = false;
    this._buildPauseButton();

    this.add.text(cfg.GAME_WIDTH / 2, 16, this.stageData.label, {
      fontSize: '16px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  _buildBackground() {
    const cfg = window.GameConfig;
    const W = cfg.WORLD_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const groundY = cfg.BATTLE_Y;

    this.add.graphics().fillStyle(cfg.COLOR.SKY).fillRect(0, 0, W, groundY);
    this.add.graphics().fillStyle(cfg.COLOR.GROUND).fillRect(0, groundY, W, H - groundY);
    const horizon = this.add.graphics();
    horizon.lineStyle(2, 0x2d5a27);
    horizon.lineBetween(0, groundY, W, groundY);
  }

  _buildPauseButton() {
    const cfg = window.GameConfig;
    const btn = this.add.text(cfg.GAME_WIDTH - 10, 10, '⏸', {
      fontSize: '22px', color: '#ffffff'
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
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;

    this._redBorder = this.add.graphics().setScrollFactor(0).setDepth(50);
    this._redBorder.lineStyle(12, 0xff0000, 1);
    this._redBorder.strokeRect(2, 2, W - 4, H - 4);
    this._redBorder.setAlpha(0);
  }

  _triggerDamageEffect() {
    // 진동
    this.cameras.main.shake(350, 0.014);

    // 빨간 테두리 펄스 (두 번 깜빡임)
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
    bg.fillRoundedRect(6, 34, 72, 22, 5);

    this._angleText = this.add.text(42, 45,
      '조준 ' + Math.round(this._arrowAngle) + '\u00b0', {
        fontSize: '12px', color: '#ffdd88'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const hint = this.add.text(
      window.GameConfig.GAME_WIDTH / 2, window.GameConfig.BATTLE_Y - 60,
      '위아래 드래그: 조준  /  좌우 드래그: 화면 이동', {
        fontSize: '11px', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(25).setAlpha(0.9);

    this.tweens.add({
      targets: hint, alpha: 0, delay: 2500, duration: 1000,
      onComplete: () => hint.destroy(),
    });
  }

  // ── 드래그 컨트롤 ──────────────────────────────────────────
  _startDragControls() {
    const cfg = window.GameConfig;
    this._isDragging = false;
    this._lastPX = 0;
    this._lastPY = 0;

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y >= cfg.GAME_HEIGHT - cfg.HUD_HEIGHT) return;
      this._isDragging = true;
      this._lastPX = pointer.x;
      this._lastPY = pointer.y;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this._isDragging || !pointer.isDown) return;

      const dx = pointer.x - this._lastPX;
      const dy = pointer.y - this._lastPY;

      // 위아래 → 각도
      this._arrowAngle = Phaser.Math.Clamp(
        this._arrowAngle - dy * 0.25,
        cfg.ARROW_ANGLE_MIN, cfg.ARROW_ANGLE_MAX
      );
      this._angleText.setText('조준 ' + Math.round(this._arrowAngle) + '\u00b0');
      this.allyCastle.setArrowAngle(this._arrowAngle);

      // 좌우 → 카메라
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.cameras.main.scrollX - dx,
        0, cfg.WORLD_WIDTH - cfg.GAME_WIDTH
      );

      this._lastPX = pointer.x;
      this._lastPY = pointer.y;
    });

    this.input.on('pointerup',  () => { this._isDragging = false; });
    this.input.on('pointerout', () => { this._isDragging = false; });
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
    this._spawnAlly(unitId);
  }

  _onSkillRequest() {
    const hero = this.allyUnits.find(u => u instanceof window.Hero);
    if (hero && hero.isSkillReady()) hero.useSkill(this.enemyUnits);
  }

  // ── 유닛 소환 ──────────────────────────────────────────────
  _spawnAlly(unitId) {
    const cfg = window.GameConfig;
    const stats = window.getUnitStats(unitId, window.SaveSystem.get().upgrades);
    const x = cfg.ALLY_CASTLE_X + 30;
    const y = cfg.BATTLE_Y - stats.radius;
    const unit = unitId === 'hero'
      ? new window.Hero(this, x, y, stats)
      : new window.AllyUnit(this, x, y, stats);
    this.allyUnits.push(unit);
  }

  _spawnEnemy(unitId) {
    const cfg = window.GameConfig;
    const stats = Object.assign({}, window.UNITS[unitId]);
    const x = cfg.ENEMY_CASTLE_X - 30;
    const y = cfg.BATTLE_Y - stats.radius;
    this.enemyUnits.push(new window.EnemyUnit(this, x, y, stats));
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

    // 불화살 타이머
    if (this._fireArrowCooldown > 0) this._fireArrowCooldown -= delta;
    if (this._fireArrowDuration > 0) this._fireArrowDuration -= delta;

    this.allyUnits    = this.allyUnits.filter(u => u.alive);
    this.enemyUnits   = this.enemyUnits.filter(u => u.alive);
    this.projectiles  = this.projectiles.filter(p => p.alive);
    this.arcProjectiles = this.arcProjectiles.filter(p => p.alive);

    for (const u of this.allyUnits)  u.update(delta, this.enemyUnits, this.enemyCastle);
    for (const u of this.enemyUnits) u.update(delta, this.allyUnits,  this.allyCastle);
    for (const p of this.projectiles) p.update(delta);
    for (const p of this.arcProjectiles) p.update(delta, this.enemyUnits, this.allyUnits);

    const liveHero = this.allyUnits.find(u => u instanceof window.Hero) || null;

    // HUD에 스킬 슬롯 상태 전달
    this.hud.update(liveHero, [
      {
        active:       this._fireArrowDuration > 0,
        cooldownMs:   Math.max(0, this._fireArrowCooldown),
        durationMs:   Math.max(0, this._fireArrowDuration),
        maxCooldownMs: this._FIRE_CD,
      }
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
      const save = window.SaveSystem.get();
      window.CurrencySystem.addGold(this.stageData.reward);
      if (!save.clearedStages.includes(this.stageId)) save.clearedStages.push(this.stageId);
      window.SaveSystem.persist();
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
