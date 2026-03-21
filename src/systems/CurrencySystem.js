// CurrencySystem.js — 골드 관리
// window.CurrencySystem 으로 전역 접근
// SaveSystem에 의존 — SaveSystem.js 이후에 로드되어야 한다

window.CurrencySystem = (function() {
  function getGold() {
    return window.SaveSystem.get().gold;
  }

  function addGold(amount) {
    const save = window.SaveSystem.get();
    save.gold += amount;
    window.SaveSystem.persist();
  }

  // 골드 차감 시도. 성공하면 true, 부족하면 false
  function spendGold(amount) {
    const save = window.SaveSystem.get();
    if (save.gold < amount) return false;
    save.gold -= amount;
    window.SaveSystem.persist();
    return true;
  }

  return { getGold, addGold, spendGold };
})();
