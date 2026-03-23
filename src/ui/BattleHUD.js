// BattleHUD.js — 전투 하단 고정 패널
// 스킬 바 (1행) + 유닛 소환 바 (2행) 구조

class BattleHUD {
  constructor(scene, costSystem, onSummon, onSkill, onSkillSlot) {
    this.scene = scene;
    this.costSystem = costSystem;
    this.onSummon   = onSummon;
    this.onSkill    = onSkill;
    this.onSkillSlot = onSkillSlot;  // (slotIndex) => void

    const cfg = window.GameConfig;
    const W    = cfg.GAME_WIDTH;
    const H    = cfg.GAME_HEIGHT;
    const hudH = cfg.HUD_HEIGHT;   // 160
    const hudY = H - hudH;

    // HUD 배경
    this._bg = scene.add.graphics().setScrollFactor(0).setDepth(10);
    this._bg.fillStyle(cfg.COLOR.HUD_BG, 0.92);
    this._bg.fillRect(0, hudY, W, hudH);

    // ── 코스트 바 (최상단) ──────────────────────────────────
    scene.add.text(10, hudY + 6, 'COST', {
      fontSize: '12px', color: '#aaaaaa'
    }).setDepth(11).setScrollFactor(0);

    this._costBarBg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    this._costBarBg.fillStyle(cfg.COLOR.HP_BG);
    this._costBarBg.fillRect(50, hudY + 6, 200, 12);

    this._costBar  = scene.add.graphics().setDepth(11).setScrollFactor(0);
    this._costText = scene.add.text(258, hudY + 6, '0/150', {
      fontSize: '12px', color: '#ffffff'
    }).setDepth(11).setScrollFactor(0);

    // ── 스킬 슬롯 바 ────────────────────────────────────────
    this._skillSlots = [];
    this._buildSkillBar(W, hudY);

    // ── 유닛 소환 버튼 바 ────────────────────────────────────
    this._buttons   = [];
    this._heroButton = null;
    this._heroUsed  = false;
    this._buildUnitBar(W, hudY);
  }

