// Hero.js — 영웅 유닛 (AllyUnit 상속)
// 스킬: 광역 공격 (반경 80px 내 모든 적에게 3배 데미지, 5초 쿨다운)

class Hero extends AllyUnit {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
    this.skillCooldown = 0;
    this.SKILL_RANGE = 80;
    this.SKILL_MULTIPLIER = 3;
    this.SKILL_COOLDOWN = 5000; // ms
  }

  // BattleHUD의 스킬 버튼 클릭 시 호출
  useSkill(enemies) {
    if (this.skillCooldown > 0 || !this.alive) return false;

    this.skillCooldown = this.SKILL_COOLDOWN;

    // 범위 내 모든 적에게 광역 피해
    const damage = this.stats.atk * this.SKILL_MULTIPLIER;
    let hit = false;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dist = Math.abs(this.x - e.x);
      if (dist <= this.SKILL_RANGE) {
        e.takeDamage(damage);
        hit = true;
      }
    }

    // 스킬 시각 효과 (간단한 원형 플래시)
    this._showSkillEffect();
    return hit;
  }

  _playAttackAnim(targetX) {
    const dir = targetX > this.x ? 1 : -1;
    const origX = this.x;
    // 황금 섬광 + 전진 타격
    this._flashColor(0xffd700, 110);
    this.scene.tweens.add({
      targets: this,
      x: this.x + dir * 16,
      scaleX: 1.35,
      scaleY: 0.85,
      duration: 100,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => { if (this.alive) { this.x = origX; this.scaleX = 1; this.scaleY = 1; } },
    });
  }

  _showSkillEffect() {
    // 스킬 폭발: 큰 황금 링 + 강한 섬광
    this._flashColor(0xffffff, 150);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.6, scaleY: 1.6,
      duration: 80,
      ease: 'Power3',
      yoyo: true,
    });
    const fx = this.scene.add.graphics();
    fx.fillStyle(0xffd700, 0.35);
    fx.fillCircle(this.x, this.y, this.SKILL_RANGE);
    fx.lineStyle(3, 0xffffff, 0.8);
    fx.strokeCircle(this.x, this.y, this.SKILL_RANGE);
    this.scene.tweens.add({
      targets: fx,
      scaleX: 1.3, scaleY: 1.3,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => fx.destroy(),
    });
  }

  update(delta, enemies, enemyCastle) {
    this.skillCooldown = Math.max(0, this.skillCooldown - delta);
    super.update(delta, enemies, enemyCastle);
  }

  // 스킬 쿨다운 비율 0~1 (HUD용)
  getSkillCooldownRatio() {
    return this.skillCooldown / this.SKILL_COOLDOWN;
  }

  isSkillReady() {
    return this.skillCooldown <= 0 && this.alive;
  }
}

window.Hero = Hero;
