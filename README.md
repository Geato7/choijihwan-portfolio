# 최지환 — Game Designer Portfolio

**https://geato7.github.io/choijihwan-portfolio/**

내용(`content.json`)과 화면(`src/template.js`)이 분리돼 있다.
글을 고칠 때 HTML을 건드릴 일은 없다.

```
.
├── content.json                ← ★ 사이트의 모든 글. 수정은 여기만.
├── admin/index.html            ← 웹 편집기 (/admin/)
├── src/
│   ├── template.js             ← content.json -> HTML 변환 (구조를 바꿀 때만)
│   └── styles.css              ← 디자인
├── build.mjs                   ← node build.mjs → index.html 생성
├── index.html                  ← 자동 생성물. 직접 고치지 말 것.
├── assets/                     ← 이미지
├── files/                      ← 포트폴리오 PDF
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

`index.html` 이 다시 만들어진다. 미리 보려면:

```bash
python -m http.server 8000
```

커밋·푸시는 GitHub Desktop에서 버튼으로 하면 된다.
(`index.html` 을 커밋하지 않아도 배포 시 Actions가 다시 만든다.)

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

## 테마 (다크 / 라이트)

우측 상단 버튼으로 전환한다. **기본은 다크**이고, 방문자가 고른 값은 그 브라우저에
기억된다. 색은 [`src/styles.css`](src/styles.css) 맨 위 두 블록에만 정의돼 있다.

- `:root, :root[data-theme="dark"]` — 다크 팔레트
- `:root[data-theme="light"]` — 라이트 팔레트

기본을 시스템 설정(OS의 다크모드 여부)에 맞추고 싶으면 `src/template.js` 의
`<head>` 안 초기화 스크립트에서 저장값이 없을 때 `matchMedia('(prefers-color-scheme: dark)')`
결과를 쓰도록 바꾸면 된다.

## 이미지 · PDF 교체

- `assets/`, `files/` 에 파일을 올리고 `content.json` 의 경로만 맞추면 된다.
- **같은 파일명으로 덮어쓰면** 링크는 그대로 유지된다.
- 사진은 가로 1920px, JPG 품질 85 정도면 충분하다 (한 장 300KB 이하 권장).

## 되돌리기

모든 수정이 커밋으로 남는다. 잘못 고쳤으면 GitHub에서 해당 커밋의
**Revert** 를 누르면 이전 상태로 돌아간다.
