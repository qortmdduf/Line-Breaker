// CostSystem.js — 전투 코스트 자동 재생 시스템
// 전투 중에만 사용되는 인스턴스 기반 클래스
// BattleScene에서 new CostSystem()으로 생성

class CostSystem {
  constructor() {
    const cfg = window.GameConfig;
    this.current = 0;              // 전투 시작 시 0 (코스트 모아서 소환)
    this.max = cfg.COST_MAX;
    this.regenRate = cfg.COST_REGEN_RATE; // 초당
  }

  // delta: ms 단위 — accumulator 없이 delta 기반으로 매 프레임 정밀 누적
  update(delta) {
    this.current = Math.min(this.max, this.current + this.regenRate * (delta / 1000));
  }

  // 코스트 차감 시도. 성공 true, 부족 false
  spend(amount) {
    if (this.current < amount) return false;
    this.current -= amount;
    return true;
  }

  // 킬 보상 등으로 코스트 획득
  gainCost(amount) {
    this.current = Math.min(this.max, this.current + amount);
  }

  // 0~1 비율 반환 (HUD 바 렌더링용)
  getRatio() {
    return this.current / this.max;
  }
}

window.CostSystem = CostSystem;
