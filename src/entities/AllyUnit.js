// AllyUnit.js — 아군 유닛
// Unit 상속, 색상만 유닛 타입별로 다름

class AllyUnit extends Unit {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats, true);
    this.unitId = stats.id;
  }

  _getColor() {
    const cfg = window.GameConfig;
    const colorMap = {
      warrior: cfg.COLOR.WARRIOR_ALLY,
      archer:  cfg.COLOR.ARCHER_ALLY,
      knight:  cfg.COLOR.KNIGHT_ALLY,
      mage:    cfg.COLOR.MAGE_ALLY,
      hero:    cfg.COLOR.HERO_ALLY,
    };
    return colorMap[this.stats.id] || cfg.COLOR.WHITE;
  }
}

window.AllyUnit = AllyUnit;
