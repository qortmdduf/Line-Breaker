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

  _showSkillEffect() {
    const fx = this.scene.add.graphics();
    fx.fillStyle(0xffd700, 0.4);
    fx.fillCircle(this.x, this.y, this.SKILL_RANGE);
    this.scene.time.delayedCall(300, () => { fx.destroy(); });
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
