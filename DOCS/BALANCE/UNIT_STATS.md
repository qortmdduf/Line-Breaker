# 유닛 스탯 및 밸런스 설계

> **카테고리:** BALANCE
> **최초 작성:** 2026-03-21
> **최종 갱신:** 2026-03-26
> **관련 기능:** units.js, stages.js, upgrades.js, getUnitStats

## 개요

이 문서는 게임 내 모든 유닛의 기본 스탯, 성(Castle) 수치, 스테이지 난이도 설계, 업그레이드 비용 공식, 재화 흐름을 정의한다. 밸런스 수치를 수정할 때는 반드시 이 문서의 관련 섹션을 함께 갱신한다.

---

## 아군 유닛 기본 스탯

모든 스탯은 `src/data/units.js`의 `window.UNITS` 객체에 정의되어 있다.

| 유닛 | HP | ATK | SPD (px/s) | 사거리 (px) | 공격 간격 (ms) | 반지름 (px) | 소환 코스트 | 기본 해금 | 특수 속성 |
|------|-----|-----|------------|-------------|----------------|-------------|------------|-----------|-----------|
| 전사 (warrior) | 50 | 10 | 60 | 40 | 1000 | 12 | 5 | O | — |
| 궁수 (archer) | 32 | 16 | 55 | 150 | 1500 | 10 | 8 | O | — |
| 방패병 (shielder) | 150 | 0 | 45 | 35 | 9999 | 14 | 10 | X | isShielder, knockbackImmune |
| 마법사 (mage) | 40 | 26 | 45 | 180 | 2000 | 11 | 15 | X | splashRadius: 80 |
| 기사 (knight) | 130 | 20 | 80 | 45 | 1200 | 15 | 20 | X | — |
| 성기사 (paladin) | 130 | 15 | 60 | 45 | 1300 | 16 | 30 | X | isPaladin, auraRadius: 100 |
| 뱀 마법사 (serpent_mage) | 55 | 70 | 42 | 200 | 1800 | 13 | 40 | X | splashRadius: 100 |
| 영웅 (hero) | 500 | 60 | 70 | 50 | 800 | 18 | 100 | X | isHero (스테이지당 1회) |

### killCostReward 필드

모든 유닛은 `killCostReward` 필드를 보유한다. 해당 유닛을 처치했을 때 처치한 측에 지급되는 코스트 양이다. 적군 유닛 처치 시 아군(플레이어)에게 이 값만큼 코스트가 즉시 지급된다.

| 유닛 | killCostReward |
|------|----------------|
| warrior | 5 |
| archer | 5 |
| shielder | 5 |
| mage | 5 |
| knight | 5 |
| paladin | 5 |
| serpent_mage | 5 |
| hero | 10 |
| elite | 8 |

### 유닛 역할 분담

- **전사 (warrior)**: 저비용 근접 탱커. 코스트 효율이 좋아 초반 라인 구성에 유용.
- **궁수 (archer)**: 원거리 딜러. HP가 낮으므로 전사 뒤에 배치하는 것이 효과적.
- **방패병 (shielder)**: ATK=0으로 직접 공격 없음. 적의 전진을 막아 뒤 유닛의 딜 시간을 버는 역할. `isShielder` 플래그로 공격 루틴이 완전히 차단된다.
- **마법사 (mage)**: 범위 공격 원거리 유닛. 타겟 위치 기준 반경 80px 내 모든 적에게 피해. 군집된 적에게 효과적.
- **기사 (knight)**: 고HP + 높은 이동속도 + 높은 단일 공격력. 빠르게 전선에 도달해 적을 강하게 압박하는 돌격 근접 유닛.
- **성기사 (paladin)**: 기사와 동일한 HP. 기사보다 낮은 이동속도·공격력을 가지지만, 범위 오라 버프(ATK+20%, 피해감소 10%, 최대 3스택)를 제공하는 서포트 근접 유닛.
- **뱀 마법사 (serpent_mage)**: 고ATK 범위 공격 원거리 유닛. 타겟 위치 기준 반경 100px 내 모든 적에게 피해.
- **영웅 (hero)**: 스테이지당 1회 소환 제한. 고HP + 고ATK + 최고 속도. 광역 스킬(반경 80px, 3배 피해) 보유.

