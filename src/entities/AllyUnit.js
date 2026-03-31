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

  // splashRadius가 있으면 범위 공격, 없으면 단일 공격
  // _doAttack은 enemies 배열을 받아야 하므로 Unit.update가 호출하는 방식에 맞게 오버라이드
  // Unit.js의 update에서 this._doAttack(this.target)으로 호출되므로
  // enemies는 별도로 저장해 참조한다
  update(delta, enemies, castleTarget, allies = null) {
    // 이후 _doAttack에서 enemies 배열 참조가 필요하므로 캐싱
    this._lastEnemies = enemies;
    super.update(delta, enemies, castleTarget);
  }

  _doAttack(target) {
    this.attackCooldown = this.stats.atkSpd;
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
      // 범위 공격: 타겟 위치 기준 splashRadius 내 모든 살아있는 적에게 피해
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
}

window.AllyUnit = AllyUnit;
