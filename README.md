# 최지환 — Game Designer Portfolio

**https://geato7.github.io/choijihwan-portfolio/**

내용(`content.json`)과 화면(`src/template.js`)이 분리돼 있다.
글을 고칠 때 HTML을 건드릴 일은 없다.

```
.
├── content.json                ← ★ 사이트의 모든 글. 수정은 여기만.
├── admin/
│   ├── index.html              ← 웹 편집기 (/admin/)
│   └── stats.js                ← 방문 통계 화면
├── src/
│   ├── template.js             ← content.json -> HTML 변환 (구조를 바꿀 때만)
│   ├── analytics.js            ← 사이트에 심는 방문 기록 스크립트
│   ├── game.js                 ← 미니게임 「너구리」
│   └── styles.css              ← 디자인
├── build.mjs                   ← node build.mjs → 페이지 10장 생성
├── index.html                  ← 자동 생성물. 직접 고치지 말 것.
├── projects.html               ← "
├── projects/<id>.html          ← "  프로젝트 한 장씩
├── notes.html                  ← "  기획 노트
├── contact.html                ← "
├── 404.html                    ← "  없는 주소용
├── sitemap.xml / robots.txt    ← "  검색엔진용
├── assets/                     ← 이미지
├── files/                      ← 포트폴리오 PDF (devlog/ 안은 데브로그 첨부)
└── .github/workflows/deploy.yml ← main 푸시 시 빌드 + 배포
```

## 수정하는 방법 1 — 웹 편집기 (권장)

**https://geato7.github.io/choijihwan-portfolio/admin/**

왼쪽에서 고치면 오른쪽 미리보기가 바로 바뀐다. **[사이트에 반영]** 을 누르면
20초쯤 뒤 실제 사이트에 적용된다. 폰·태블릿에서도 된다.

처음 한 번은 GitHub 토큰 등록이 필요하다 (편집기 안내를 따라가면 된다):

