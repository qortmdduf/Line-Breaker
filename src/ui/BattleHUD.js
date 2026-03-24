// BattleHUD.js — 전투 하단 고정 패널
// 스킬 바 (6칸, 1행) + 유닛 소환 바 (8칸, 2행) 구조
// 영웅은 8번 슬롯으로 통합 (별도 heroButton 폐기)

class BattleHUD {
  constructor(scene, costSystem, onSummon, onSkill, onSkillSlot) {
    this.scene = scene;
    this.costSystem = costSystem;
    this.onSummon    = onSummon;
    this.onSkill     = onSkill;
    this.onSkillSlot = onSkillSlot;  // (slotIndex) => void

    const cfg  = window.GameConfig;
    const W    = cfg.GAME_WIDTH;   // 844
    const H    = cfg.GAME_HEIGHT;  // 390
    const hudH = cfg.HUD_HEIGHT;   // 110
    const hudY = H - hudH;

    // HUD 배경
    this._bg = scene.add.graphics().setScrollFactor(0).setDepth(10);
    this._bg.fillStyle(cfg.COLOR.HUD_BG, 0.92);
    this._bg.fillRect(0, hudY, W, hudH);

    // ── 코스트 바 (최상단) ──────────────────────────────────
    scene.add.text(8, hudY + 5, 'COST', {
      fontSize: '11px', color: '#aaaaaa'
    }).setDepth(11).setScrollFactor(0);

    this._costBarBg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    this._costBarBg.fillStyle(cfg.COLOR.HP_BG);
    this._costBarBg.fillRect(48, hudY + 5, 180, 10);

    this._costBar  = scene.add.graphics().setDepth(11).setScrollFactor(0);
    this._costText = scene.add.text(234, hudY + 5, '0/150', {
      fontSize: '11px', color: '#ffffff'
    }).setDepth(11).setScrollFactor(0);

    // ── 스킬 슬롯 바 (6칸) ──────────────────────────────────
    this._skillSlots = [];
    this._cooldownOverlays = []; // 파이 차트 오버레이용 Graphics
    this._buildSkillBar(W, hudY);

    // ── 유닛 소환 버튼 바 (8칸, 영웅 포함) ──────────────────
    this._buttons  = [];       // { id, btn, slotIndex }
    this._heroSlot = null;     // 8번 슬롯(인덱스 7) 참조
    this._heroUsed = false;
    this._buildUnitBar(W, hudY);
  }

