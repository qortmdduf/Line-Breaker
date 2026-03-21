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

    // --- 배경 ---
    this._buildBackground();

    // --- 시스템 초기화 ---
    this.costSystem = new window.CostSystem();

    // --- 업그레이드 적용 화살 스탯 ---
    const arrowDmgLevel = (save.upgrades['arrow_dmg']) || 0;
    const arrowSpdLevel = (save.upgrades['arrow_spd']) || 0;
    const arrowDmg = cfg.ARROW_BASE_DAMAGE + arrowDmgLevel * 10;
    const arrowInterval = cfg.ARROW_INTERVAL;
    // arrow_spd 업그레이드: 레벨당 +40 px/s
    const arrowProjSpeed = 300 + arrowSpdLevel * 40;

    // --- 성 생성 ---
    this.allyCastle = new window.Castle(
      this, cfg.ALLY_CASTLE_X, true, cfg.CASTLE_HP_ALLY,
      arrowDmg, arrowInterval,
      (castle, target) => this._spawnProjectile(castle.x, cfg.BATTLE_Y - 80, target, castle.arrowDamage, arrowProjSpeed)
    );

    // 적군 성은 업그레이드와 무관한 고정 수치를 사용한다
    this.enemyCastle = new window.Castle(
      this, cfg.ENEMY_CASTLE_X, false, this.stageData.enemyCastleHp,
      cfg.ARROW_BASE_DAMAGE, arrowInterval,
      (castle, target) => this._spawnProjectile(castle.x, cfg.BATTLE_Y - 80, target, castle.arrowDamage, 300)
    );

    // --- 유닛 배열 ---
    this.allyUnits = [];
    this.enemyUnits = [];
    this.projectiles = [];

    // 성이 서로를 공격 타겟으로 설정
    this.allyCastle.setTargets(this.enemyUnits);
    this.enemyCastle.setTargets(this.allyUnits);

    // --- Wave 시스템 ---
    this.waveSystem = new window.WaveSystem(this, this.stageData, (unitId) => {
      this._spawnEnemy(unitId);
    });
    this.waveSystem.start();

    // --- HUD ---
    this.hud = new window.BattleHUD(
      this,
      this.costSystem,
      (unitId) => this._onSummonRequest(unitId),
      () => this._onSkillRequest()
    );

    // --- 전투 종료 플래그 ---
    this._battleOver = false;

    // --- 일시 정지 버튼 (좌상단) ---
    this._buildPauseButton();

    // --- 스테이지 표시 ---
    this.add.text(cfg.GAME_WIDTH / 2, 16, this.stageData.label, {
      fontSize: '16px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(10);
  }

  _buildBackground() {
    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
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
    }).setOrigin(1, 0).setDepth(15).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      // 로비로 귀환 (전투 포기)
      this.waveSystem.stop();
      this.scene.start('LobbyScene');
    });
  }

  // ── 소환 요청 ──────────────────────────────────────────────
  _onSummonRequest(unitId) {
    if (this._battleOver) return;

    const save = window.SaveSystem.get();
    const unit = window.UNITS[unitId];

    // 영웅은 1회만 — 코스트 체크 전에 중복 사용만 막는다
    if (unit.isHero && save.heroUsed) return;

    // 코스트 확인 — 차감 실패 시 플래그 변경 없이 조기 종료
    if (!this.costSystem.spend(unit.cost)) return;

    // 코스트 차감 성공 후 영웅 사용 플래그 확정
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
    // 적 유닛은 업그레이드 없음 (기본 스탯)
    const stats = Object.assign({}, window.UNITS[unitId]);

    const x = cfg.ENEMY_CASTLE_X - 30;
    const y = cfg.BATTLE_Y - stats.radius;

    const unit = new window.EnemyUnit(this, x, y, stats);
    this.enemyUnits.push(unit);
  }

  _spawnProjectile(x, y, target, damage, speed) {
    const proj = new window.Projectile(this, x, y, target, damage, speed);
    this.projectiles.push(proj);
  }

  // ── 매 프레임 업데이트 ────────────────────────────────────
  update(time, delta) {
    if (this._battleOver) return;

    // 코스트 재생
    this.costSystem.update(delta);

    // 죽은 유닛 정리 (alive=false)
    this.allyUnits = this.allyUnits.filter(u => u.alive);
    this.enemyUnits = this.enemyUnits.filter(u => u.alive);
    this.projectiles = this.projectiles.filter(p => p.alive);

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

    // HUD 갱신 (살아있는 영웅 참조 전달 — 스킬 버튼 상태 갱신용)
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

    if (victory) {
      // 골드 획득 및 스테이지 클리어 기록
      const save = window.SaveSystem.get();
      window.CurrencySystem.addGold(this.stageData.reward);
      if (!save.clearedStages.includes(this.stageId)) {
        save.clearedStages.push(this.stageId);
      }
      window.SaveSystem.persist();
    }

    // 짧은 딜레이 후 ResultScene 전환
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
