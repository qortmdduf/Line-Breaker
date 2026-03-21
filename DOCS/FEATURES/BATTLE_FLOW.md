# 전투 기능 명세

> **카테고리:** FEATURES
> **최초 작성:** 2026-03-21
> **최종 갱신:** 2026-03-21
> **관련 기능:** BattleScene, BattleHUD, CostSystem, WaveSystem, Unit, Hero, Castle, Projectile

## 개요

전투 씬(BattleScene)의 전체 동작을 명세한다. 유닛 소환, 전투 루프, 영웅 제한 로직, 승패 판정, 결과 처리까지 순서대로 기술한다.

---

## 전투 시작 조건

LobbyScene에서 해금된 스테이지 버튼을 탭하면 `scene.start('BattleScene', { stageId })` 가 호출되어 전투가 시작된다.

BattleScene의 `create()` 진입 시 수행되는 초기화 순서:

1. `SaveSystem.resetHeroUsed()` 호출 — 영웅 사용 플래그를 `false`로 초기화하고 세이브 저장
2. 배경(하늘 + 지면 + 지평선) 렌더링
3. `CostSystem` 인스턴스 생성 (코스트 초기값: 최대치 10)
4. 업그레이드 적용 화살 수치 계산 (아군 성에만 적용)
5. 아군 성 + 적군 성 생성
6. 유닛 배열 초기화 (`allyUnits`, `enemyUnits`, `projectiles`)
7. 성이 서로를 공격 타겟으로 참조 설정
8. `WaveSystem` 생성 및 시작 — 적 소환 타이머 루프 시작
9. `BattleHUD` 생성
10. 일시정지 버튼 생성
11. 스테이지 레이블 텍스트 표시

---

## 전투 루프

Phaser의 `update(time, delta)` 가 매 프레임 실행한다. `delta`는 이전 프레임과의 경과 시간(ms)이다.

```
매 프레임:
  1. costSystem.update(delta)       코스트 재생
  2. 죽은 유닛/투사체 배열에서 제거  (alive=false 필터)
  3. allyUnits.forEach → u.update() 아군 유닛 AI
  4. enemyUnits.forEach → u.update() 적군 유닛 AI
  5. projectiles.forEach → p.update() 투사체 이동 + 충돌
  6. hud.update(liveHero)           HUD 갱신
  7. _checkBattleEnd()              승패 판정
```

---

## 코스트 시스템

`CostSystem`은 전투 중에만 사용되는 인스턴스 기반 클래스다.

| 속성 | 값 |
|------|-----|
| 초기값 | 10 (최대치) |
| 최대값 | 10 (`GameConfig.COST_MAX`) |
| 재생 속도 | 초당 1 (`GameConfig.COST_REGEN_RATE`) |

코스트는 1초마다 정확히 1씩 증가한다. `_accumulator`로 초 단위 누적을 관리하여 프레임 드롭에도 정확한 틱을 보장한다. 최대치(10)를 초과하지 않는다.

---

## 유닛 소환 흐름

플레이어가 HUD의 유닛 버튼을 탭하면 다음 순서로 처리된다.

```
플레이어 탭
    ↓
BattleHUD.hitZone 'pointerdown'
    ↓
onSummon(unitId) 콜백 → BattleScene._onSummonRequest(unitId)
    ↓
[영웅 중복 검사]
  hero이고 save.heroUsed === true → 즉시 return (소환 불가)
    ↓
[코스트 차감 시도]
  costSystem.spend(unit.cost)
  → false (코스트 부족) → 즉시 return
  → true (차감 성공) → 계속
    ↓
[영웅 플래그 확정]
  유닛이 영웅이면:
    save.heroUsed = true
    SaveSystem.persist()
    hud.markHeroUsed()  ← 영웅 버튼 → 스킬 버튼으로 교체
    ↓
_spawnAlly(unitId)
  → getUnitStats(unitId, save.upgrades)  업그레이드 적용 스탯
  → unitId === 'hero' ? new Hero() : new AllyUnit()
  → allyUnits.push(unit)
```

### 영웅 소환 제한

영웅은 스테이지당 1회만 소환할 수 있다. 제한의 구현 방식:

- `save.heroUsed` 플래그를 전투 시작 시 `false`로 초기화
- 코스트 차감 **성공 후**에 `heroUsed = true`로 설정
- 코스트가 부족하면 플래그를 변경하지 않으므로 이후 다시 시도 가능

이 순서가 잘못되면(코스트 차감 전에 플래그 설정) 코스트가 부족한 상황에서 영웅 버튼이 영구히 비활성화되는 버그가 발생한다. QA에서 발견·수정 완료된 항목이다.

