# TODAH 153 Website

TODAH 153 (토다153디자인) 홈페이지 소스입니다. Vercel에 배포되며 `main` 브랜치에 올리면 운영 사이트에 자동 배포됩니다.

- `index.html`, `assets/` — 정적 페이지 (HTML/CSS/JS)
- `api/` — Vercel 서버리스 함수 (문의 접수, 사진 업로드, 인스타·블로그 피드, 크론)
- `vercel.json` — 크론 일정

비밀값(API 키·토큰)은 소스에 넣지 않고 Vercel 환경변수에만 보관합니다.