---

## 적군 전용 유닛

적군 유닛은 `window.UNITS`에 함께 정의되어 있으나, 플레이어 업그레이드(`getUnitStats`)를 거치지 않고 기본 스탯을 그대로 사용한다.

### 정예병 (elite)

| 속성 | 값 |
|------|-----|
| HP | 190 |
| ATK | 22 |
| SPD | 40 px/s |
| 사거리 | 55 px |
| 공격 간격 | 1000 ms |
| 반지름 | 20 px (일반 적보다 큼) |
| killCostReward | 8 |
| isElite | true |

엘리트 적군의 외형 구분:

| 속성 | 일반 적 | 엘리트 적 |
|------|---------|-----------|
| 크기 | 기본 반지름 | 20 px (별도 정의) |
| 색상 | 유닛별 고유 | 자주색 (`0xcc44cc`) |
| `isElite` 플래그 | false | true |
| 등장 스테이지 | Stage 1~5 | Stage 3~5 |

---

## 성기사(팔라딘) 오라 버프 시스템

`src/entities/Paladin.js`에 구현. `Paladin`은 `AllyUnit`을 상속한다.

| 속성 | 값 |
|------|-----|
| 오라 반경 | 100 px (`auraRadius`) |
| ATK 보너스 (스택당) | +20% |
| 피해 감소 (스택당) | -10% |
| 최대 스택 | 3 |
| ATK 보너스 최대 | +60% (3스택) |
| 피해 감소 최대 | -30% (3스택) |

### 오라 적용 흐름

```
매 프레임:
  1. BattleScene이 모든 allyUnit의 _paladinDmgReduction, _paladinAtkBonus를 0으로 리셋
  2. 살아있는 모든 Paladin.update() 호출 → _applyAura(allies)
  3. _applyAura: 반경 내 아군 각각에 +0.10 / +0.20 누산 (최대 3스택 클램프)
```

여러 성기사가 동시에 존재하면 각자의 `_applyAura`가 순서대로 호출되어 스택이 중첩된다. 최대 3스택 클램프는 각 아군 유닛에 개별 적용된다.

오라 시각 효과: 황금색(`0xffcc00`) 반투명 원. 채우기 투명도 10%, 외곽선 투명도 40%, 두께 1.5px.

성기사가 사망(`die()` 호출)하면 오라 그래픽이 즉시 제거된다.

---

## 범위 공격(Splash) 시스템

`src/entities/AllyUnit.js`의 `_doAttack` 분기에서 처리된다.

| 유닛 | splashRadius |
|------|-------------|
| mage | 80 px |
| serpent_mage | 100 px |

`splashRadius`가 정의된 유닛이 공격 시: 최종 타겟의 위치를 중심으로 반경 내 살아있는 모든 적에게 피해를 적용한다. 단일 공격과 범위 공격 중 하나만 실행된다(분기 처리).

ATK 계산 시 팔라딘 오라 보너스(`_paladinAtkBonus`)가 반영된다:
```
실제 ATK = floor(stats.atk × (1 + _paladinAtkBonus))
```

---

## 방패병(Shielder) 공격 차단

`src/entities/Unit.js`의 `update`에서 `isShielder` 플래그를 확인한다.

```
if (this.attackCooldown <= 0 && !this.stats.isShielder) {
  this._doAttack(...)
}
```

방패병은 사거리 내에 적이 있어도, 적 성에 닿아도 공격하지 않는다. `atkSpd: 9999`로 공격 간격이 사실상 무한대이며, 공격 차단 조건과 이중으로 보호된다.

---

## 영웅 스킬 명세

| 속성 | 값 |
|------|-----|
| 스킬 종류 | 광역 공격 |
| 범위 | 영웅 위치 기준 반경 80 px |
| 피해량 | `hero.atk × 3` (업그레이드 적용 후 ATK 기준) |
| 쿨다운 | 5000 ms (5초) |
| 발동 조건 | 영웅이 살아있고 스킬 쿨다운이 0일 때 |

---

## 성(Castle) 수치

### 아군 성

