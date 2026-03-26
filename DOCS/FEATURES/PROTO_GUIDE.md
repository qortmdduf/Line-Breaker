# PROTO_GUIDE — 프로토타입 모드 삭제/복원 가이드

프로토타입 모드는 신규 유닛(방패병, 성기사, 뱀 마법사)과 밸런스 변경을 격리된 환경에서 테스트하기 위한 모드입니다.
모든 프로토 관련 코드는 `// [PROTO BEGIN]` ~ `// [PROTO END]` 블록으로 명확히 구분되어 있습니다.

---

## 프로토타입 모드 삭제 방법

### 1. src/data/stages.js
파일 맨 끝의 블록 전체 제거:
```
// [PROTO BEGIN] — 프로토타입 스테이지
window.PROTO_STAGE = { ... };
// [PROTO END]
```

### 1-A. src/scenes/BattleScene.js (_spawnEnemy 내 multiplier)
`_spawnEnemy` 메서드 내 적 스탯 배율 적용 코드 제거:
```javascript
const hpMult  = (this.stageData.enemyHpMult  !== undefined) ? this.stageData.enemyHpMult  : 1.0;
const atkMult = (this.stageData.enemyAtkMult !== undefined) ? this.stageData.enemyAtkMult : 1.0;
stats.hp  = Math.max(1, Math.floor(stats.hp  * hpMult));
stats.atk = Math.max(1, Math.floor(stats.atk * atkMult));
```
(단, 일반 스테이지별 난이도 조정에도 사용하는 구조이므로, 일반 스테이지에서 사용할 예정이라면 제거하지 않아도 됨)

### 2. src/scenes/LobbyScene.js
`create()` 내의 PROTOTYPE 버튼 블록 제거:
```
// [PROTO BEGIN]
const protoBtn = this.add.text(...);
protoBtn.on('pointerdown', ...);
// [PROTO END]
```

### 3. src/scenes/BattleScene.js
다음 4개 블록 제거:

- `init()` 내 isProto 플래그 및 분기:
  ```
  // [PROTO BEGIN]
  this.isProto = ...;
  this.stageData = this.isProto ? ... : ...;
  // [PROTO END]
  ```
  → `this.stageData = window.STAGES[this.stageId - 1];` 로 복원

- `create()` 내 HUD 생성 시 options 인자:
  ```
  // [PROTO BEGIN]
  { isProto: this.isProto }
  // [PROTO END]
  ```

- `_spawnAlly()` 내 paladin 분기:
  ```
  // [PROTO BEGIN]
  else if (unitId === 'paladin') unit = new window.Paladin(this, x, y, stats);
  // [PROTO END]
  ```

- `_spawnEnemy()` 내 onDie 콜백:
  ```
  // [PROTO BEGIN] — 킬 시 코스트 획득
  unit.onDie = ...;
  // [PROTO END]
  ```

- `update()` 내 팔라딘 버프 리셋 블록:
  ```
  // [PROTO BEGIN] — 팔라딘 버프 매 프레임 리셋
  for (const u of this.allyUnits) { ... }
  // [PROTO END]
  ```

- `_onSummonRequest()` 내 주석 블록 (코드 없음, 주석만):
  ```
  // [PROTO BEGIN]
  // 프로토 모드는 해금 여부 미검사
  // [PROTO END]
  ```

- `_endBattle()` 내 isProto 분기:
  ```
  // [PROTO BEGIN]
  if (!this.isProto) {
  // [PROTO END]
    ...
  // [PROTO BEGIN]
  }
  // [PROTO END]
  ```
  → 중괄호 제거, 내부 코드만 남기기

### 4. src/ui/BattleHUD.js
`constructor` 내 `_isProto` 초기화 제거 및 `_buildUnitBar` 내 [PROTO] 분기들 제거.
슬롯 배열을 원래대로 복원:
```javascript
const slots = ['warrior', 'archer', null, null, null, null, null, 'hero'];
```
영웅 해금 조건도 원래대로:
```javascript
const heroAvailable = save.unlockedUnits.includes('hero') && !save.heroUsed;
```

### 5. src/entities/Paladin.js
파일 전체 삭제.

### 6. index.html
`Paladin.js` 스크립트 태그 제거:
```html
<script src="src/entities/Paladin.js"></script>
```

---

## 프로토타입 모드 복원 방법

이 가이드 파일(`DOCS/FEATURES/PROTO_GUIDE.md`)을 참조하여 위 변경사항을 역순으로 재적용합니다.
또는 git 히스토리에서 프로토 구현 커밋을 cherry-pick 하거나 해당 시점으로 되돌립니다.

---

## 관련 파일 목록

| 파일 | 역할 |
|------|------|
| `src/data/stages.js` | `window.PROTO_STAGE` 정의 |
| `src/data/units.js` | shielder, paladin, serpent_mage 유닛 데이터 |
| `src/entities/Paladin.js` | 성기사 오라 시스템 |
| `src/entities/AllyUnit.js` | splashRadius 범위 공격, 신규 유닛 색상 |
| `src/entities/Unit.js` | onDie 콜백, 팔라딘 버프 필드 |
| `src/scenes/BattleScene.js` | isProto 플래그, 팔라딘 버프 리셋, 킬 코스트 획득 |
| `src/scenes/LobbyScene.js` | PROTOTYPE 버튼 |
| `src/ui/BattleHUD.js` | 8종 슬롯, 프로토 모드 해금 검사 생략 |
| `src/systems/CostSystem.js` | `gainCost()` 메서드 |
