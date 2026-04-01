// AllyUnit.js — 아군 유닛
// Unit 상속, 색상 및 범위 공격(splashRadius) 지원

class AllyUnit extends Unit {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats, true);
    this.unitId = stats.id;
  }

  _getColor() {
    const cfg = window.GameConfig;
    const colorMap = {
      warrior:      cfg.COLOR.WARRIOR_ALLY,
      archer:       cfg.COLOR.ARCHER_ALLY,
      knight:       cfg.COLOR.KNIGHT_ALLY,
      mage:         cfg.COLOR.MAGE_ALLY,
      hero:         cfg.COLOR.HERO_ALLY,
      shielder:     cfg.COLOR.SHIELDER_ALLY,
      paladin:      cfg.COLOR.PALADIN_ALLY,
      serpent_mage: cfg.COLOR.SERPENT_MAGE_ALLY,
    };
    return colorMap[this.stats.id] || cfg.COLOR.WHITE;
  }

  update(delta, enemies, castleTarget, allies = null) {
    this._lastEnemies = enemies;
    super.update(delta, enemies, castleTarget);
  }

  _doAttack(target) {
    this.attackCooldown = this.stats.atkSpd;
    this._playAttackAnim(target.x);
    const atk = Math.floor(this.stats.atk * (1 + this._paladinAtkBonus));

    // 궁수: 투사체 생성
    if (this.unitId === 'archer') {
      if (this.scene && this.scene.projectiles) {
        this.scene.projectiles.push(
          new window.Projectile(this.scene, this.x, this.y - this.stats.radius, target, atk, 400)
        );
      }
      return;
    }

    if (this.stats.splashRadius && this._lastEnemies) {
      const sr = this.stats.splashRadius;
      for (const e of this._lastEnemies) {
        if (!e.alive) continue;
        const dx = e.x - target.x;
        const dy = e.y - target.y;
        if (Math.sqrt(dx * dx + dy * dy) <= sr) {
          e.takeDamage(atk);
        }
      }
    } else {
      target.takeDamage(atk);
    }
  }

  // ── 공격 애니메이션 ───────────────────────────────────────
  // 스프라이트 전환 시: 이 메서드에서 this._sprite.play(this.unitId + '_attack') 호출로 교체.
  _playAttackAnim(targetX) {
    switch (this.unitId) {
      case 'warrior':     return this._animLunge(targetX);
      case 'archer':      return this._animBowShot();
      case 'knight':      return this._animHeavySwing(targetX);
      case 'mage':        return this._animMagicBurst(0xcc66ff);
      case 'shielder':    return; // 공격 없음
      case 'paladin':     return this._animPaladinStrike(targetX);
      case 'serpent_mage':return this._animMagicBurst(0x00ffaa);
      default:            return this._animScalePunch(1.2, 70);
    }
  }

  // 전사: 앞으로 돌진 후 복귀
  _animLunge(targetX) {
    const dir = targetX > this.x ? 1 : -1;
    const origX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: this.x + dir * 12,
      scaleX: 1.2,
      duration: 70,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => { if (this.alive) { this.x = origX; this.scaleX = 1; } },
    });
  }

  // 궁수: 활시위 당기듯 X 방향 압축 후 튕김
  _animBowShot() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.65,
      scaleY: 1.25,
      duration: 90,
      ease: 'Power1',
      yoyo: true,
    });
    this._flashColor(0xaaffaa, 120);
  }

  // 기사: 천천히 크게 부풀었다 빠르게 꺼짐 + 흰 섬광
  _animHeavySwing(targetX) {
    const dir = targetX > this.x ? 1 : -1;
    this._flashColor(0xffffff, 90);
    this.scene.tweens.add({
      targets: this,
      x: this.x + dir * 10,
      scaleX: 1.35,
      scaleY: 0.80,
      duration: 130,
      ease: 'Power1',
      yoyo: true,
    });
  }

  // 마법사 / 뱀 마법사: 방사형 확대 + 고유 색 섬광
  _animMagicBurst(flashColor) {
    this._flashColor(flashColor, 140);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 65,
      ease: 'Power3',
      yoyo: true,
    });
    // 폭발 링 이펙트
    const ring = this.scene.add.graphics();
    ring.lineStyle(2, flashColor, 0.7);
    ring.strokeCircle(this.x, this.y, this.stats.radius);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.5, scaleY: 2.5,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  // 성기사(기사단): 전진 타격 + 오라 링 섬광
  _animPaladinStrike(targetX) {
    const dir = targetX > this.x ? 1 : -1;
    const origX = this.x;
    this._flashColor(0xffee88, 100);
    this.scene.tweens.add({
      targets: this,
      x: this.x + dir * 10,
      scaleX: 1.25,
      duration: 90,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => { if (this.alive) { this.x = origX; this.scaleX = 1; } },
    });
    // 오라 링 확산
    const r = this.stats.auraRadius || 100;
    const ring = this.scene.add.graphics();
    ring.lineStyle(2, 0xffdd44, 0.6);
    ring.strokeCircle(this.x, this.y, r * 0.4);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.8, scaleY: 1.8,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  // 범용 스케일 펀치
  _animScalePunch(scale = 1.25, duration = 70) {
    this.scene.tweens.add({
      targets: this,
      scaleX: scale,
      scaleY: scale,
      duration,
      ease: 'Power2',
      yoyo: true,
    });
  }

  // 몸체 색상 순간 변경 후 복원
  _flashColor(color, duration) {
    if (!this.alive || !this._body) return;
    this._body.clear();
    this._body.fillStyle(color, 0.9);
    this._body.fillCircle(0, 0, this.stats.radius);
    this.scene.time.delayedCall(duration, () => {
      if (this.alive && this._body) this._drawBody();
    });
  }
}

window.AllyUnit = AllyUnit;