| 속성 | 값 | 비고 |
|------|-----|------|
| HP | 100 | `GameConfig.CASTLE_HP_ALLY` |
| 화살 기본 데미지 | 5 | `GameConfig.ARROW_BASE_DAMAGE` |
| 화살 발사 간격 | 600 ms | `GameConfig.ARROW_INTERVAL` |
| 화살 발사 초속 | 600 px/s | `GameConfig.ARROW_PROJ_SPEED` |
| 화살 중력 | 600 px/s² | `GameConfig.ARROW_GRAVITY` |
| 기본 발사 각도 | 30° | `GameConfig.ARROW_ANGLE` |
| 최소 발사 각도 | 5° | `GameConfig.ARROW_ANGLE_MIN` |
| 최대 발사 각도 | 45° | `GameConfig.ARROW_ANGLE_MAX` |

아군 성 화살 수치는 플레이어 업그레이드(`arrow_dmg`, `arrow_spd`)에 의해 증가한다.

업그레이드 적용 공식:
```
실제 화살 데미지 = ARROW_BASE_DAMAGE + (arrow_dmg 레벨 × 10)
실제 화살 속도  = ARROW_PROJ_SPEED + (arrow_spd 레벨 × 40) [px/s]
```

예시: `arrow_dmg` 레벨 3, `arrow_spd` 레벨 2인 경우
- 데미지: 5 + 30 = **35**
- 속도: 600 + 80 = **680 px/s**

### 적군 성

| 속성 | 값 | 비고 |
|------|-----|------|
| 화살 데미지 | 5 (고정) | `GameConfig.ARROW_BASE_DAMAGE` 하드코딩 사용 |
| 화살 발사 간격 | 600 ms | 아군 성과 동일 |
| 화살 속도 | 600 px/s (고정) | 업그레이드 영향 없음 |
| HP | 스테이지별 상이 | 아래 스테이지 데이터 참조 |

적군 성 화살 수치가 고정인 이유: 플레이어 업그레이드가 적에게 반영되면 업그레이드할수록 전투가 어려워지는 역설이 발생한다. 자세한 결정 배경은 `DOCS/DECISIONS/ADR-003_ENEMY_CASTLE_FIXED_STATS.md` 참조.

---

## 스테이지 데이터

`src/data/stages.js`의 `window.STAGES` 배열. 인덱스는 `stageId - 1`로 접근한다.

| 스테이지 | 적군 성 HP | 소환 간격 (ms) | 등장 유닛 | 클리어 보상 (Gold) |
|---------|-----------|---------------|----------|-------------------|
| PROTOTYPE | 800 | 3000 | 전사, 궁수, 기사 (HP×0.6, ATK×0.5) | 없음 |
| Stage 1 | 500 | 2000 | 전사 | 50 |
| Stage 2 | 800 | 3500 | 전사, 궁수 | 80 |
| Stage 3 | 1200 | 3000 | 전사, 궁수, 기사, 정예 | 120 |
| Stage 4 | 1800 | 2500 | 전사, 궁수, 기사, 마법사, 정예 | 180 |
| Stage 5 | 2500 | 2000 | 전사, 궁수, 기사, 마법사, 영웅, 정예 | 250 |

### 적 소환 방식

WaveSystem이 `spawnInterval` 간격으로 `enemyUnits` 풀에서 **무작위 1개**를 선택하여 소환한다. 따라서 스테이지 4에서는 4종 중 하나가 균등한 확률(25%)로 소환된다.

### 스테이지 해금 조건

- Stage 1: 항상 해금
- Stage N (N ≥ 2): Stage N-1 클리어 완료 시 해금

---

## 업그레이드 트리

`src/data/upgrades.js`의 `window.UPGRADES` 객체. 모든 업그레이드는 최대 5레벨이다.

### 유닛 스탯 업그레이드

| 키 | 레이블 | 기본 비용 (base) | 요구 유닛 |
|----|--------|-----------------|-----------|
| `warrior_hp` | 전사 HP | 30 | warrior |
| `warrior_atk` | 전사 공격 | 40 | warrior |
| `archer_hp` | 궁수 HP | 35 | archer |
| `archer_atk` | 궁수 공격 | 50 | archer |
| `knight_hp` | 기사 HP | 50 | knight |
| `knight_atk` | 기사 공격 | 60 | knight |
| `mage_hp` | 마법사 HP | 60 | mage |
| `mage_atk` | 마법사 공격 | 80 | mage |

