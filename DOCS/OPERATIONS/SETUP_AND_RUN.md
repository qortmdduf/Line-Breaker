# 실행 환경 설정 및 운영 절차

> **카테고리:** OPERATIONS
> **최초 작성:** 2026-03-21
> **최종 갱신:** 2026-03-21
> **관련 기능:** index.html, SaveSystem, 전체 프로젝트

## 개요

LineBreaker의 실행 방법, 개발 환경 설정, 세이브 데이터 관리 방법을 기술한다. 서버 없이 파일을 직접 열어 실행할 수 있도록 설계되었다.

---

## 실행 방법

### 방법 1: 파일 직접 열기 (최단 경로)

```
C:\qortmdduf\LineBreaker\index.html
```

위 파일을 브라우저(Chrome, Edge, Firefox)에서 직접 열면 즉시 실행된다.

주의: Phaser 3를 CDN에서 로드하므로 인터넷 연결이 필요하다. 오프라인 환경에서는 방법 2를 사용한다.

### 방법 2: 로컬 HTTP 서버 실행

`file://` 프로토콜에서 일부 브라우저 보안 정책이 문제가 될 경우 로컬 서버를 사용한다.

**Python 사용:**

```bash
cd "C:\qortmdduf\LineBreaker"
python -m http.server 8080
```

이후 브라우저에서 `http://localhost:8080` 접속.

**Node.js (npx serve) 사용:**

```bash
cd "C:\qortmdduf\LineBreaker"
npx serve .
```

---

## 개발 환경

### 최소 요구사항

| 항목 | 내용 |
|------|------|
| 브라우저 | Chrome 90+, Edge 90+, Firefox 88+, Safari 15+ |
| 인터넷 연결 | Phaser 3 CDN 로드를 위해 필요 (최초 1회 캐시 후 불필요) |
| 빌드 도구 | 불필요 (번들러, 트랜스파일러 없음) |
| Node.js | 로컬 서버 실행 시에만 필요 (선택 사항) |

### 오프라인 사용

CDN 없이 실행하려면 Phaser 3 파일을 로컬에 복사한다.

1. `https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js` 다운로드
2. `C:\qortmdduf\LineBreaker\lib\phaser.min.js` 로 저장
3. `index.html` 의 CDN 스크립트 태그를 수정:

```html
<!-- 변경 전 -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>

<!-- 변경 후 -->
<script src="lib/phaser.min.js"></script>
```

---

## 파일 구조

```
C:\qortmdduf\LineBreaker\
├── index.html              진입점
└── src/
    ├── config.js           전역 상수
    ├── data/
    │   ├── units.js        유닛 스탯
    │   ├── stages.js       스테이지 데이터
    │   └── upgrades.js     업그레이드 트리
    ├── systems/
    │   ├── SaveSystem.js   세이브/로드
    │   ├── CurrencySystem.js  Gold 관리
    │   ├── CostSystem.js   전투 코스트
    │   └── WaveSystem.js   적 소환 타이머
    ├── entities/
    │   ├── Unit.js         유닛 기반 클래스
    │   ├── AllyUnit.js     아군 유닛
    │   ├── EnemyUnit.js    적군 유닛
    │   ├── Hero.js         영웅 유닛
    │   ├── Castle.js       성 엔티티
    │   └── Projectile.js   화살 투사체
    ├── ui/
    │   ├── BattleHUD.js    전투 HUD
    │   ├── LobbyUI.js      로비 UI 빌더
    │   └── UpgradeUI.js    업그레이드 UI 빌더
    ├── scenes/
    │   ├── BootScene.js
    │   ├── MainMenuScene.js
    │   ├── LobbyScene.js
    │   ├── BattleScene.js
    │   ├── UpgradeScene.js
    │   └── ResultScene.js
    └── main.js             Phaser 초기화
```

---

## 세이브 데이터 관리

### 저장 위치

브라우저의 `localStorage`에 저장된다.

- 키: `defense_save`
- 형식: JSON 문자열

같은 브라우저, 같은 도메인(또는 같은 파일 경로)에서 실행해야 기존 세이브가 유지된다. 브라우저를 변경하거나 파일을 다른 경로로 이동하면 세이브가 초기화된다.

### 세이브 데이터 확인 방법

브라우저 개발자 도구(F12)에서 확인한다.

```
Application 탭 → Storage → Local Storage → 현재 도메인(또는 파일 경로)
→ 키: defense_save 확인
```

### 세이브 초기화 방법

**방법 1: 브라우저 개발자 도구 사용**

```
Application 탭 → Local Storage → 항목 선택 후 Delete 키
또는
Console 탭 진입 후 아래 명령 실행:
```

```javascript
localStorage.removeItem('defense_save');
location.reload();
```

**방법 2: SaveSystem.reset() 호출**

```javascript
// Console에서 직접 실행
window.SaveSystem.reset();
location.reload();
```

`reset()`은 `localStorage`에서 `defense_save`를 삭제하고 기본값 객체를 반환한다. 반드시 `location.reload()`로 페이지를 새로고침해야 게임이 기본 상태로 초기화된다.

**방법 3: 브라우저 사이트 데이터 삭제**

브라우저 설정 → 사이트 데이터 삭제에서 해당 경로의 데이터를 전체 삭제한다.

---

## 디버그 팁

### 초기 Gold 직접 설정

```javascript
// Console에서 실행
window.SaveSystem.get().gold = 9999;
window.SaveSystem.persist();
location.reload();
```

### 특정 스테이지 강제 해금

```javascript
// Console에서 실행 (Stage 1~4 클리어 처리)
const save = window.SaveSystem.get();
save.clearedStages = [1, 2, 3, 4];
window.SaveSystem.persist();
location.reload();
```

### 모든 유닛 해금

```javascript
const save = window.SaveSystem.get();
save.unlockedUnits = ['warrior', 'archer', 'knight', 'mage', 'hero'];
window.SaveSystem.persist();
location.reload();
```

---

## 버전 정보

| 항목 | 값 |
|------|-----|
| 게임 버전 | v1.0 |
| Phaser 버전 | 3.x (CDN latest: `phaser@3`) |
