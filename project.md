# LineBreaker — 프로젝트 규약

> 이 파일은 LineBreaker 프로젝트 전용 규약이다.
> 다른 프로젝트 작업 시에는 읽지 않는다.

---

## 프로젝트 개요

- **장르**: 모바일 2D 디펜스 게임 (카툰워즈2 참고)
- **테마**: 판타지 / 중세
- **핵심 루프**: 병사 소환 → 적 성 격파 → 보상 → 업그레이드 → 반복

---

## 아트 스타일 규약

### 기준 레퍼런스 이미지

```
Art/panorama/panorama_02_폭풍의 전장.png
```

**모든 아트 작업은 이 이미지의 분위기와 스타일을 기준으로 생성한다.**

### 핵심 스타일 키워드

| 항목 | 기준 |
|------|------|
| **분위기** | 폭풍, 번개, 어둡고 긴박한 전장, 극적인 하늘 |
| **화풍** | Bold cartoon art style, thick outlines |
| **색감** | 채도 높은 비비드 컬러, 어두운 배경과 밝은 캐릭터의 대비 |
| **조명** | 번개/마법 폭발에서 나오는 역동적인 광원 |
| **전체 톤** | 긴박하고 서사적인(epic) 판타지 전쟁 |

### 이미지 생성 시 고정 프롬프트 요소

아트 작업 시 아래 키워드를 항상 프롬프트에 포함한다:

```
medieval fantasy, bold cartoon art style, thick outlines, vibrant colors,
stormy dramatic sky, epic battle atmosphere, consistent with dark fantasy war theme
```

---

## 미정 항목 (추후 논의)

- [ ] 병사 유닛 아이콘 스타일 (warrior, archer, knight, mage, hero)
- [ ] 게임 플레이 인게임 에셋 스타일 (실제 게임에서 사용되는 스프라이트)
- [ ] UI 패널/버튼 디자인 방향
- [ ] 세계관 설정 (왕국 이름, 마왕 이름, 스토리 배경 등)

---

## 파일 구조 규약

```
Art/
├── panorama/     전체 씬 파노라마 컨셉 아트
├── characters/   캐릭터 개별 컨셉 아트
├── ui/           UI 요소 컨셉 아트
└── assets/       실제 게임에 사용될 최종 에셋
```

---

## 기술 스택

- **엔진**: Phaser.js 3 (CDN)
- **이미지 생성**: DALL-E 3 (OpenAI API)
- **세이브**: localStorage
- **실행**: file:// 직접 실행 (빌드 툴 없음)
