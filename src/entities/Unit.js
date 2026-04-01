// Unit.js — 유닛 기본 클래스
// Phaser.GameObjects.Container 기반
// AllyUnit, EnemyUnit, Hero가 이 클래스를 상속한다

class Unit extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} stats  - units.js의 스탯 (업그레이드 적용 후)
   * @param {boolean} isAlly
   */
  constructor(scene, x, y, stats, isAlly) {
    super(scene, x, y);

    this.stats = stats;
    this.isAlly = isAlly;
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.attackCooldown = 0;
    this.target = null;
    this.alive = true;

    // 사망 시 콜백 (e.g. 킬 코스트 획득)
    this.onDie = null;

    // 팔라딘 버프: 매 프레임 BattleScene에서 리셋 후 Paladin._applyAura가 재설정
    this._paladinDmgReduction = 0;  // 피해 감소 비율 (0~0.3)
    this._paladinAtkBonus = 0;      // ATK 증가 비율 (0~0.6)
    this._paladinSpdBonus = 0;      // 이동속도 증가 비율 (0~0.15)

    // 화상 DoT 상태
    this._burnDamage = 0;
    this._burnTimer  = 0;   // ms 남은 시간
    this._burnAccum  = 0;   // 초당 데미지 누산용

    // 이동 방향: 아군은 오른쪽(+1), 적군은 왼쪽(-1)
    this.direction = isAlly ? 1 : -1;

    this._buildGraphics();

    scene.add.existing(this);
  }

  _buildGraphics() {
    const cfg = window.GameConfig;
    const r = this.stats.radius;

    // 몸체 원
    this._body = this.scene.add.graphics();
    this._drawBody();
    this.add(this._body);

    // HP 바 배경
    this._hpBg = this.scene.add.graphics();
    this._hpBg.fillStyle(cfg.COLOR.HP_BG);
    this._hpBg.fillRect(-r, -(r + 8), r * 2, 4);
    this.add(this._hpBg);

    // HP 바 전경
    this._hpBar = this.scene.add.graphics();
    this.add(this._hpBar);

    this._updateHpBar();
  }

  _drawBody() {
    const color = this._getColor();
    const r = this.stats.radius;
    this._body.clear();
    this._body.fillStyle(color);
    this._body.fillCircle(0, 0, r);
  }

  // 서브클래스에서 오버라이드
  _getColor() {
    return window.GameConfig.COLOR.WHITE;
  }

  _updateHpBar() {
    const cfg = window.GameConfig;
    const r = this.stats.radius;
    const ratio = Math.max(0, this.hp / this.maxHp);
    // 화상 중: 주황색, 평상시: 기본색
    const color = this._burnTimer > 0
      ? 0xff6600
      : (this.isAlly ? cfg.COLOR.HP_GREEN : cfg.COLOR.HP_RED);

    this._hpBar.clear();
    if (ratio > 0) {
      this._hpBar.fillStyle(color);
      this._hpBar.fillRect(-r, -(r + 8), Math.floor(r * 2 * ratio), 4);
    }
  }

  /**
   * @param {number} delta ms
   * @param {Unit[]} enemies  - 공격 대상이 될 수 있는 유닛 배열
   * @param {object} enemyCastle  - { x, hp, takeDamage }
   */
  /**
   * 화상 디버프 적용 — 중첩 없음, 지속시간 갱신
   * @param {number} damage 초당 데미지
   * @param {number} duration ms
   */
  applyBurn(damage, duration) {
    this._burnDamage = damage;
    this._burnTimer  = duration;  // 항상 덮어씌워 갱신 (중첩 불가)
  }

  update(delta, enemies, enemyCastle) {
    if (!this.alive) return;

    // 화상 DoT 처리
    if (this._burnTimer > 0) {
      this._burnTimer -= delta;
      this._burnAccum += delta;
      if (this._burnAccum >= 1000) {
        this._burnAccum -= 1000;
        this.takeDamage(this._burnDamage);
        if (!this.alive) return;
      }
      if (this._burnTimer <= 0) {
        this._burnTimer = 0;
        this._burnAccum = 0;
        this._updateHpBar(); // 화상 색 제거
      }
    }

    this.attackCooldown -= delta;

    // 1. 살아있는 적 중 사거리 안에 있는 가장 가까운 것 탐색
    this.target = this._findTarget(enemies);

    if (this.target) {
      // 사거리 안: 공격 (방패병은 공격 능력 없음)
      if (this.attackCooldown <= 0 && !this.stats.isShielder) {
        this._doAttack(this.target);
      }
    } else {
      // 사거리 밖: 적 성 방향으로 이동 (팔라딘 이동속도 오라 반영)
      const spd = this.stats.spd * (1 + this._paladinSpdBonus) * (delta / 1000);

      // 적 성에 닿으면 공격
      const distToCastle = Math.abs(this.x - enemyCastle.x);
      if (distToCastle <= this.stats.range) {
        if (this.attackCooldown <= 0 && !this.stats.isShielder) {
          this.attackCooldown = this.stats.atkSpd;
          enemyCastle.takeDamage(this.stats.atk);
        }
      } else {
        this.x += this.direction * spd;
      }
    }
  }

  _findTarget(enemies) {
    if (!enemies || enemies.length === 0) return null;

    let closest = null;
    let closestDist = Infinity;

    for (const e of enemies) {
      if (!e.alive) continue;
      const dist = Math.abs(this.x - e.x);
      if (dist <= this.stats.range && dist < closestDist) {
        closest = e;
        closestDist = dist;
      }
    }
    return closest;
  }

  _doAttack(target) {
    this.attackCooldown = this.stats.atkSpd;
    this._playAttackAnim(target.x); // 공격 애니메이션 훅
    // 팔라딘 ATK 버프 반영
    const effectiveAtk = Math.floor(this.stats.atk * (1 + this._paladinAtkBonus));
    target.takeDamage(effectiveAtk);
  }

  // ── 공격 애니메이션 훅 ────────────────────────────────────
  // 서브클래스에서 오버라이드. 스프라이트 전환 시 this._sprite.play('attack')으로 교체.
  _playAttackAnim(targetX) {}

  // 피격 플래시 (흰색 — 모든 유닛 공통)
  _flashHit() {
    if (!this.alive || !this._body) return;
    const origColor = this._getColor();
    this._body.clear();
    this._body.fillStyle(0xffffff, 0.85);
    this._body.fillCircle(0, 0, this.stats.radius);
    this.scene.time.delayedCall(80, () => {
      if (this.alive && this._body) this._drawBody();
    });
  }

  takeDamage(amount) {
    if (!this.alive) return;
    // 유닛 고유 damageReduction(철갑 기사 등) + 팔라딘 버프 합산, 최대 75%
    const reduction = Math.min(0.75,
      (this.stats.damageReduction || 0) + this._paladinDmgReduction);
    amount = Math.max(1, Math.floor(amount * (1 - reduction)));
    this.hp -= amount;
    this._updateHpBar();
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    if (this.onDie) this.onDie(this);
    this.destroy();
  }
}

window.Unit = Unit;
