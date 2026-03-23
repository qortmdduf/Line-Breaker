// BattleScene.js — 메인 전투 씬
// LobbyScene에서 { stageId } 데이터와 함께 시작된다

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

    // 전투 시작 시 영웅 사용 플래그 초기화
    window.SaveSystem.resetHeroUsed();

    // --- 카메라 설정 (월드 너비만큼 스크롤 허용) ---
    this.cameras.main.setBounds(0, 0, cfg.WORLD_WIDTH, cfg.GAME_HEIGHT);

    // --- 배경 ---
    this._buildBackground();

    // --- 시스템 초기화 ---
    this.costSystem = new window.CostSystem();

    // --- 화살 각도 (스위치로 조절) ---
    this._arrowAngle = cfg.ARROW_ANGLE;

    // --- 업그레이드 적용 화살 스탯 ---
    const arrowDmgLevel = (save.upgrades['arrow_dmg']) || 0;
    const arrowSpdLevel = (save.upgrades['arrow_spd']) || 0;
    const arrowDmg = cfg.ARROW_BASE_DAMAGE + arrowDmgLevel * 10;
    const arrowInterval = cfg.ARROW_INTERVAL;

    // --- 성 생성 ---
    this.allyCastle = new window.Castle(
      this, cfg.ALLY_CASTLE_X, true, cfg.CASTLE_HP_ALLY,
      arrowDmg, arrowInterval,
      // 아군 성: 각도 기반 포물선 발사 (target=null)
      (castle) => this._spawnArrow(castle.x, cfg.BATTLE_Y - 100, castle.arrowAngle, arrowDmg)
    );

    // 적군 성: 타겟 추적 직선 화살
    this.enemyCastle = new window.Castle(
      this, cfg.ENEMY_CASTLE_X, false, this.stageData.enemyCastleHp,
      cfg.ARROW_BASE_DAMAGE, arrowInterval,
      (castle, target) => this._spawnProjectile(castle.x, cfg.BATTLE_Y - 80, target, castle.arrowDamage, 300)
    );

    // --- 유닛 배열 ---
    this.allyUnits = [];
    this.enemyUnits = [];
    this.projectiles = [];      // 타겟 추적 투사체 (적군 성 화살)
    this.arcProjectiles = [];   // 각도 기반 포물선 투사체 (아군 성 화살)

    // 성이 서로를 공격 타겟으로 설정
    this.allyCastle.setTargets(this.enemyUnits);
    this.enemyCastle.setTargets(this.allyUnits);

    // --- Wave 시스템 (적 자동 소환) ---
    this.waveSystem = new window.WaveSystem(this, this.stageData, (unitId) => {
      this._spawnEnemy(unitId);
    });
    this.waveSystem.start();

    // --- 아군 자동 warrior 소환 타이머 ---
    this._startAutoSpawn();

    // --- HUD ---
    this.hud = new window.BattleHUD(
      this,
      this.costSystem,
      (unitId) => this._onSummonRequest(unitId),
      () => this._onSkillRequest()
    );

    // --- 화살 각도 스위치 UI (화면 고정) ---
    this._buildArrowAngleSwitch();

    // --- 전투 종료 플래그 ---
    this._battleOver = false;

    // --- 일시 정지 버튼 (좌상단) ---
    this._buildPauseButton();

    // --- 스테이지 표시 ---
    this.add.text(cfg.GAME_WIDTH / 2, 16, this.stageData.label, {
      fontSize: '16px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  _buildBackground() {
    const cfg = window.GameConfig;
    const W = cfg.WORLD_WIDTH;  // 월드 전체 너비에 걸쳐 배경 그리기
    const H = cfg.GAME_HEIGHT;
    const groundY = cfg.BATTLE_Y;

    // 하늘
    const sky = this.add.graphics();
    sky.fillStyle(cfg.COLOR.SKY);
    sky.fillRect(0, 0, W, groundY);

    // 지면
    const ground = this.add.graphics();
    ground.fillStyle(cfg.COLOR.GROUND);
    ground.fillRect(0, groundY, W, H - groundY);

    // 지평선 구분선
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

  // ── 화살 각도 스위치 (화면 좌측 고정) ─────────────────────
  _buildArrowAngleSwitch() {
    const cfg = window.GameConfig;
    // 성 중단 높이쯤, 화면 좌측에 고정
    const sx = 8;
    const sy = cfg.BATTLE_Y - 165;

    const bg = this.add.graphics().setScrollFactor(0).setDepth(20);
    bg.fillStyle(0x223355, 0.88);
    bg.fillRoundedRect(sx, sy, 48, 96, 8);

    this.add.text(sx + 24, sy + 6, '조준', {
      fontSize: '10px', color: '#aabbff'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(21);

    // ▲ 버튼 — 각도 증가 → 더 높이 → 짧게 (성 바로 앞)
    const btnUp = this.add.text(sx + 24, sy + 24, '▲', {
      fontSize: '18px', color: '#ffdd88'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true });

    btnUp.on('pointerdown', () => {
      const cfg = window.GameConfig;
      this._arrowAngle = Math.min(cfg.ARROW_ANGLE_MAX, this._arrowAngle + 5);
      this._angleText.setText(this._arrowAngle + '°');
      this.allyCastle.setArrowAngle(this._arrowAngle);
    });

    // 각도 표시
    this._angleText = this.add.text(sx + 24, sy + 50, this._arrowAngle + '°', {
      fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    // ▼ 버튼 — 각도 감소 → 낮게 → 멀리
    const btnDown = this.add.text(sx + 24, sy + 74, '▼', {
      fontSize: '18px', color: '#ffdd88'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true });

    btnDown.on('pointerdown', () => {
      const cfg = window.GameConfig;
      this._arrowAngle = Math.max(cfg.ARROW_ANGLE_MIN, this._arrowAngle - 5);
      this._angleText.setText(this._arrowAngle + '°');
      this.allyCastle.setArrowAngle(this._arrowAngle);
    });
  }

  // ── 아군 자동 warrior 소환 ─────────────────────────────────
  _startAutoSpawn() {
    const cfg = window.GameConfig;
    this._autoSpawnTimer = this.time.addEvent({
      delay: cfg.AUTO_SPAWN_INTERVAL,
      callback: () => {
        if (!this._battleOver) {
          this._spawnAlly('warrior');
        }
      },
      loop: true,
    });
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
    if (hero && hero.isSkillReady()) {
      hero.useSkill(this.enemyUnits);
    }
  }

  // ── 유닛 소환 ──────────────────────────────────────────────
  _spawnAlly(unitId) {
    const cfg = window.GameConfig;
    const save = window.SaveSystem.get();
    const stats = window.getUnitStats(unitId, save.upgrades);

    const x = cfg.ALLY_CASTLE_X + 30;
    const y = cfg.BATTLE_Y - stats.radius;

    let unit;
    if (unitId === 'hero') {
      unit = new window.Hero(this, x, y, stats);
    } else {
      unit = new window.AllyUnit(this, x, y, stats);
    }
    this.allyUnits.push(unit);
  }

  _spawnEnemy(unitId) {
    const cfg = window.GameConfig;
    const stats = Object.assign({}, window.UNITS[unitId]);

    const x = cfg.ENEMY_CASTLE_X - 30;
    const y = cfg.BATTLE_Y - stats.radius;

    const unit = new window.EnemyUnit(this, x, y, stats);
    this.enemyUnits.push(unit);
  }

  // ── 투사체 생성 ────────────────────────────────────────────
  // 타겟 추적 (적군 성 화살)
  _spawnProjectile(x, y, target, damage, speed) {
    const proj = new window.Projectile(this, x, y, target, damage, speed);
    this.projectiles.push(proj);
  }

  // 각도 기반 포물선 (아군 성 화살)
  _spawnArrow(x, y, angleDeg, damage) {
    const cfg = window.GameConfig;
    const proj = new window.ArcProjectile(
      this, x, y, angleDeg,
      cfg.ARROW_PROJ_SPEED, cfg.ARROW_GRAVITY, damage
    );
    this.arcProjectiles.push(proj);
  }

  // ── 매 프레임 업데이트 ────────────────────────────────────
  update(time, delta) {
    if (this._battleOver) return;

    const cfg = window.GameConfig;

    // 코스트 재생
    this.costSystem.update(delta);

    // 카메라 스크롤 (HUD 화살표 버튼)
    const scrollSpeed = 5;
    if (this.hud.isScrollingLeft) {
      this.cameras.main.scrollX = Math.max(0, this.cameras.main.scrollX - scrollSpeed);
    }
    if (this.hud.isScrollingRight) {
      const maxScroll = cfg.WORLD_WIDTH - cfg.GAME_WIDTH;
      this.cameras.main.scrollX = Math.min(maxScroll, this.cameras.main.scrollX + scrollSpeed);
    }

    // 죽은 유닛/투사체 정리
    this.allyUnits = this.allyUnits.filter(u => u.alive);
    this.enemyUnits = this.enemyUnits.filter(u => u.alive);
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.arcProjectiles = this.arcProjectiles.filter(p => p.alive);

    // 유닛 업데이트
    for (const u of this.allyUnits) {
      u.update(delta, this.enemyUnits, this.enemyCastle);
    }
    for (const u of this.enemyUnits) {
      u.update(delta, this.allyUnits, this.allyCastle);
    }

    // 투사체 업데이트
    for (const p of this.projectiles) {
      p.update(delta);
    }
    for (const p of this.arcProjectiles) {
      p.update(delta, this.enemyUnits);
    }

    // HUD 갱신
    const liveHero = this.allyUnits.find(u => u instanceof window.Hero) || null;
    this.hud.update(liveHero);

    // 승패 판정
    this._checkBattleEnd();
  }

  _checkBattleEnd() {
    if (!this.enemyCastle.alive) {
      this._endBattle(true);
    } else if (!this.allyCastle.alive) {
      this._endBattle(false);
    }
  }

  _endBattle(victory) {
    if (this._battleOver) return;
    this._battleOver = true;

    this.waveSystem.stop();
    if (this._autoSpawnTimer) this._autoSpawnTimer.remove(false);

    if (victory) {
      const save = window.SaveSystem.get();
      window.CurrencySystem.addGold(this.stageData.reward);
      if (!save.clearedStages.includes(this.stageId)) {
        save.clearedStages.push(this.stageId);
      }
      window.SaveSystem.persist();
    }

    this.time.delayedCall(800, () => {
      this.scene.start('ResultScene', {
        victory,
        stageId: this.stageId,
        reward: victory ? this.stageData.reward : 0,
      });
    });
  }
}

window.BattleScene = BattleScene;
