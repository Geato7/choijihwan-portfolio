# 최지환 — Game Designer Portfolio

정적 포트폴리오 사이트. GitHub Pages로 바로 배포된다.

```
.
├── index.html                  ← 사이트 본체 (수정은 이 파일만)
├── assets/belief/              ← BELIEF 스크린샷 4장
├── files/                      ← 다운로드용 포트폴리오 원본(.docx)
├── .nojekyll                   ← Jekyll 빌드 우회 (경로 그대로 서빙)
└── .github/workflows/deploy.yml ← main 푸시 시 자동 배포
```

## 배포

1. GitHub에서 **Public** 저장소를 새로 만든다 (README/`.gitignore` 체크 해제, 빈 저장소로).
2. 이 폴더에서 원격을 연결하고 푸시한다.

   ```bash
   git remote add origin https://github.com/Geato7/choijihwan-portfolio.git
   git push -u origin main
   ```

3. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 선택한다.
   (`deploy.yml`이 이미 있으므로 브랜치 선택은 필요 없다.)
4. Actions 탭에서 워크플로가 초록불이 되면 `https://Geato7.github.io/choijihwan-portfolio/` 로 접속된다.

## 수정 후 재배포

`index.html`을 고치고 커밋 → `git push` 하면 Actions가 자동으로 다시 배포한다.

```bash
git add -A
git commit -m "내용 수정"
git push
```

## 로컬 미리보기

```bash
python -m http.server 8000
```

`http://localhost:8000` 접속. (파일을 더블클릭해 `file://`로 열어도 대부분 동작하지만,
서버로 여는 쪽이 실제 배포 환경과 동일하다.)

## 내용 수정 가이드

- 텍스트/링크: `index.html`의 한글 문구만 고치면 된다. HTML 태그는 그대로 둔다.
- 스크린샷 추가: `assets/` 에 이미지를 넣고 `<img src="...">` 경로를 맞춘다.
- 새 프로젝트 섹션: `<section class="project reveal">` 블록을 통째로 복사해 내용만 바꾼다.
- 폰트는 Google Fonts(Noto Sans KR), 영상은 YouTube 임베드라 인터넷 연결이 필요하다.