  // ── 스킬 슬롯 6칸 ───────────────────────────────────────────
  _buildSkillBar(W, hudY) {
    const scene    = this.scene;
    const slotCount = 6;
    const slotW    = 64;
    const gap      = 4;
    const totalW   = slotCount * slotW + (slotCount - 1) * gap;
    const startX   = Math.floor((W - totalW) / 2);
    const slotY    = hudY + 20;
    const slotH    = 40;

    // 슬롯 0: 불화살 활성, 1~5: 빈 칸
    const slotDefs = [
      { label: '불화살', active: true },
      null, null, null, null, null,
    ];

    slotDefs.forEach((def, i) => {
      const bx = startX + i * (slotW + gap);

      const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);

      // 파이 차트 오버레이 (쿨타임 중 반투명 덮개)
      const overlay = scene.add.graphics().setDepth(13).setScrollFactor(0);
      this._cooldownOverlays.push(overlay);

      const labelText = scene.add.text(bx + slotW / 2, slotY + 6, '', {
        fontSize: '10px', color: '#ffffff', align: 'center'
      }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

      const subText = scene.add.text(bx + slotW / 2, slotY + 22, '', {
        fontSize: '9px', color: '#aaaaaa', align: 'center'
      }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

      if (def) {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'ready');
        labelText.setText(def.label).setColor('#ffaa44');
        subText.setText('준비').setColor('#aaffaa');

        const hit = scene.add.zone(bx + slotW / 2, slotY + slotH / 2, slotW, slotH)
          .setInteractive({ useHandCursor: true }).setDepth(14).setScrollFactor(0);
        hit.on('pointerdown', () => { if (this.onSkillSlot) this.onSkillSlot(i); });

        this._skillSlots.push({ bg, labelText, subText, hit, bx, slotY, slotW, slotH });
      } else {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'empty');
        labelText.setText('?').setColor('#444444');
        subText.setText('');
        this._skillSlots.push({ bg, labelText, subText, hit: null, bx, slotY, slotW, slotH });
      }
    });
  }

  // 스킬 슬롯 첫 번째(불화살) 의 중앙 x 좌표 반환 — BattleScene이 이동 조이스틱 위치 계산에 사용
  getSkillSlotX(index) {
    const slot = this._skillSlots[index];
    if (!slot) return 0;
    return slot.bx + slot.slotW / 2;
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
  // 슬롯 배열: 0=warrior, 1=archer, 2~6=null(잠금), 7=hero
  _buildUnitBar(W, hudY) {
    const save  = window.SaveSystem.get();
    const slots = ['warrior', 'archer', null, null, null, null, null, 'hero'];

    const slotW  = 80;
    const gap    = 4;
    const totalW = slots.length * slotW + (slots.length - 1) * gap;
    const startX = Math.floor((W - totalW) / 2);
    const btnY   = hudY + 64;
    const btnH   = 40;

    slots.forEach((id, i) => {
      const bx = startX + i * (slotW + gap);

      if (id === 'hero') {
        // 영웅 슬롯은 별도 처리 (1회 사용 제한)
        const heroAvailable = save.unlockedUnits.includes('hero') && !save.heroUsed;
        this._buildHeroSlot(i, bx, btnY, slotW, btnH, heroAvailable);
      } else if (id && save.unlockedUnits.includes(id)) {
        const btn = this._makeUnitButton(id, bx, btnY, slotW, btnH);
        this._buttons.push({ id, btn });
      } else {
        this._makeLockedSlot(bx, btnY, slotW, btnH);
      }
    });
  }

  _buildHeroSlot(slotIndex, bx, by, bw, bh, available) {
    const scene = this.scene;
    const cfg   = window.GameConfig;

    if (!available) {
      // 잠긴 영웅 슬롯
      const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
      bg.fillStyle(0x1a1a1a);
      bg.fillRoundedRect(bx, by, bw, bh, 5);
      bg.lineStyle(1, 0x333333);
      bg.strokeRoundedRect(bx, by, bw, bh, 5);
      scene.add.text(bx + bw / 2, by + bh / 2, '🔒', {
        fontSize: '14px'
      }).setOrigin(0.5).setDepth(12).setScrollFactor(0);
      return;
    }

    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(0x996600);
    bg.fillRoundedRect(bx, by, bw, bh, 5);

    const nameText = scene.add.text(bx + bw / 2, by + 8, '★ 영웅', {
      fontSize: '11px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const costText = scene.add.text(bx + bw / 2, by + 24, 'C:' + window.UNITS.hero.cost, {
      fontSize: '9px', color: '#ffdd88'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const hit = scene.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true }).setDepth(13).setScrollFactor(0);
    hit.on('pointerdown', () => {
      if (!this._heroUsed && this.onSummon) this.onSummon('hero');
    });

    this._heroSlot = { bg, nameText, costText, hitZone: hit, bx, by, bw, bh };
  }

  _makeUnitButton(unitId, bx, by, bw, bh) {
    const cfg   = window.GameConfig;
    const unit  = window.UNITS[unitId];
    const scene = this.scene;

    const bg = scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(cfg.COLOR.BUTTON_NORMAL);
    bg.fillRoundedRect(bx, by, bw, bh, 5);

    const nameText = scene.add.text(bx + bw / 2, by + 7, unit.name, {
      fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5, 0).setDepth(12).setScrollFactor(0);

    const costText = scene.add.text(bx + bw / 2, by + 23, 'C:' + unit.cost, {
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

  // 영웅 소환 후 HUD에서 비활성화
  markHeroUsed() {
    this._heroUsed = true;
    if (!this._heroSlot) return;

    const { bx, by, bw, bh } = this._heroSlot;
    [this._heroSlot.bg, this._heroSlot.nameText,
     this._heroSlot.costText, this._heroSlot.hitZone].forEach(o => o && o.destroy());
    this._heroSlot = null;

    // 사용 완료 표시
    const cfg = window.GameConfig;
    const bg = this.scene.add.graphics().setDepth(11).setScrollFactor(0);
    bg.fillStyle(0x554400);
    bg.fillRoundedRect(bx, by, bw, bh, 5);

    this.scene.add.text(bx + bw / 2, by + bh / 2, '출동 완료', {
      fontSize: '10px', color: '#886600'
    }).setOrigin(0.5).setDepth(12).setScrollFactor(0);
  }

  // ── 매 프레임 갱신 ──────────────────────────────────────────
  /**
   * @param {Hero|null} hero
   * @param {Array}     skillStates  BattleScene이 전달하는 스킬 슬롯 상태 배열 (6칸)
   */
  update(hero, skillStates) {
    this._updateCostBar();
    this._updateUnitButtons();
    this._updateSkillSlots(skillStates);
    // 영웅 스킬 버튼은 별도 heroButton이 없으므로 생략 (영웅은 소환만)
  }

  _updateCostBar() {
    const cfg  = window.GameConfig;
    const hudY = cfg.GAME_HEIGHT - cfg.HUD_HEIGHT;
    const ratio = this.costSystem.getRatio();
    this._costBar.clear();
    this._costBar.fillStyle(0x44aaff);
    this._costBar.fillRect(48, hudY + 5, Math.floor(180 * ratio), 10);
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

    // 영웅 슬롯 가용 여부 반영
    if (this._heroSlot && !this._heroUsed) {
      const canAfford = cur >= window.UNITS.hero.cost;
      const a = canAfford ? 1 : 0.4;
      this._heroSlot.bg.setAlpha(a);
      this._heroSlot.nameText.setAlpha(a);
      this._heroSlot.costText.setAlpha(a);
    }
  }

  // 스킬 슬롯 상태 업데이트 + 파이 차트 쿨타임 오버레이
  _updateSkillSlots(skillStates) {
    if (!skillStates) return;
    skillStates.forEach((state, i) => {
      const slot    = this._skillSlots[i];
      const overlay = this._cooldownOverlays[i];
      if (!slot) return;

      const { bg, labelText, subText, bx, slotY, slotW, slotH } = slot;

      // 빈 잠금 슬롯 (state === null 또는 hit 없음)
      if (!state || !slot.hit) {
        overlay && overlay.clear();
        return;
      }

      if (state.active) {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'active');
        labelText.setText('불화살').setColor('#ff6600');
        subText.setText(Math.ceil(state.durationMs / 1000) + 's').setColor('#ffaa44');
        overlay && overlay.clear();
      } else if (state.cooldownMs > 0) {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'cooldown');
        labelText.setText('불화살').setColor('#886633');
        subText.setText('CD ' + Math.ceil(state.cooldownMs / 1000) + 's').setColor('#886633');

        // 파이 차트 오버레이: 12시 방향부터 시계 방향으로 진행
        // ratio = 남은 쿨타임 / 최대 쿨타임 (1=쿨 시작, 0=완료)
        if (overlay && state.maxCooldownMs > 0) {
          const ratio = state.cooldownMs / state.maxCooldownMs;
          this._drawCooldownPie(overlay, bx, slotY, slotW, slotH, ratio);
        }
      } else {
        this._drawSkillSlotBg(bg, bx, slotY, slotW, slotH, 'ready');
        labelText.setText('불화살').setColor('#ffaa44');
        subText.setText('준비').setColor('#aaffaa');
        overlay && overlay.clear();
      }
    });
  }

  // 파이 차트 쿨타임 오버레이 (12시 기준 시계 방향, ratio=1이면 전체 덮음)
  _drawCooldownPie(gfx, bx, by, bw, bh, ratio) {
    gfx.clear();
    if (ratio <= 0) return;

    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const r  = Math.min(bw, bh) / 2 - 2;

    // 반투명 어두운 배경
    gfx.fillStyle(0x000000, 0.55);
    gfx.fillRoundedRect(bx, by, bw, bh, 6);

    // 파이 슬라이스: 남은 비율만큼 흰 반투명으로 표시 (12시=-π/2 기준)
    const startAngle = -Math.PI / 2;
    const endAngle   = startAngle + ratio * Math.PI * 2;

    gfx.fillStyle(0x000000, 0.45);
    gfx.beginPath();
    gfx.moveTo(cx, cy);
    // Phaser Graphics slice: fillArc가 없으므로 lineTo 기반 부채꼴
    const steps = Math.max(12, Math.ceil(ratio * 48));
    for (let s = 0; s <= steps; s++) {
      const a = startAngle + (endAngle - startAngle) * (s / steps);
      gfx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    gfx.closePath();
    gfx.fillPath();
  }

  destroy() {
    [this._bg, this._costBarBg, this._costBar, this._costText].forEach(o => o && o.destroy());
    for (const { btn } of this._buttons) {
      [btn.bg, btn.nameText, btn.costText, btn.hitZone].forEach(o => o && o.destroy());
    }
    for (const slot of this._skillSlots) {
      [slot.bg, slot.labelText, slot.subText, slot.hit].forEach(o => o && o.destroy());
    }
    for (const ov of this._cooldownOverlays) {
      ov && ov.destroy();
    }
    if (this._heroSlot) {
      [this._heroSlot.bg, this._heroSlot.nameText,
       this._heroSlot.costText, this._heroSlot.hitZone].forEach(o => o && o.destroy());
    }
  }
}

window.BattleHUD = BattleHUD;
