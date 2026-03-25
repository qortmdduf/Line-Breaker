# WORK_LOG — 작업 진행 기록

작업이 중단되더라도 이 파일을 읽으면 현재 상태와 다음 작업을 즉시 파악할 수 있도록 작성.

---

## 현재 상태 (2026-03-26)

### 브랜치: `main`
### 최신 커밋: `c60458d` — fix: Phaser Scale 설정에 width/height 이동

---

## 세션별 작업 기록

---

### 세션 3 (2026-03-26) — 프로토타입 모드 & 밸런스 개편

#### 완료된 커밋
| 커밋 | 내용 |
|------|------|
| `e5c9ebe` | feat: 신규 유닛 3종, 프로토 모드, 밸런스 개편 및 조준 개선 |
| `c60458d` | fix: Phaser Scale 설정에 width/height 이동 |

#### 구현 완료 항목 (9개 요청)
1. **프로토타입 스테이지** — 로비 최상단에 PROTOTYPE 버튼 추가. `isProto:true`로 BattleScene 진입. `window.PROTO_STAGE` 별도 선언, STAGES 배열과 분리. 모든 프로토 코드는 `// [PROTO BEGIN]~[PROTO END]`로 격리.
2. **화살 각도 상한 수정** — `ARROW_ANGLE_MAX: 88 → 45` (최대 사거리 각도로 제한)
3. **조이스틱 축 제한** — 조준 조이스틱은 수직만, 이동 조이스틱은 수평만 이동
4. **이동 조이스틱 중앙 정렬** — `GAME_WIDTH / 2 = 422px` 위치로 변경
5. **코스트 재생 3배** — `COST_REGEN_RATE: 0.4 → 1.2`
6. **적군 처치 시 코스트 획득** — `onDie` 콜백 + `gainCost()`, `killCostReward: 5` (기본값, 유닛별 확장 가능)
7. **적군 스탯 너프** (~35% 감소)

   | 유닛 | HP (전→후) | ATK (전→후) |
   |------|-----------|------------|
   | warrior | 80 → 50 | 15 → 10 |
   | archer | 50 → 32 | 25 → 16 |
   | knight | 200 → 130 | 20 → 13 |
   | mage | 60 → 40 | 40 → 26 |
   | elite | 300 → 190 | 35 → 22 |

8. **신규 유닛 3종 및 코스트 재편**

   | 유닛 | 코스트 | 특성 |
   |------|--------|------|
   | 전사(warrior) | 5 | 기존 유지 |
   | 궁수(archer) | 8 | 기존 유지 |
   | 방패병(shielder) | 10 | ATK=0, HP 150, knockbackImmune 플래그 |
   | 마법사(mage) | 15 | splashRadius 80, 범위 공격 |
   | 기사(knight) | 20 | 코스트 4→20 |
   | 성기사(paladin) | 30 | 오라 버프, 아래 9번 참고 |
   | 뱀 마법사(serpent_mage) | 40 | HP 55, ATK 70, splashRadius 100 |
   | 영웅(hero) | 100 | 코스트 150→100 |

9. **성기사(paladin) 오라 시스템**
   - 반경 100px 아군에게 ATK +20%, 피해 감소 -10% 버프
   - 최대 3스택 중첩 (ATK +60%, 피해 감소 -30%)
   - 시각 효과: 반투명 황금 원(10% 투명도 채우기 + 40% 외곽선)
   - 버프는 매 프레임 리셋 후 재적용 (팔라딘 여러 명 중첩 지원)
   - 팔라딘 사망 시 오라 그래픽 즉시 제거

#### 신규 파일
- `src/entities/Paladin.js` — 성기사 클래스 (AllyUnit 상속)
- `DOCS/FEATURES/PROTO_GUIDE.md` — 프로토타입 삭제/복원 상세 가이드

#### 수정된 파일
- `src/config.js`, `src/data/units.js`, `src/data/stages.js`
- `src/systems/CostSystem.js`
- `src/entities/Unit.js`, `AllyUnit.js`
- `src/scenes/BattleScene.js`, `LobbyScene.js`
- `src/ui/BattleHUD.js`
- `index.html`, `src/main.js`

#### QA PASS (2026-03-26)
- 전 항목 E2E 검증 완료
- PROTOTYPE 버튼 노출 및 프로토 전투 진입 확인
- 8종 유닛 소환 정상 동작 확인
- 성기사 오라 시각 효과 및 버프 적용 확인
- 화살 45° 상한 및 조이스틱 축 분리 확인
- 코스트 재생 속도(1.2/s) 및 적군 처치 시 코스트 획득 확인
- 범위 공격(mage, serpent_mage) 정상 동작 확인

