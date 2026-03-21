// UpgradeUI.js — 업그레이드 씬 UI 헬퍼
// UpgradeScene이 사용하는 버튼 생성 유틸리티

window.UpgradeUI = {
  /**
   * 업그레이드 항목 버튼 생성
   * @param {Phaser.Scene} scene
   * @param {string} key       - 업그레이드 키
   * @param {number} x
   * @param {number} y
   * @param {function} onBuy
   * @returns {{ bg, labelText, levelText, costText, hitZone }}
   */
  makeUpgradeRow(scene, key, x, y, onBuy) {
    const cfg = window.GameConfig;
    const save = window.SaveSystem.get();
    const upgData = window.UPGRADES[key];
    const currentLevel = (save.upgrades[key]) || 0;
    const maxLevel = upgData.maxLevel;
    const cost = window.calcUpgradeCost(key, currentLevel);
    const canBuy = currentLevel < maxLevel && window.CurrencySystem.getGold() >= cost;
    const maxed = currentLevel >= maxLevel;

    const W = cfg.GAME_WIDTH;
    const rowW = W - 20;
    const rowH = 52;
    const bx = 10;

    const bg = scene.add.graphics();
    bg.fillStyle(0x223355);
    bg.fillRoundedRect(bx, y, rowW, rowH, 8);

    const labelText = scene.add.text(bx + 12, y + 8, upgData.label, {
      fontSize: '14px', color: '#ffffff'
    });

    const levelText = scene.add.text(bx + 12, y + 28, 'Lv ' + currentLevel + ' / ' + maxLevel, {
      fontSize: '12px', color: '#aaaaaa'
    });

    let btnText, btnColor;
    if (maxed) {
      btnText = 'MAX';
      btnColor = 0x446644;
    } else {
      btnText = cost + 'G';
      btnColor = canBuy ? 0x335599 : 0x553333;
    }

    const btnW = 72, btnH = 32;
    const btnX = bx + rowW - btnW - 8;
    const btnY = y + (rowH - btnH) / 2;

    const btnBg = scene.add.graphics();
    btnBg.fillStyle(btnColor);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);

    const costText = scene.add.text(btnX + btnW / 2, btnY + btnH / 2, btnText, {
      fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5);

    if (!maxed) {
      const hitZone = scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
        .setInteractive({ useHandCursor: true });
      if (canBuy) {
        hitZone.on('pointerdown', () => onBuy(key));
      }
      return { bg, labelText, levelText, costText, btnBg, hitZone };
    }

    return { bg, labelText, levelText, costText, btnBg };
  },

  /**
   * 유닛 해금 버튼 생성
   */
  makeUnlockRow(scene, unitId, x, y, onUnlock) {
    const cfg = window.GameConfig;
    const save = window.SaveSystem.get();
    const unit = window.UNITS[unitId];
    const cost = window.UNLOCK_COSTS[unitId];
    const alreadyUnlocked = save.unlockedUnits.includes(unitId);
    const canBuy = !alreadyUnlocked && window.CurrencySystem.getGold() >= cost;

    const W = cfg.GAME_WIDTH;
    const rowW = W - 20;
    const rowH = 52;
    const bx = 10;

    const bg = scene.add.graphics();
    bg.fillStyle(0x332233);
    bg.fillRoundedRect(bx, y, rowW, rowH, 8);

    const labelText = scene.add.text(bx + 12, y + 8, unit.name + ' 해금', {
      fontSize: '14px', color: '#ffffff'
    });

    const descText = scene.add.text(bx + 12, y + 28,
      alreadyUnlocked ? '해금 완료' : ('비용: ' + cost + ' Gold'), {
        fontSize: '12px', color: alreadyUnlocked ? '#44cc44' : '#ffdd88'
      });

    if (!alreadyUnlocked) {
      const btnW = 72, btnH = 32;
      const btnX = bx + rowW - btnW - 8;
      const btnY = y + (rowH - btnH) / 2;

      const btnBg = scene.add.graphics();
      btnBg.fillStyle(canBuy ? 0x885500 : 0x553333);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);

      const btnText = scene.add.text(btnX + btnW / 2, btnY + btnH / 2, cost + 'G', {
        fontSize: '13px', color: '#ffd700'
      }).setOrigin(0.5);

      if (canBuy) {
        const hitZone = scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
          .setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => onUnlock(unitId));
        return { bg, labelText, descText, btnBg, btnText, hitZone };
      }
      return { bg, labelText, descText, btnBg, btnText };
    }

    return { bg, labelText, descText };
  },
};
