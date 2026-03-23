// BattleHUD.js — 전투 하단 고정 패널
// BattleScene이 생성하고 update()를 호출한다

class BattleHUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {CostSystem} costSystem
   * @param {function} onSummon  - callback(unitId)
   * @param {function} onSkill   - callback()
   */
  constructor(scene, costSystem, onSummon, onSkill) {
    this.scene = scene;
    this.costSystem = costSystem;
    this.onSummon = onSummon;
    this.onSkill = onSkill;
    this.hero = null;

    // 카메라 스크롤 플래그 (BattleScene.update에서 참조)
    this.isScrollingLeft = false;
    this.isScrollingRight = false;

    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const hudH = cfg.HUD_HEIGHT;
    const hudY = H - hudH;

    // HUD 배경
    this._bg = scene.add.graphics().setScrollFactor(0);
    this._bg.fillStyle(cfg.COLOR.HUD_BG, 0.92);
    this._bg.fillRect(0, hudY, W, hudH);
    this._bg.setDepth(10);

    // ── 화살표 버튼 행 (HUD 최상단) ──────────────────────────
    this._buildScrollButtons(W, hudY);

    // ── 코스트 바 (화살표 행 아래) ───────────────────────────
    this._costLabel = scene.add.text(10, hudY + 32, 'COST', {
      fontSize: '12px', color: '#aaaaaa'
    }).setDepth(11).setScrollFactor(0);

    this._costBarBg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    this._costBarBg.fillStyle(cfg.COLOR.HP_BG);
    this._costBarBg.fillRect(50, hudY + 32, 200, 12);

    this._costBar = scene.add.graphics().setDepth(11).setScrollFactor(0);

    this._costText = scene.add.text(258, hudY + 32, '150/150', {
      fontSize: '12px', color: '#ffffff'
    }).setDepth(11).setScrollFactor(0);

    // ── 유닛 버튼 ────────────────────────────────────────────
    this._buttons = [];
    this._heroButton = null;
    this._heroUsed = false;

    this._buildButtons();
  }

  _buildScrollButtons(W, hudY) {
    const scene = this.scene;
    const btnY = hudY + 13;

    // 구분선
    const line = scene.add.graphics().setScrollFactor(0).setDepth(11);
    line.lineStyle(1, 0x444466);
    line.lineBetween(0, hudY + 26, W, hudY + 26);

    // ◀ 버튼
    const btnLeft = scene.add.text(W / 2 - 90, btnY, '◀◀', {
      fontSize: '18px', color: '#88aaff', backgroundColor: '#223366',
      padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setDepth(12).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    btnLeft.on('pointerdown', () => { this.isScrollingLeft = true; });
    btnLeft.on('pointerup', () => { this.isScrollingLeft = false; });
    btnLeft.on('pointerout', () => { this.isScrollingLeft = false; });

    // 라벨
    scene.add.text(W / 2, btnY, '화면 이동', {
      fontSize: '11px', color: '#888888'
    }).setOrigin(0.5).setDepth(12).setScrollFactor(0);

    // ▶ 버튼
    const btnRight = scene.add.text(W / 2 + 90, btnY, '▶▶', {
      fontSize: '18px', color: '#88aaff', backgroundColor: '#223366',
      padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setDepth(12).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    btnRight.on('pointerdown', () => { this.isScrollingRight = true; });
    btnRight.on('pointerup', () => { this.isScrollingRight = false; });
    btnRight.on('pointerout', () => { this.isScrollingRight = false; });
  }

  _buildButtons() {
    const cfg = window.GameConfig;
    const save = window.SaveSystem.get();
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const hudY = H - cfg.HUD_HEIGHT;
    const btnY = hudY + 54;  // 화살표 행(26) + 코스트 바(28)

    const unitIds = ['warrior', 'archer', 'knight', 'mage'].filter(id =>
      save.unlockedUnits.includes(id)
    );

    const hasHero = save.unlockedUnits.includes('hero') && !save.heroUsed;

    const availW = hasHero ? W - 88 : W;
    const btnW = 68;
    const gap = 4;
    const totalW = unitIds.length * (btnW + gap) - gap;
    const startX = (availW - totalW) / 2;

    unitIds.forEach((id, i) => {
      const bx = startX + i * (btnW + gap);
      const btn = this._makeUnitButton(id, bx, btnY, btnW, 50);
      this._buttons.push({ id, btn });
    });

    if (hasHero) {
      this._buildHeroButton();
    }
  }

  _makeUnitButton(unitId, bx, by, bw, bh) {
    const cfg = window.GameConfig;
    const unit = window.UNITS[unitId];
    const scene = this.scene;

    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(cfg.COLOR.BUTTON_NORMAL);
    bg.fillRoundedRect(bx, by, bw, bh, 6);

    const nameText = scene.add.text(bx + bw / 2, by + 12, unit.name, {
      fontSize: '12px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const costText = scene.add.text(bx + bw / 2, by + 32, 'Cost:' + unit.cost, {
      fontSize: '11px', color: '#ffdd88', align: 'center'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const hitZone = scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true })
      .setDepth(13).setScrollFactor(0);

    hitZone.on('pointerdown', () => {
      if (this.onSummon) this.onSummon(unitId);
    });

    const btn = { bg, nameText, costText, hitZone };
    return btn;
  }

  _buildHeroButton() {
    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const hudY = H - cfg.HUD_HEIGHT;
    const bx = W - 82;
    const by = hudY + 54;
    const bw = 76;
    const bh = 50;
    const scene = this.scene;

    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(0x996600);
    bg.fillRoundedRect(bx, by, bw, bh, 6);

    const nameText = scene.add.text(bx + bw / 2, by + 10, '★ 영웅', {
      fontSize: '13px', color: '#ffd700', align: 'center'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const costText = scene.add.text(bx + bw / 2, by + 30, 'Cost:' + window.UNITS.hero.cost, {
      fontSize: '11px', color: '#ffdd88', align: 'center'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const hitZone = scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true })
      .setDepth(13).setScrollFactor(0);

    hitZone.on('pointerdown', () => {
      if (!this._heroUsed && this.onSummon) {
        this.onSummon('hero');
      }
    });

    this._heroButton = { bg, nameText, costText, hitZone };
  }

  // 영웅 소환 완료 시 BattleScene이 호출 — 영웅 버튼을 스킬 버튼으로 전환
  markHeroUsed() {
    this._heroUsed = true;
    if (this._heroButton) {
      const cfg = window.GameConfig;
      const W = cfg.GAME_WIDTH;
      const H = cfg.GAME_HEIGHT;
      const hudY = H - cfg.HUD_HEIGHT;
      const bx = W - 82;
      const by = hudY + 54;
      const bw = 76;
      const bh = 50;

      [this._heroButton.bg, this._heroButton.nameText,
       this._heroButton.costText, this._heroButton.hitZone].forEach(o => {
        if (o && o.destroy) o.destroy();
      });

      this._skillBg = this.scene.add.graphics().setDepth(11).setScrollFactor(0);
      this._skillBg.fillStyle(0x886600);
      this._skillBg.fillRoundedRect(bx, by, bw, bh, 6);

      this._skillLabel = this.scene.add.text(bx + bw / 2, by + 10, '★ 스킬', {
        fontSize: '13px', color: '#ffd700'
      }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

      this._skillStatus = this.scene.add.text(bx + bw / 2, by + 30, '준비!', {
        fontSize: '11px', color: '#aaffaa'
      }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

      const hitZone = this.scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
        .setInteractive({ useHandCursor: true })
        .setDepth(13).setScrollFactor(0);

      hitZone.on('pointerdown', () => {
        if (this.onSkill) this.onSkill();
      });

      this._skillHitZone = hitZone;
      this._skillBtnX = bx;
      this._skillBtnY = by;
      this._skillBtnW = bw;
      this._skillBtnH = bh;
      this._heroButton = null;
    }
  }

  _updateSkillButton(hero) {
    if (!this._skillBg || !hero || !hero.alive) return;

    const isReady = hero.isSkillReady();
    const color = isReady ? 0xcc8800 : 0x554400;
    this._skillBg.clear();
    this._skillBg.fillStyle(color);
    this._skillBg.fillRoundedRect(
      this._skillBtnX, this._skillBtnY,
      this._skillBtnW, this._skillBtnH, 6
    );

    if (isReady) {
      this._skillStatus.setText('준비!').setColor('#aaffaa');
    } else {
      const sec = Math.ceil(hero.skillCooldown / 1000);
      this._skillStatus.setText(sec + 's').setColor('#ff9944');
    }
  }

  /**
   * 매 프레임 호출 — 코스트 바 + 버튼 상태 갱신
   * @param {Hero|null} hero
   */
  update(hero) {
    this._updateCostBar();
    this._updateButtonStates();
    if (hero) {
      this._updateSkillButton(hero);
    }
  }

  _updateCostBar() {
    const cfg = window.GameConfig;
    const H = cfg.GAME_HEIGHT;
    const hudY = H - cfg.HUD_HEIGHT;
    const ratio = this.costSystem.getRatio();
    const current = Math.floor(this.costSystem.current);
    const max = this.costSystem.max;

    this._costBar.clear();
    this._costBar.fillStyle(0x44aaff);
    this._costBar.fillRect(50, hudY + 32, Math.floor(200 * ratio), 12);
    this._costText.setText(current + '/' + max);
  }

  _updateButtonStates() {
    const currentCost = this.costSystem.current;

    for (const { id, btn } of this._buttons) {
      const unit = window.UNITS[id];
      const canAfford = currentCost >= unit.cost;
      const alpha = canAfford ? 1 : 0.4;
      btn.bg.setAlpha(alpha);
      btn.nameText.setAlpha(alpha);
      btn.costText.setAlpha(alpha);
    }
  }

  destroy() {
    const items = [
      this._bg, this._costLabel, this._costBarBg, this._costBar, this._costText
    ];
    items.forEach(o => { if (o) o.destroy(); });

    for (const { btn } of this._buttons) {
      [btn.bg, btn.nameText, btn.costText, btn.hitZone].forEach(o => { if (o) o.destroy(); });
    }

    if (this._heroButton) {
      const hb = this._heroButton;
      [hb.bg, hb.nameText, hb.costText, hb.hitZone].forEach(o => { if (o && o.destroy) o.destroy(); });
    }

    [this._skillBg, this._skillLabel, this._skillStatus, this._skillHitZone]
      .forEach(o => { if (o && o.destroy) o.destroy(); });
  }
}

window.BattleHUD = BattleHUD;