#### 문서화 완료 (2026-03-26)
- `DOCS/BALANCE/UNIT_STATS.md` 전면 갱신 — 8종 아군 + elite 스탯, killCostReward, 오라/범위공격/방패병 명세, 성 수치 코드 기준 동기화
- `DOCS/FEATURES/BATTLE_FLOW.md` 갱신 — 코스트 획득 경로, 신규 유닛 3종 명세, 오라 버프 흐름
- `DOCS/SYSTEM/ARCHITECTURE.md` 갱신 — Paladin 전역 네임스페이스 추가, 스크립트 로드 순서 갱신, 엔티티 계층 구조 섹션 추가
- `DOCS/OPERATIONS/WORK_LOG.md` 갱신 — 세션 3 QA PASS 및 문서화 완료 기록

---

### 세션 2 (이전 세션) — 가로 모드, 화살, 조이스틱, HUD

커밋: `7c2b1e1`

| 구현 항목 |
|-----------|
| 화면 가로 모드 고정 (844×390) |
| 화살 포물선 + 관통 시스템 (ArcProjectile) |
| 불화살 스킬 (10초 쿨다운, 화상 DoT) |
| 좌우 분리 가상 조이스틱 (이동 / 조준) |
| HUD 개편 (상단 고정, 스킬바/유닛바 분리) |
| 엘리트 적군 추가 (Stage 3~5 등장) |
| 월드 너비 1200px, 카메라 스크롤 |

---

### 세션 1 (초기 구현) — 커밋 `33f7111`~`9fe0996`

| 커밋 | 내용 |
|------|------|
| `33f7111` | LineBreaker 초기 구현 |
| `9fe0996` | 성 거리 4배, 화살 포물선, 자동 소환, 에너지 150 |
| `0b74d9b` | 조작성·밸런스 개선, 드래그 컨트롤 |
| `12033ba` | 긴장감 효과, 불화살 스킬, 스킬바/유닛바 UI |
| `ed6b0d1` | 가상 조이스틱으로 전환 |

---

## 다음 작업 후보 (미결)

- [x] **QA 검증** — 2026-03-26 완료
- [x] **DOCS 수치 동기화** — 2026-03-26 완료

- [ ] **영웅 종류별 구현** — 홀리나이트, 엘리멘탈 소서러, 파마 궁사, 어쌔신, 수인영웅 (스킬 설계 후 진행)

- [ ] **스크롤(아이템)** 시스템 — 이전 세션에서 논의됨, 세부 설계 필요

- [ ] **적군 다양화** — 성기사, 뱀 마법사 등 아군 유닛에 대응하는 적군 추가

- [ ] **DOCS 수치 동기화** — UNIT_STATS.md 등 일부 문서가 코드 실제값과 불일치

---

## 프로젝트 구조 요약

```
LineBreaker/
├── index.html
├── src/
│   ├── config.js               전역 상수
│   ├── main.js                 Phaser 초기화
│   ├── data/
│   │   ├── units.js            유닛 스탯 (아군/적군 공용)
│   │   ├── stages.js           스테이지 데이터 + PROTO_STAGE
│   │   └── upgrades.js         업그레이드 데이터
│   ├── entities/
│   │   ├── Unit.js             기반 클래스
│   │   ├── AllyUnit.js         아군 (splashRadius 범위공격 포함)
│   │   ├── EnemyUnit.js        적군
│   │   ├── Paladin.js          성기사 (오라 버프)
│   │   ├── Hero.js             영웅
│   │   ├── Castle.js           성
│   │   └── Projectile.js       Projectile + ArcProjectile
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MainMenuScene.js
│   │   ├── LobbyScene.js       스테이지 선택 + PROTOTYPE 버튼
│   │   ├── BattleScene.js      전투 핵심 (isProto 분기 포함)
│   │   ├── UpgradeScene.js
│   │   └── ResultScene.js
│   ├── systems/
│   │   ├── WaveSystem.js
│   │   ├── SaveSystem.js
│   │   ├── CurrencySystem.js
│   │   └── CostSystem.js       gainCost() 포함
│   └── ui/
│       ├── BattleHUD.js        8종 슬롯 (프로토 모드)
│       ├── LobbyUI.js
│       └── UpgradeUI.js
└── DOCS/
    ├── FEATURES/
    │   ├── PROTO_GUIDE.md      ← 프로토 삭제/복원 가이드
    │   └── BATTLE_FLOW.md
    ├── BALANCE/UNIT_STATS.md
    ├── OPERATIONS/
    │   ├── SETUP_AND_RUN.md
    │   └── WORK_LOG.md         ← 이 파일
    ├── SYSTEM/ARCHITECTURE.md
    └── DECISIONS/
```