  // ── 스킬 슬롯 4칸 (불화살 + 빈 3칸) ────────────────────────
  _buildSkillBar(W, hudY) {
    const scene = this.scene;
    const slotCount = 4;
    const slotW = 88;
    const gap   = 4;
    const totalW = slotCount * slotW + (slotCount - 1) * gap;
    const startX = Math.floor((W - totalW) / 2);
    const slotY  = hudY + 24;
    const slotH  = 44;

    const slotDefs = [
      { label: '불화살', active: true },  // 0: 불화살
      null, null, null,                   // 1~3: 빈 슬롯
    ];

    slotDefs.forEach((def, i) => {
      const bx = startX + i * (slotW + gap);

      const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
      const labelText = scene.add.text(bx + slotW / 2, slotY + 8, '', {
        fontSize: '11px', color: '#ffffff', align: 'center'
      }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);
      const subText = scene.add.text(bx + slotW / 2, slotY + 26, '', {
        fontSize: '10px', color: '#aaaaaa', align: 'center'
      }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

      if (def) {
        // 활성 슬롯 (불화살)
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'ready');
        labelText.setText(def.label).setColor('#ffaa44');
        subText.setText('준비').setColor('#aaffaa');

        const hit = scene.add.zone(bx + slotW / 2, slotY + slotH / 2, slotW, slotH)
          .setInteractive({ useHandCursor: true }).setDepth(13).setScrollFactor(0);
        hit.on('pointerdown', () => { if (this.onSkillSlot) this.onSkillSlot(i); });

        this._skillSlots.push({ bg, labelText, subText, hit, bx, slotY, slotW, slotH });
      } else {
        // 잠긴 빈 슬롯
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'empty');
        labelText.setText('?').setColor('#555555');
        subText.setText('');
        this._skillSlots.push({ bg, labelText, subText, hit: null, bx, slotY, slotW, slotH });
      }
    });
  }

  _drawSkillSlotBg(gfx, bx, by, bw, bh, state) {
    const colors = { ready: 0x663300, active: 0xcc4400, cooldown: 0x332200, empty: 0x1a1a1a };
    gfx.clear();
    gfx.fillStyle(colors[state] || 0x1a1a1a);
    gfx.fillRoundedRect(bx, by, bw, bh, 6);
    gfx.lineStyle(1, 0x444444);
    gfx.strokeRoundedRect(bx, by, bw, bh, 6);
  }

  // ── 유닛 소환 버튼 8칸 ──────────────────────────────────────
  _buildUnitBar(W, hudY) {
    const save  = window.SaveSystem.get();
    const hasHero = save.unlockedUnits.includes('hero') && !save.heroUsed;

    // 8개 고정 슬롯 (warrior, archer + 잠금 6개)
    const slots = ['warrior', 'archer', null, null, null, null, null, null];

    const heroW  = hasHero ? 82 : 0;
    const availW = W - heroW;
    const slotW  = 35;
    const gap    = 2;
    const totalW = slots.length * slotW + (slots.length - 1) * gap;
    const startX = Math.floor((availW - totalW) / 2);
    const btnY   = hudY + 76;
    const btnH   = 46;

    slots.forEach((id, i) => {
      const bx = startX + i * (slotW + gap);
      const isUnlocked = id && save.unlockedUnits.includes(id);

      if (isUnlocked) {
        const btn = this._makeUnitButton(id, bx, btnY, slotW, btnH);
        this._buttons.push({ id, btn });
      } else {
        this._makeLockedSlot(bx, btnY, slotW, btnH);
      }
    });

    if (hasHero) this._buildHeroButton(W, hudY);
  }

  _makeUnitButton(unitId, bx, by, bw, bh) {
    const cfg  = window.GameConfig;
    const unit = window.UNITS[unitId];
    const scene = this.scene;

    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(cfg.COLOR.BUTTON_NORMAL);
    bg.fillRoundedRect(bx, by, bw, bh, 5);

    const nameText = scene.add.text(bx + bw / 2, by + 7, unit.name, {
      fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const costText = scene.add.text(bx + bw / 2, by + 26, 'C:' + unit.cost, {
      fontSize: '9px', color: '#ffdd88'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const hit = scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true }).setDepth(13).setScrollFactor(0);
    hit.on('pointerdown', () => { if (this.onSummon) this.onSummon(unitId); });

    return { bg, nameText, costText, hitZone: hit };
  }

  _makeLockedSlot(bx, by, bw, bh) {
    const scene = this.scene;
    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(0x1a1a1a);
    bg.fillRoundedRect(bx, by, bw, bh, 5);
    bg.lineStyle(1, 0x333333);
    bg.strokeRoundedRect(bx, by, bw, bh, 5);

    scene.add.text(bx + bw / 2, by + bh / 2, '🔒', {
      fontSize: '14px'
    }).setOrigin(0.5).setDepth(12).setScrollFactor(0);
  }

  _buildHeroButton(W, hudY) {
    const bx = W - 80;
    const by = hudY + 76;
    const bw = 74;
    const bh = 46;
    const scene = this.scene;

    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(0x996600);
    bg.fillRoundedRect(bx, by, bw, bh, 5);

    const nameText = scene.add.text(bx + bw / 2, by + 8, '★ 영웅', {
      fontSize: '12px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const costText = scene.add.text(bx + bw / 2, by + 27, 'C:' + window.UNITS.hero.cost, {
      fontSize: '9px', color: '#ffdd88'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const hit = scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true }).setDepth(13).setScrollFactor(0);
    hit.on('pointerdown', () => { if (!this._heroUsed && this.onSummon) this.onSummon('hero'); });

    this._heroButton = { bg, nameText, costText, hitZone: hit, bx, by, bw, bh };
  }

  markHeroUsed() {
    this._heroUsed = true;
    if (!this._heroButton) return;

    const { bx, by, bw, bh } = this._heroButton;
    [this._heroButton.bg, this._heroButton.nameText,
     this._heroButton.costText, this._heroButton.hitZone].forEach(o => o && o.destroy());

    this._skillBg = this.scene.add.graphics().setDepth(11).setScrollFactor(0);
    this._skillBg.fillStyle(0x886600);
    this._skillBg.fillRoundedRect(bx, by, bw, bh, 5);

    this._skillLabel  = this.scene.add.text(bx + bw / 2, by + 8, '★ 스킬', {
      fontSize: '12px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    this._skillStatus = this.scene.add.text(bx + bw / 2, by + 27, '준비!', {
      fontSize: '10px', color: '#aaffaa'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const hit = this.scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true }).setDepth(13).setScrollFactor(0);
    hit.on('pointerdown', () => { if (this.onSkill) this.onSkill(); });

    this._skillHitZone = hit;
    this._skillBtn = { bx, by, bw, bh };
    this._heroButton = null;
  }

  // ── 매 프레임 갱신 ──────────────────────────────────────────
  /**
   * @param {Hero|null} hero
   * @param {Array}     skillStates  BattleScene이 전달하는 스킬 슬롯 상태 배열
   */
  update(hero, skillStates) {
    this._updateCostBar();
    this._updateUnitButtons();
    this._updateSkillSlots(skillStates);
    if (hero) this._updateHeroSkillButton(hero);
  }

  _updateCostBar() {
    const cfg  = window.GameConfig;
    const hudY = cfg.GAME_HEIGHT - cfg.HUD_HEIGHT;
    const ratio = this.costSystem.getRatio();
    this._costBar.clear();
    this._costBar.fillStyle(0x44aaff);
    this._costBar.fillRect(50, hudY + 6, Math.floor(200 * ratio), 12);
    this._costText.setText(Math.floor(this.costSystem.current) + '/' + this.costSystem.max);
  }

  _updateUnitButtons() {
    const cur = this.costSystem.current;
    for (const { id, btn } of this._buttons) {
      const canAfford = cur >= window.UNITS[id].cost;
      const a = canAfford ? 1 : 0.4;
      btn.bg.setAlpha(a);
      btn.nameText.setAlpha(a);
      btn.costText.setAlpha(a);
    }
  }

  _updateSkillSlots(skillStates) {
    if (!skillStates) return;
    skillStates.forEach((state, i) => {
      const slot = this._skillSlots[i];
      if (!slot || !slot.hit) return; // 빈 슬롯 스킵

      const { bg, labelText, subText, bx, slotY, slotW, slotH } = slot;

      if (state.active) {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'active');
        labelText.setText('불화살').setColor('#ff6600');
        subText.setText(Math.ceil(state.durationMs / 1000) + 's').setColor('#ffaa44');
      } else if (state.cooldownMs > 0) {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'cooldown');
        labelText.setText('불화살').setColor('#886633');
        subText.setText('CD ' + Math.ceil(state.cooldownMs / 1000) + 's').setColor('#886633');
      } else {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'ready');
        labelText.setText('불화살').setColor('#ffaa44');
        subText.setText('준비').setColor('#aaffaa');
      }
    });
  }

  _updateHeroSkillButton(hero) {
    if (!this._skillBg || !hero || !hero.alive) return;
    const { bx, by, bw, bh } = this._skillBtn;
    const isReady = hero.isSkillReady();
    this._skillBg.clear();
    this._skillBg.fillStyle(isReady ? 0xcc8800 : 0x554400);
    this._skillBg.fillRoundedRect(bx, by, bw, bh, 5);
    if (isReady) {
      this._skillStatus.setText('준비!').setColor('#aaffaa');
    } else {
      this._skillStatus.setText('CD ' + Math.ceil(hero.skillCooldown / 1000) + 's').setColor('#ff9944');
    }
  }

  destroy() {
    [this._bg, this._costBarBg, this._costBar, this._costText].forEach(o => o && o.destroy());
    for (const { btn } of this._buttons) {
      [btn.bg, btn.nameText, btn.costText, btn.hitZone].forEach(o => o && o.destroy());
    }
    for (const slot of this._skillSlots) {
      [slot.bg, slot.labelText, slot.subText, slot.hit].forEach(o => o && o.destroy());
    }
    if (this._heroButton) {
      [this._heroButton.bg, this._heroButton.nameText,
       this._heroButton.costText, this._heroButton.hitZone].forEach(o => o && o.destroy());
    }
    [this._skillBg, this._skillLabel, this._skillStatus, this._skillHitZone]
      .forEach(o => o && o.destroy());
  }
}

window.BattleHUD = BattleHUD;
