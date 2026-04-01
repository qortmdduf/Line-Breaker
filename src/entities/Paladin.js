// Paladin.js — 성기사 (AllyUnit 상속)
// 주변 아군에게 ATK+20%, 피해-10% 버프를 최대 3스택 적용
// 버프 범위: 성기사 기준 auraRadius(100px) 반경
// [PROTO BEGIN]

class Paladin extends AllyUnit {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
    // 오라 시각 효과 (반투명 원) — 유닛 아래 레이어에 표시
    this._auraGfx = scene.add.graphics().setDepth(2);
    this._drawAura();
  }

  _drawAura() {
    const r = this.stats.auraRadius || 100;
    this._auraGfx.clear();
    this._auraGfx.fillStyle(0xffcc00, 0.10);
    this._auraGfx.fillCircle(0, 0, r);
    this._auraGfx.lineStyle(1.5, 0xffcc00, 0.40);
    this._auraGfx.strokeCircle(0, 0, r);
    this._auraGfx.setPosition(this.x, this.y);
  }

  update(delta, enemies, castleTarget, allies) {
    super.update(delta, enemies, castleTarget);

    // 오라 위치는 매 프레임 유닛과 함께 갱신
    if (this._auraGfx) {
      this._auraGfx.setPosition(this.x, this.y);
    }

    // 버프 적용: 주변 아군에게 오라 효과 부여
    if (allies) this._applyAura(allies);
  }

  _applyAura(allies) {
    const r = this.stats.auraRadius || 100;
    const MAX_STACKS = 3;
    const spdBonus = this.stats.auraSpeedBonus || 0;

    for (const ally of allies) {
      if (!ally.alive || ally === this) continue;
      const dx = ally.x - this.x;
      const dy = ally.y - this.y;
      const inRange = Math.sqrt(dx * dx + dy * dy) <= r;

      if (inRange) {
        // 팔라딘 중첩: BattleScene이 매 프레임 리셋 후 이 메서드로 재합산
        ally._paladinDmgReduction = Math.min(MAX_STACKS * 0.10, (ally._paladinDmgReduction || 0) + 0.10);
        ally._paladinAtkBonus    = Math.min(MAX_STACKS * 0.20, (ally._paladinAtkBonus    || 0) + 0.20);
        if (spdBonus > 0) {
          ally._paladinSpdBonus  = Math.min(MAX_STACKS * spdBonus, (ally._paladinSpdBonus || 0) + spdBonus);
        }
      }
    }
  }

  die() {
    // 오라 그래픽을 먼저 제거한 후 부모 die() 호출
    if (this._auraGfx) {
      this._auraGfx.destroy();
      this._auraGfx = null;
    }
    super.die();
  }
}

window.Paladin = Paladin;
// [PROTO END]