---

## 유닛 AI

`Unit.update(delta, enemies, enemyCastle)` 에서 매 프레임 실행되는 AI 로직:

```
1. attackCooldown -= delta

2. 사거리 내 가장 가까운 적 탐색 (_findTarget)
   → 찾음: 적 유닛 공격 (attackCooldown <= 0일 때)
   → 못 찾음: 전진 이동

3. 전진 이동 중 적 성이 사거리 내에 들어오면:
   → 이동 중단
   → 적 성 직접 공격 (attackCooldown <= 0일 때)
```

- 아군 유닛의 `direction` = `+1` (오른쪽)
- 적군 유닛의 `direction` = `-1` (왼쪽)
- 거리 계산: `Math.abs(this.x - e.x)` (1차원 x축 거리)

---

## 성 화살(Castle Arrow)

성은 자신을 향해 가장 가까운 적 유닛이 있을 때 `arrowInterval`(3000 ms)마다 화살을 발사한다.

- 아군 성 → `enemyUnits` 배열 중 가장 가까운 유닛을 타겟으로 발사
- 적군 성 → `allyUnits` 배열 중 가장 가까운 유닛을 타겟으로 발사

`Castle.setTargets(array)`로 매 프레임 갱신되는 배열 참조를 주입받는다. 배열 참조 자체는 변하지 않으므로 alive=false 유닛은 `_shootArrow` 내에서 skip된다.

---

## 투사체(Projectile)

직선으로 타겟 유닛을 추적한다. 매 프레임:

1. 타겟이 `alive=false`면 투사체 즉시 파괴 (데미지 없음)
2. 타겟까지의 거리 계산
3. 거리 ≤ 이번 프레임 이동 거리이면 타겟에 데미지 적용 후 파괴
4. 그렇지 않으면 타겟 방향으로 이동

---

## 승패 판정

`_checkBattleEnd()`가 매 프레임 실행된다.

| 조건 | 결과 |
|------|------|
| `enemyCastle.alive === false` | 승리 |
| `allyCastle.alive === false` | 패배 |

### 승리 처리

1. `CurrencySystem.addGold(stageData.reward)` — 보상 Gold 지급
2. `save.clearedStages`에 stageId 추가 (중복 없이)
3. `SaveSystem.persist()` — 세이브 저장
4. 800ms 후 `ResultScene` 전환 (`victory=true, reward=N`)

### 패배 처리

1. 세이브 데이터 변경 없음 (Gold, clearedStages 유지)
2. 800ms 후 `ResultScene` 전환 (`victory=false, reward=0`)

---

## 일시정지 (전투 포기)

우상단 ⏸ 버튼을 탭하면:
1. `waveSystem.stop()` 호출 — 적 소환 타이머 정지
2. `scene.start('LobbyScene')` — 즉시 로비 전환

전투 결과 처리(Gold 지급, 스테이지 클리어 기록)가 일어나지 않으므로 사실상 포기와 동일하다.

---

## 영웅 스킬 사용 흐름

영웅이 소환된 후 HUD 우측에 스킬 버튼이 표시된다.

```
스킬 버튼 탭
    ↓
BattleScene._onSkillRequest()
    ↓
allyUnits에서 Hero 인스턴스 탐색
    ↓
hero.isSkillReady() → false이면 아무 동작 없음
    ↓
hero.useSkill(enemyUnits)
  → skillCooldown = 5000 ms 설정
  → 영웅 x 기준 반경 80px 내 모든 적에게 atk×3 피해
  → 시각 효과: 금색 반투명 원, 300ms 후 제거
```

스킬 버튼 색상:
- 쿨다운 중: 어두운 황갈색 (`0x554400`), 잔여 초 표시
- 준비 완료: 밝은 황갈색 (`0xcc8800`), "준비!" 표시

---

## 씬 전환 다이어그램 (전투 내)

```mermaid
flowchart TD
    Start["BattleScene 시작\n(stageId 수신)"] --> Init["초기화\n(create)"]
    Init --> Loop["전투 루프\n(update 매 프레임)"]
    Loop --> Check{승패?}
    Check -->|진행 중| Loop
    Check -->|아군 성 HP=0| Defeat["패배 처리\n(Gold 미지급)"]
    Check -->|적군 성 HP=0| Victory["승리 처리\n(Gold 지급 + 세이브)"]
    Defeat --> Wait800["800ms 대기"]
    Victory --> Wait800
    Wait800 --> ResultScene["ResultScene 전환"]
    Loop --> Pause["포기 버튼 탭"]
    Pause --> LobbyScene["LobbyScene 전환\n(즉시, 결과 없음)"]
```
