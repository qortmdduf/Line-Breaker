// BattleHUD.js — 전투 하단 고정 패널

class BattleHUD {
  constructor(scene, costSystem, onSummon, onSkill) {
    this.scene = scene;
    this.costSystem = costSystem;
    this.onSummon = onSummon;
    this.onSkill = onSkill;

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

    // 코스트 라벨
    this._costLabel = scene.add.text(10, hudY + 6, 'COST', {
      fontSize: '12px', color: '#aaaaaa'
    }).setDepth(11).setScrollFactor(0);

    // 코스트 바 배경
    this._costBarBg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    this._costBarBg.fillStyle(cfg.COLOR.HP_BG);
    this._costBarBg.fillRect(50, hudY + 6, 200, 12);

    // 코스트 바
    this._costBar = scene.add.graphics().setDepth(11).setScrollFactor(0);

    // 코스트 수치 텍스트
    this._costText = scene.add.text(258, hudY + 6, '0/150', {
      fontSize: '12px', color: '#ffffff'
    }).setDepth(11).setScrollFactor(0);

    // 유닛 버튼
    this._buttons = [];
    this._heroButton = null;
    this._heroUsed = false;

    this._buildButtons();
  }

  _buildButtons() {
    const cfg = window.GameConfig;
    const save = window.SaveSystem.get();
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const hudY = H - cfg.HUD_HEIGHT;
    const btnY = hudY + 28;

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

    return { bg, nameText, costText, hitZone };
  }

  _buildHeroButton() {
    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const hudY = H - cfg.HUD_HEIGHT;
    const bx = W - 82;
    const by = hudY + 28;
    const bw = 76;
    const bh = 50;
    const scene = this.scene;

    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(0x996600);
    bg.fillRoundedRect(bx, by, bw, bh, 6);

    const nameText = scene.add.text(bx + bw / 2, by + 10, '★ 영웅', {
      fontSize: '13px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const costText = scene.add.text(bx + bw / 2, by + 30, 'Cost:' + window.UNITS.hero.cost, {
      fontSize: '11px', color: '#ffdd88'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const hitZone = scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true })
      .setDepth(13).setScrollFactor(0);

    hitZone.on('pointerdown', () => {
      if (!this._heroUsed && this.onSummon) this.onSummon('hero');
    });

    this._heroButton = { bg, nameText, costText, hitZone };
  }

  markHeroUsed() {
    this._heroUsed = true;
    if (this._heroButton) {
      const cfg = window.GameConfig;
      const W = cfg.GAME_WIDTH;
      const H = cfg.GAME_HEIGHT;
      const hudY = H - cfg.HUD_HEIGHT;
      const bx = W - 82;
      const by = hudY + 28;
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
    this._skillBg.clear();
    this._skillBg.fillStyle(isReady ? 0xcc8800 : 0x554400);
    this._skillBg.fillRoundedRect(
      this._skillBtnX, this._skillBtnY,
      this._skillBtnW, this._skillBtnH, 6
    );

    if (isReady) {
      this._skillStatus.setText('준비!').setColor('#aaffaa');
    } else {
      this._skillStatus.setText(Math.ceil(hero.skillCooldown / 1000) + 's').setColor('#ff9944');
    }
  }

  update(hero) {
    this._updateCostBar();
    this._updateButtonStates();
    if (hero) this._updateSkillButton(hero);
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
    this._costBar.fillRect(50, hudY + 6, Math.floor(200 * ratio), 12);
    this._costText.setText(current + '/' + max);
  }

  _updateButtonStates() {
    const currentCost = this.costSystem.current;
    for (const { id, btn } of this._buttons) {
      const canAfford = currentCost >= window.UNITS[id].cost;
      const alpha = canAfford ? 1 : 0.4;
      btn.bg.setAlpha(alpha);
      btn.nameText.setAlpha(alpha);
      btn.costText.setAlpha(alpha);
    }
  }

  destroy() {
    [this._bg, this._costLabel, this._costBarBg, this._costBar, this._costText]
      .forEach(o => { if (o) o.destroy(); });

    for (const { btn } of this._buttons) {
      [btn.bg, btn.nameText, btn.costText, btn.hitZone].forEach(o => { if (o) o.destroy(); });
    }

    if (this._heroButton) {
      [this._heroButton.bg, this._heroButton.nameText,
       this._heroButton.costText, this._heroButton.hitZone].forEach(o => { if (o) o.destroy(); });
    }

    [this._skillBg, this._skillLabel, this._skillStatus, this._skillHitZone]
      .forEach(o => { if (o && o.destroy) o.destroy(); });
  }
}

window.BattleHUD = BattleHUD;