신규 유닛(shielder, paladin, serpent_mage)의 업그레이드는 현재 정의되어 있지 않다. 해당 유닛의 업그레이드 항목은 향후 세션에서 추가될 예정이다.

유닛 스탯 업그레이드 항목은 해당 유닛이 해금된 경우에만 UpgradeScene에 표시된다.

### 성 화살 업그레이드

| 키 | 레이블 | 기본 비용 (base) | 효과 |
|----|--------|-----------------|------|
| `arrow_dmg` | 성 화살 피해 | 80 | 레벨당 +10 데미지 |
| `arrow_spd` | 성 화살 속도 | 60 | 레벨당 +40 px/s |

---

## 업그레이드 비용 공식

```
비용 = floor(base × 1.5^currentLevel)
```

`base`는 업그레이드 항목별 기본값이며, `currentLevel`은 현재 레벨(0부터 시작)이다.

예시: `warrior_hp` (base=30) 각 레벨별 비용

| 현재 레벨 | 다음 레벨 비용 계산 | 비용 |
|-----------|-------------------|------|
| 0 → 1 | `floor(30 × 1.5^0)` | 30 G |
| 1 → 2 | `floor(30 × 1.5^1)` | 45 G |
| 2 → 3 | `floor(30 × 1.5^2)` | 67 G |
| 3 → 4 | `floor(30 × 1.5^3)` | 101 G |
| 4 → 5 | `floor(30 × 1.5^4)` | 151 G |
| **합계 (Lv 0→5)** | | **394 G** |

예시: `mage_atk` (base=80) 각 레벨별 비용

| 현재 레벨 | 비용 |
|-----------|------|
| 0 → 1 | 80 G |
| 1 → 2 | 120 G |
| 2 → 3 | 180 G |
| 3 → 4 | 270 G |
| 4 → 5 | 405 G |
| **합계 (Lv 0→5)** | **1,055 G** |

---

## 유닛 해금 비용

`src/data/upgrades.js`의 `window.UNLOCK_COSTS`.

| 유닛 | 해금 비용 |
|------|----------|
| 기사 (knight) | 200 G |
| 마법사 (mage) | 350 G |
| 영웅 (hero) | 500 G |

shielder, paladin, serpent_mage의 해금 비용은 현재 `UNLOCK_COSTS`에 정의되어 있지 않다. 이 유닛들은 프로토타입 모드(`window.PROTO_STAGE`)를 통해 접근 가능하다.

---

## 업그레이드 스탯 적용 공식

`window.getUnitStats(unitId, upgrades)` 함수로 계산된다.

```
최종 HP  = floor(base_hp  × (1 + hp_level  × 0.10))
최종 ATK = floor(base_atk × (1 + atk_level × 0.15))
```

예시: `warrior` (base HP=50, base ATK=10), HP 레벨 3 / ATK 레벨 2

- 최종 HP: `floor(50 × 1.30)` = **65**
- 최종 ATK: `floor(10 × 1.30)` = **13**

적군 유닛은 `getUnitStats`를 사용하지 않고 `window.UNITS`의 기본 스탯을 그대로 복사하여 사용한다. 플레이어 업그레이드가 적에게 반영되지 않는다.

---

## 재화 흐름 설계

### 수입 경로

| 이벤트 | 보상 |
|--------|------|
| Stage 1 클리어 | 50 G |
| Stage 2 클리어 | 80 G |
| Stage 3 클리어 | 120 G |
| Stage 4 클리어 | 180 G |
| Stage 5 클리어 | 250 G |
| 반복 클리어 | 동일 보상 (중복 지급 허용) |

### 설계 의도: 의도적 재화 부족

모든 유닛 해금 + 전 업그레이드를 위한 최소 누적 Gold는 약 8,000 G 이상으로, 5개 스테이지를 한 번씩 클리어해서 얻는 Gold(총 680 G)로는 모든 콘텐츠를 한 번에 해금할 수 없다. 이는 반복 플레이(그라인딩 루프)를 유도하기 위한 의도적 설계다.

최대 Gold 보유량 제한 없음. 세이브 데이터의 `gold` 필드는 상한이 없다.
