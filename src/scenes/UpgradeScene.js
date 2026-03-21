// UpgradeScene.js — 업그레이드 화면
// 구매 후 씬을 재시작하여 UI를 갱신한다 (단순하고 버그 없는 접근)
// 콘텐츠가 화면을 초과하므로 카메라 스크롤(드래그)로 탐색

class UpgradeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create() {
    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const save = window.SaveSystem.get();

    // 콘텐츠 총 높이를 먼저 계산
    this._totalContentH = this._estimateContentHeight(save);

    // 배경 (콘텐츠 전체 영역 커버)
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1520);
    bg.fillRect(0, 0, W, Math.max(H, this._totalContentH + 80));

    // 콘텐츠 빌드
    this._buildContent(W, H, save);

    // ── 헤더 (고정 — 카메라 스크롤과 무관) ──────────────
    // setScrollFactor(0)으로 카메라를 따라가지 않게 설정
    const header = this.add.graphics().setScrollFactor(0).setDepth(20);
    header.fillStyle(0x1a2a40);
    header.fillRect(0, 0, W, 64);

    this.add.text(W / 2, 14, '업그레이드', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(21);

    this._goldText = this.add.text(W - 10, 18, window.CurrencySystem.getGold() + ' G', {
      fontSize: '16px', color: '#ffd700'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(21);

    const backBtn = this.add.text(10, 18, '← 뒤로', {
      fontSize: '15px', color: '#aaccff'
    }).setScrollFactor(0).setDepth(22).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start('LobbyScene');
    });

    // ── 드래그 스크롤 ─────────────────────────────────────
    // 화면 터치/드래그로 카메라 Y를 이동
    this._scrollY = 0;
    this._maxScrollY = Math.max(0, this._totalContentH - H + 80);
    this._dragStartY = null;
    this._dragStartCamY = 0;

    this.input.on('pointerdown', (ptr) => {
      this._dragStartY = ptr.y;
      this._dragStartCamY = this._scrollY;
    });

    this.input.on('pointermove', (ptr) => {
      if (this._dragStartY === null) return;
      const dy = this._dragStartY - ptr.y;
      this._scrollY = Phaser.Math.Clamp(
        this._dragStartCamY + dy, 0, this._maxScrollY
      );
      this.cameras.main.setScrollY(this._scrollY);
    });

    this.input.on('pointerup', () => {
      this._dragStartY = null;
    });
  }

  // 콘텐츠 높이 추정 (실제 렌더링 전 레이아웃 계산)
  _estimateContentHeight(save) {
    const rowH = 60;
    const secH = 28;
    let h = 76; // 헤더 아래 시작점

    // 유닛 해금: 항상 3행
    h += secH + 3 * rowH + 8;

    // 유닛 업그레이드: 해금된 유닛 수 × 2
    const upgUnits = ['warrior', 'archer', 'knight', 'mage'].filter(id =>
      save.unlockedUnits.includes(id)
    );
    h += secH + upgUnits.length * 2 * rowH + 8;

    // 성 화살: 2행
    h += secH + 2 * rowH;

    return h;
  }

  _buildContent(W, H, save) {
    let curY = 76;
    const rowGap = 60;

    // ── 섹션 1: 유닛 해금 ──────────────────────────────
    this._sectionTitle('유닛 해금', 10, curY);
    curY += 28;

    const lockableUnits = ['knight', 'mage', 'hero'];
    for (const unitId of lockableUnits) {
      window.UpgradeUI.makeUnlockRow(this, unitId, 10, curY, (id) => this._doUnlock(id));
      curY += rowGap;
    }

    curY += 8;

    // ── 섹션 2: 유닛 업그레이드 ────────────────────────
    this._sectionTitle('유닛 강화', 10, curY);
    curY += 28;

    const upgKeys = ['warrior_hp', 'warrior_atk', 'archer_hp', 'archer_atk',
                     'knight_hp', 'knight_atk', 'mage_hp', 'mage_atk'];

    for (const key of upgKeys) {
      const upg = window.UPGRADES[key];
      // 해당 유닛이 해금된 경우만 표시
      if (upg.requireUnit && !save.unlockedUnits.includes(upg.requireUnit)) continue;

      window.UpgradeUI.makeUpgradeRow(this, key, 10, curY, (k) => this._doUpgrade(k));
      curY += rowGap;
    }

    curY += 8;

    // ── 섹션 3: 성 화살 ────────────────────────────────
    this._sectionTitle('성 화살 강화', 10, curY);
    curY += 28;

    ['arrow_dmg', 'arrow_spd'].forEach(key => {
      window.UpgradeUI.makeUpgradeRow(this, key, 10, curY, (k) => this._doUpgrade(k));
      curY += rowGap;
    });
  }

  _sectionTitle(label, x, y) {
    const W = window.GameConfig.GAME_WIDTH;
    const line = this.add.graphics();
    line.lineStyle(1, 0x334466);
    line.lineBetween(x, y + 10, W - x, y + 10);

    this.add.text(x + 4, y, label, {
      fontSize: '13px', color: '#88aacc', fontStyle: 'bold'
    });
  }

  _doUnlock(unitId) {
    const cost = window.UNLOCK_COSTS[unitId];
    if (!window.CurrencySystem.spendGold(cost)) return;

    const save = window.SaveSystem.get();
    if (!save.unlockedUnits.includes(unitId)) {
      save.unlockedUnits.push(unitId);
    }
    window.SaveSystem.persist();

    // 씬 재시작으로 UI 갱신
    this.scene.restart();
  }

  _doUpgrade(key) {
    const save = window.SaveSystem.get();
    const upg = window.UPGRADES[key];
    const currentLevel = save.upgrades[key] || 0;

    if (currentLevel >= upg.maxLevel) return;

    const cost = window.calcUpgradeCost(key, currentLevel);
    if (!window.CurrencySystem.spendGold(cost)) return;

    save.upgrades[key] = currentLevel + 1;
    window.SaveSystem.persist();

    this.scene.restart();
  }
}

window.UpgradeScene = UpgradeScene;
