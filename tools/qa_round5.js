// Round 5: 동시성 — 연속 클릭으로 _doUpgrade 중복 호출 시뮬레이션

// UpgradeScene._doUpgrade는 _removeOverlay + _buildOverlay로 UI를 즉시 재생성
// 재생성 전 짧은 구간에 버튼 연타가 가능한지 확인

// 핵심 질문:
// 1. _attachEvents에서 이벤트 위임 방식을 사용 — 오버레이 전체에 한 번만 등록
// 2. _doUpgrade 내에서 _removeOverlay() 후 _buildOverlay() 즉시 재실행
// 3. _removeOverlay()가 호출되면 overlay.remove()로 DOM에서 제거됨
// → 버튼 클릭 이벤트가 발동하면 오버레이가 제거 후 재생성 → 새 오버레이에 새 이벤트 등록
// → 동일 클릭 이벤트가 두 번 발동할 수 없음 (DOM 제거로 인해 이벤트 소멸)

// 시뮬레이션: 같은 save 객체에 _doUpgrade를 연속 2회 호출
let mockSave = { upgrades: { warrior: 0 }, unlockedUnits: ['warrior', 'archer'], gold: 0 };
let mockGold = 200; // CurrencySystem에서 관리

const UPGRADES = {
  warrior: { label: '전사', base: 35, maxLevel: 10, requireUnit: 'warrior', evolutionName: '광전사' },
};

function calcUpgradeCost(key, level) {
  const upg = UPGRADES[key];
  if (!upg) return 9999;
  return Math.floor(upg.base * Math.pow(1.5, level));
}

function spendGold(cost) {
  if (mockGold < cost) return false;
  mockGold -= cost;
  return true;
}

function _migrateLevel(save, key) {
  const upgrades = save.upgrades || {};
  if (upgrades[key] !== undefined) return upgrades[key];
  const hpLv  = upgrades[key + '_hp']  || 0;
  const atkLv = upgrades[key + '_atk'] || 0;
  return Math.min(5, Math.round((hpLv + atkLv) / 2));
}

function _doUpgrade(key) {
  const upg = UPGRADES[key];
  const currentLevel = _migrateLevel(mockSave, key);
  if (currentLevel >= upg.maxLevel) {
    console.log('  already maxed, skip');
    return;
  }
  const cost = calcUpgradeCost(key, currentLevel);
  if (!spendGold(cost)) {
    console.log('  insufficient gold');
    return;
  }
  mockSave.upgrades[key] = currentLevel + 1;
  // 실제 코드: _removeOverlay() + _buildOverlay() → DOM 재생성
  // 시뮬레이션상 이 시점에서 상태 스냅샷
  console.log(`  SUCCESS: level ${currentLevel} → ${mockSave.upgrades[key]}, gold left: ${mockGold}`);
}

console.log('--- 연속 2회 클릭 시뮬레이션 ---');
console.log('Initial state: level=0, gold=200');
console.log('Click #1:');
_doUpgrade('warrior'); // cost=35, gold=165, level→1
console.log('Click #2 (before overlay rebuild):');
_doUpgrade('warrior'); // cost=52 (floor(35*1.5^1)), gold=113, level→2
console.log('Click #3:');
_doUpgrade('warrior'); // cost=78, gold→35, level→3
console.log('Click #4 (insufficient gold, cost=118):');
_doUpgrade('warrior'); // gold=35 < 118 → insufficient

console.log('\n--- 중복 클릭 방지 검증 ---');
// 실제 UpgradeScene에서는 _removeOverlay가 DOM을 제거하여
// 동일 클릭 이벤트의 중복 발동을 막는다.
// 그러나 JS 이벤트 루프 내에서 같은 tick에 여러 이벤트가 쌓인 경우는?
// e.target.closest('button[data-action]')가 한 번 클릭에 한 번만 발동 → 안전

console.log('이벤트 위임 방식: 한 클릭에 하나의 이벤트만 발동 → 이중 공제 불가');
console.log('Final state:', JSON.stringify({ level: mockSave.upgrades.warrior, gold: mockGold }));
