// Castle.js — 성 엔티티
// 색상 도형(직사각형) + HP 바 + 화살 발사

class Castle {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {boolean} isAlly
   * @param {number} hp
   * @param {number} arrowDamage  - 화살 데미지
   * @param {number} arrowInterval - 화살 발사 간격 ms
   * @param {function} onProjectile - 투사체 생성 콜백 (castle, targetUnit)
   */
  constructor(scene, x, isAlly, hp, arrowDamage, arrowInterval, onProjectile) {
    this.scene = scene;
    this.x = x;
    this.isAlly = isAlly;
    this.hp = hp;
    this.maxHp = hp;
    this.arrowDamage = arrowDamage;
    this.alive = true;
    this.onProjectile = onProjectile;

    const cfg = window.GameConfig;
    const W = 40, H = 120;
    const color = isAlly ? cfg.COLOR.ALLY_CASTLE : cfg.COLOR.ENEMY_CASTLE;
    const battleY = cfg.BATTLE_Y;

    // 성 몸체
    this._body = scene.add.graphics();
    this._body.fillStyle(color);
    this._body.fillRect(x - W / 2, battleY - H, W, H);

    // 성루 (상단 장식)
    this._tower = scene.add.graphics();
    this._tower.fillStyle(color);
    // 중앙 탑
    this._tower.fillRect(x - 8, battleY - H - 20, 16, 20);
    // 좌우 탑
    this._tower.fillRect(x - W / 2, battleY - H - 14, 10, 14);
    this._tower.fillRect(x + W / 2 - 10, battleY - H - 14, 10, 14);

    // HP 바 배경
    this._hpBg = scene.add.graphics();
    this._hpBg.fillStyle(cfg.COLOR.HP_BG);
    this._hpBg.fillRect(x - 30, battleY - H - 36, 60, 8);

    // HP 바
    this._hpBar = scene.add.graphics();
    this._updateHpBar();

    // HP 텍스트
    this._hpText = scene.add.text(x, battleY - H - 50, '', {
      fontSize: '11px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);
    this._updateHpText();

    // 화살 발사 타이머
    this._arrowTimer = scene.time.addEvent({
      delay: arrowInterval,
      callback: this._shootArrow,
      callbackScope: this,
      loop: true,
    });

    // 현재 공격 대상 배열 참조 (BattleScene이 주입)
    this.enemyTargets = null;

    // 아군 성 화살 각도
    this.arrowAngle = isAlly ? (window.GameConfig.ARROW_ANGLE || 30) : 0;

    // HP 10% 단위 감소 시 콜백 (아군 성 긴장감 효과용)
    this.onDamageThreshold = null;
    this._lastHpTenth = 10;  // 100% = 10
  }

  _updateHpBar() {
    const cfg = window.GameConfig;
    const ratio = Math.max(0, this.hp / this.maxHp);
    const color = this.isAlly ? cfg.COLOR.HP_GREEN : cfg.COLOR.HP_RED;
    const battleY = cfg.BATTLE_Y;

    this._hpBar.clear();
    if (ratio > 0) {
      this._hpBar.fillStyle(color);
      this._hpBar.fillRect(this.x - 30, battleY - 120 - 36, Math.floor(60 * ratio), 8);
    }
  }

  _updateHpText() {
    if (this._hpText) {
      this._hpText.setText(Math.max(0, this.hp) + '/' + this.maxHp);
    }
  }

  takeDamage(amount) {
    if (!this.alive) return;
    const prevTenth = Math.floor(Math.max(0, this.hp) / this.maxHp * 10);
    this.hp -= amount;
    this._updateHpBar();
    this._updateHpText();

    // 아군 성 HP가 10% 단위로 감소할 때마다 긴장감 효과 발동
    if (this.isAlly && this.onDamageThreshold) {
      const newTenth = Math.floor(Math.max(0, this.hp) / this.maxHp * 10);
      if (newTenth < prevTenth) this.onDamageThreshold();
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this._arrowTimer.remove(false);
    }
  }

  _shootArrow() {
    if (!this.alive || !this.onProjectile) return;

    if (this.isAlly) {
      // 아군 성: 각도 기반 포물선 발사 (타겟 불필요)
      this.onProjectile(this, null);
    } else {
      // 적군 성: 가장 가까운 아군 유닛을 직선 추적
      if (!this.enemyTargets) return;
      let closest = null;
      let closestDist = Infinity;
      for (const e of this.enemyTargets) {
        if (!e.alive) continue;
        const dist = Math.abs(this.x - e.x);
        if (dist < closestDist) {
          closest = e;
          closestDist = dist;
        }
      }
      if (closest) {
        this.onProjectile(this, closest);
      }
    }
  }

  // BattleScene의 각도 스위치에서 호출
  setArrowAngle(angle) {
    this.arrowAngle = angle;
  }

  // 외부에서 적 배열 주입 (BattleScene이 매 프레임 갱신)
  setTargets(targets) {
    this.enemyTargets = targets;
  }

  destroy() {
    if (this._arrowTimer) this._arrowTimer.remove(false);
    [this._body, this._tower, this._hpBg, this._hpBar, this._hpText].forEach(obj => {
      if (obj) obj.destroy();
    });
  }
}

window.Castle = Castle;
