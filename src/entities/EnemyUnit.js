// EnemyUnit.js — 적군 유닛
// Unit 상속, 왼쪽(아군 성) 방향으로 이동

class EnemyUnit extends Unit {
  constructor(scene, x, y, stats) {
    // 적군은 isAlly=false
    super(scene, x, y, stats, false);
    this.unitId = stats.id;

    // 엘리트: Container 전체를 1.5배 확대 (몸체 + HP바 포함)
    if (stats.isElite) {
      this.setScale(1.5);
    }
  }

  _getColor() {
    const cfg = window.GameConfig;

    // 엘리트: 진한 붉은색으로 구분
    if (this.stats.isElite) return 0x8b0000;

    const colorMap = {
      warrior: cfg.COLOR.WARRIOR_ENEMY,
      archer:  cfg.COLOR.ARCHER_ENEMY,
      knight:  cfg.COLOR.KNIGHT_ENEMY,
      mage:    cfg.COLOR.MAGE_ENEMY,
      hero:    cfg.COLOR.WARRIOR_ENEMY, // 적 영웅은 주황색 (더 크게 구별)
    };
    return colorMap[this.stats.id] || cfg.COLOR.WHITE;
  }
}

window.EnemyUnit = EnemyUnit;