1. [토큰 만들기](https://github.com/settings/personal-access-tokens/new)
2. Repository access → **Only select repositories** → `choijihwan-portfolio`
3. Permissions → Repository permissions → **Contents: Read and write**
4. 생성된 `github_pat_…` 를 편집기에 붙여넣기

> 토큰은 그 브라우저에만 저장된다. 공용 PC에서는 등록하지 말고
> **[파일로 저장]** 으로 `content.json` 을 받아 저장소에 올리면 된다.
> 토큰을 지우려면 편집기 우상단 상태 글씨를 눌러 **삭제**.

편집기에서 할 수 있는 것:

- 모든 글 수정, 항목 추가·삭제·순서 변경
- 프로젝트 통째로 추가·삭제·순서 변경
- 프로젝트 안 블록(중점 작업 / 갤러리 / 영상 / 표 …) 순서 변경
- 이미지 파일 올리기 (`assets/uploads/` 로 올라간다)
- 데스크톱 / 모바일 미리보기 전환

## 수정하는 방법 2 — GitHub 웹 에디터

저장소에서 **`.` (마침표)** 키를 누르면 브라우저에 VS Code가 열린다.
`content.json` 을 고치고 커밋하면 자동 배포된다.

## 수정하는 방법 3 — 로컬

```bash
node build.mjs
```

페이지 10장이 다시 만들어진다. 미리 보려면:

```bash
python -m http.server 8000
```

커밋·푸시는 GitHub Desktop에서 버튼으로 하면 된다.
(생성된 HTML을 커밋하지 않아도 배포 시 Actions가 다시 만든다.)

## 페이지 구성

헤더 메뉴는 **소개 · 프로젝트 · 기획 노트 · 연락처** 네 갈래뿐이고, 누르면 실제로
페이지가 바뀐다. 한 페이지에 전부 이어 붙이지 않는다.

| 주소 | 내용 |
| --- | --- |
| `index.html` | 소개 (첫 화면) |
| `projects.html` | 프로젝트 카드 목차 — 카드를 누르면 아래로 이동 |
| `projects/<id>.html` | 프로젝트 하나. 맨 아래에 목록 복귀 + 앞뒤 프로젝트 이동 |
| `notes.html` | 기획 노트 (옛 주소 devlog.html 은 이쪽으로 넘어간다) |
| `contact.html` | 연락처 + 미니게임 |

`projects/` 안의 페이지는 한 단계 깊으므로 이미지·PDF 경로 앞에 `../` 가 자동으로
붙는다. `content.json` 에는 `assets/…`, `files/…` 처럼 그냥 적으면 된다.

글이 하나도 없으면 `notes.html` 과 메뉴의 **기획 노트** 가 함께 사라진다.

편집기 미리보기 위쪽 선택 상자로 어느 페이지를 볼지 고를 수 있다.

## 새 프로젝트를 추가하려면

편집기 맨 아래 **[+ 프로젝트 추가]** 를 누르거나, `content.json` 의
`projects` 배열에 블록 하나를 복사해 넣는다. 디자인은 자동으로 똑같이 적용된다.

`blocks` 배열이 그 프로젝트 안에서 무엇을 어떤 순서로 보여줄지 정한다.
내용이 비어 있는 블록은 자동으로 빠진다.

| 블록 이름 | 화면에 나오는 것 |
| --- | --- |
| `myPart` | MY PART — 중점 작업 |
| `gallery` | 이미지 2열 갤러리 |
| `wideShot` | 가로 전체 이미지 |
| `stats` | 숫자 지표 줄 |
| `videos` | 유튜브 영상 (2열) |
| `details` | 항목 — 설명 표 |
| `table` | 행렬형 표 |
| `buttons` | 버튼 줄 |

## 기획 노트

`notes.html` 한 장에 날짜순 기록이 쌓인다.
편집기에서 **기획 노트** 그룹을 열어 **[+ 글 추가]** 로 늘리면 된다 — 날짜 · 제목 ·
연결 프로젝트 태그 · 회고 · 첨부 파일(직접 업로드 가능)을 채우면 끝. 날짜는
`YYYY-MM-DD` 로 적으면 최신 글이 자동으로 위에 온다. 제목을 비워두면 그 글은
사이트에서 빠지고, 글이 하나도 없으면 섹션 자체와 메뉴 링크가 통째로 사라진다.
글마다 별도 URL은 없고 한 페이지 안에 리스트로 쌓인다 — 새 글이 늘어도 사이트
구조나 디자인은 안 바뀐다.

## 미니게임 「너구리」

**연락처 페이지** 아래에 **[잠깐 쉬어가기 — 너구리]** 버튼이 있다. 누르면 창이 열린다.
사다리를 타고 층을 오르내리며 과일을 다 먹으면 다음 판, 뱀에 닿으면 죽는다.
방향키(모바일은 화면 버튼)로 조작하고 ESC 로 닫는다. 최고 점수는 그 브라우저에 남는다.

1982년 오락실 게임에서 **규칙만** 가져왔다. 원작의 ROM·스프라이트·코드는 저작권이
있어 쓰지 않았고, 도트 그림과 로직은 [`src/game.js`](src/game.js) 안에서 전부 새로
만들었다. 외부 라이브러리도 쓰지 않는다.

끄고 싶으면 편집기 **사이트 정보 → 미니게임 보여주기** 체크를 풀면 된다
(`content.json` 의 `site.miniGame` 이 `false` 가 되고, 게임 코드가 `contact.html` 에서
통째로 빠진다. 다른 페이지에는 원래 들어가지 않는다). 버튼 문구는 `site.gameLabel`, 옆 설명은 `site.gameNote` 로 바꾼다.

방문 통계를 켜 뒀다면 게임을 연 방문자는 '본 곳' 에 **미니게임(너구리)** 로 남는다.

## 방문 통계

**https://geato7.github.io/choijihwan-portfolio/admin/** → 상단 **[방문 통계]**

오늘 몇 명이 왔는지, 날짜별로 몇 번 보고 갔는지, 어떤 프로젝트를 열어 봤는지를 본다.
날짜 막대나 표의 날짜 줄을 누르면 그날 접속자 목록으로 바뀐다.

처음 한 번은 Firebase 설정이 필요하다. **[방문 통계]** 를 누르면 나오는
5단계 안내(규칙 복사 버튼 포함)를 그대로 따라가면 되고, 마지막에 `projectId` 와
`apiKey` 두 값을 넣고 **[사이트에 반영]** 을 누르면 끝난다.
값은 `content.json` 의 `site.analytics` 에 저장된다 — **비워 두면 수집 자체가 꺼진다.**

설정한 뒤 사이트를 한 번 열고 Firebase 콘솔의 `visits` 컬렉션에 문서가 생기는지
확인하면 정상 동작을 알 수 있다. 안 생기면 규칙을 게시했는지부터 본다.

**남기는 것** — 날짜, 브라우저마다 무작위로 만든 익명 ID, 기기·OS·브라우저,
유입 경로(어느 사이트에서 왔는지), 표준시간대로 짐작한 지역, 머문 시간,
화면에 실제로 보인 프로젝트.
**안 남기는 것** — IP 주소, 이름, 이메일. 사람을 특정할 수 있는 값은 저장하지 않는다.

내 방문까지 세면 숫자가 흐려지니 통계 화면의 **[내 방문 제외]** 를 켜 둔다
(그 브라우저에만 적용된다). `localhost` 와 편집기 미리보기는 원래 안 잡힌다.

기록은 무한정 쌓이므로 가끔 **[오래된 기록 정리]** 로 180일 지난 것을 지운다.
**[CSV]** 로 내려받으면 엑셀에서 볼 수 있다.

## 테마 (다크 / 라이트)

우측 상단 버튼으로 전환한다. **기본은 다크**이고, 방문자가 고른 값은 그 브라우저에
기억된다. 색은 [`src/styles.css`](src/styles.css) 맨 위 두 블록에만 정의돼 있다.

- `:root, :root[data-theme="dark"]` — 다크 팔레트
- `:root[data-theme="light"]` — 라이트 팔레트

기본을 시스템 설정(OS의 다크모드 여부)에 맞추고 싶으면 `src/template.js` 의
`<head>` 안 초기화 스크립트에서 저장값이 없을 때 `matchMedia('(prefers-color-scheme: dark)')`
결과를 쓰도록 바꾸면 된다.

## 브랜드 마크 · 공유 미리보기

파비콘과 링크 공유용 이미지는 `assets/brand/mark.png` 한 장에서 생성된다.
마크를 바꾸려면 그 파일을 교체하고 두 스크립트를 실행한 뒤 커밋하면 된다.

```bash
python tools/make-icons.py
```

```bash
python tools/make-og.py
```

- `favicon.ico` — 16px는 'CJ', 32/48px는 'CJH' 전체. 세 글자는 16px에서 뭉개지기 때문이다.
- `og-image.png` — 1200×630. 카카오톡 썸네일(약 300px)에서도 읽히도록 이름과 직함만 크게 넣는다.
- 공유 플랫폼은 이미지를 오래 캐시한다. 그림을 바꿨으면 `content.json` 의
  `site.ogImageVersion` 숫자를 올려야 새 이미지가 반영된다.

## 이미지 · PDF 교체

- `assets/`, `files/` 에 파일을 올리고 `content.json` 의 경로만 맞추면 된다.
- **같은 파일명으로 덮어쓰면** 링크는 그대로 유지된다.
- 사진은 가로 1920px, JPG 품질 85 정도면 충분하다 (한 장 300KB 이하 권장).

## 되돌리기

모든 수정이 커밋으로 남는다. 잘못 고쳤으면 GitHub에서 해당 커밋의
**Revert** 를 누르면 이전 상태로 돌아간다.
