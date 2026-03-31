// UpgradeScene.js — 업그레이드 화면
// HTML DOM 오버레이 방식으로 네이티브 모바일 스크롤을 구현한다.

class UpgradeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradeScene' });
    this._overlay = null;
  }

  create() {
    this._buildOverlay();
  }

  // ── HTML 오버레이 생성 ──────────────────────────────────
  _buildOverlay() {
    const save = window.SaveSystem.get();
    const gold = window.CurrencySystem.getGold();

    const overlay = document.createElement('div');
    overlay.id = 'upgrade-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100vw', 'height:100vh',
      'overflow-y:auto',
      '-webkit-overflow-scrolling:touch',
      'overscroll-behavior:contain',
      'background:#0a1520',
      'color:#fff',
      'font-family:sans-serif',
      'z-index:9999',
      'box-sizing:border-box',
    ].join(';');

    overlay.innerHTML = this._buildHTML(save, gold);
    this._attachEvents(overlay);

    document.body.appendChild(overlay);
    this._overlay = overlay;
  }

  _buildHTML(save, gold) {
    let rows = '';

    // 섹션 1: 유닛 해금
    rows += this._sectionHTML('유닛 해금');
    for (const unitId of ['knight', 'mage', 'hero']) {
      rows += this._unlockRowHTML(unitId, save, gold);
    }

    // 섹션 2: 유닛 강화
    rows += this._sectionHTML('유닛 강화');
    const upgKeys = [
      'warrior_hp', 'warrior_atk',
      'archer_hp',  'archer_atk',
      'knight_hp',  'knight_atk',
      'mage_hp',    'mage_atk',
    ];
    for (const key of upgKeys) {
      const upg = window.UPGRADES[key];
      if (upg.requireUnit && !save.unlockedUnits.includes(upg.requireUnit)) continue;
      rows += this._upgradeRowHTML(key, save, gold);
    }

    // 섹션 3: 성 화살 강화
    rows += this._sectionHTML('성 화살 강화');
    for (const key of ['arrow_dmg', 'arrow_spd']) {
      rows += this._upgradeRowHTML(key, save, gold);
    }

    return `
      <div style="
        position:sticky;top:0;
        background:#1a2a40;
        padding:12px 16px;
        display:flex;justify-content:space-between;align-items:center;
        z-index:10;
      ">
        <button id="upg-back" style="
          background:none;border:none;
          color:#aaccff;font-size:16px;cursor:pointer;padding:4px 8px;
        ">← 뒤로</button>
        <span style="font-size:20px;font-weight:bold;">업그레이드</span>
        <span style="color:#ffd700;font-size:16px;">${gold} G</span>
      </div>
      <div style="padding:8px 10px 48px;">${rows}</div>
    `;
  }

  _sectionHTML(label) {
    return `
      <div style="
        font-size:13px;color:#88aacc;font-weight:bold;
        padding:12px 4px 4px;
        border-bottom:1px solid #334466;
        margin-bottom:6px;
      ">${label}</div>
    `;
  }

  _upgradeRowHTML(key, save, gold) {
    const upg          = window.UPGRADES[key];
    const currentLevel = save.upgrades[key] || 0;
    const maxLevel     = upg.maxLevel;
    const cost         = window.calcUpgradeCost(key, currentLevel);
    const maxed        = currentLevel >= maxLevel;
    const canBuy       = !maxed && gold >= cost;

    let btnStyle, btnText, btnAttr;
    if (maxed) {
      btnStyle = 'background:#446644;color:#fff;';
      btnText  = 'MAX';
      btnAttr  = 'disabled';
    } else {
      btnStyle = canBuy
        ? 'background:#335599;color:#fff;cursor:pointer;'
        : 'background:#553333;color:#888;';
      btnText  = cost + 'G';
      btnAttr  = canBuy ? `data-action="upgrade" data-key="${key}"` : 'disabled';
    }

    return `
      <div style="
        background:#223355;border-radius:8px;
        padding:10px 12px;margin-bottom:8px;
        display:flex;justify-content:space-between;align-items:center;
      ">
        <div>
          <div style="font-size:14px;">${upg.label}</div>
          <div style="font-size:12px;color:#aaa;">Lv ${currentLevel} / ${maxLevel}</div>
        </div>
        <button ${btnAttr} style="
          border:none;border-radius:6px;
          padding:8px 14px;font-size:13px;min-width:64px;
          ${btnStyle}
        ">${btnText}</button>
      </div>
    `;
  }

  _unlockRowHTML(unitId, save, gold) {
    const unit    = window.UNITS[unitId];
    const cost    = window.UNLOCK_COSTS[unitId];
    const unlocked = save.unlockedUnits.includes(unitId);
    const canBuy  = !unlocked && gold >= cost;

    let btnStyle, btnText, btnAttr, desc;
    if (unlocked) {
      btnStyle = 'background:#446644;color:#fff;';
      btnText  = '완료';
      btnAttr  = 'disabled';
      desc     = '<span style="color:#44cc44;">해금 완료</span>';
    } else {
      btnStyle = canBuy
        ? 'background:#885500;color:#ffd700;cursor:pointer;'
        : 'background:#553333;color:#888;';
      btnText  = cost + 'G';
      btnAttr  = canBuy ? `data-action="unlock" data-unit="${unitId}"` : 'disabled';
      desc     = `<span style="color:#ffdd88;">비용: ${cost} Gold</span>`;
    }

    return `
      <div style="
        background:#332233;border-radius:8px;
        padding:10px 12px;margin-bottom:8px;
        display:flex;justify-content:space-between;align-items:center;
      ">
        <div>
          <div style="font-size:14px;">${unit.name} 해금</div>
          <div style="font-size:12px;">${desc}</div>
        </div>
        <button ${btnAttr} style="
          border:none;border-radius:6px;
          padding:8px 14px;font-size:13px;min-width:64px;
          ${btnStyle}
        ">${btnText}</button>
      </div>
    `;
  }

  // ── 이벤트 연결 ────────────────────────────────────────
  _attachEvents(overlay) {
    // 뒤로 버튼
    overlay.querySelector('#upg-back').addEventListener('click', () => {
      this._removeOverlay();
      this.scene.start('LobbyScene');
    });

    // 구매 버튼 — 이벤트 위임
    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'upgrade') this._doUpgrade(btn.dataset.key);
      else if (action === 'unlock') this._doUnlock(btn.dataset.unit);
    });
  }

  _removeOverlay() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }

  // Phaser 씬이 종료/교체될 때 자동 정리
  shutdown() {
    this._removeOverlay();
  }

  // ── 구매 로직 ───────────────────────────────────────────
  _doUnlock(unitId) {
    const cost = window.UNLOCK_COSTS[unitId];
    if (!window.CurrencySystem.spendGold(cost)) return;

    const save = window.SaveSystem.get();
    if (!save.unlockedUnits.includes(unitId)) save.unlockedUnits.push(unitId);
    window.SaveSystem.persist();

    // 오버레이 갱신 (씬 재시작 없이)
    this._removeOverlay();
    this._buildOverlay();
  }

  _doUpgrade(key) {
    const save = window.SaveSystem.get();
    const upg  = window.UPGRADES[key];
    const currentLevel = save.upgrades[key] || 0;
    if (currentLevel >= upg.maxLevel) return;

    const cost = window.calcUpgradeCost(key, currentLevel);
    if (!window.CurrencySystem.spendGold(cost)) return;

    save.upgrades[key] = currentLevel + 1;
    window.SaveSystem.persist();

    this._removeOverlay();
    this._buildOverlay();
  }
}

window.UpgradeScene = UpgradeScene;
