# TODAH Design Website

GitHub Pages 테스트용 정적 사이트입니다.

## 업로드 방법

1. GitHub에서 새 저장소를 만듭니다.
   - 추천 이름: `todah-website`
   - Public 저장소 권장
2. 이 폴더의 파일 3개를 저장소 루트에 업로드합니다.
   - `index.html`
   - `.nojekyll`
   - `README.md`
3. GitHub 저장소에서:
   - `Settings`
   - `Pages`
   - `Build and deployment`
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
   - `Save`
4. 잠시 후 아래 형식의 주소가 생깁니다.
   - `https://YOUR_GITHUB_ID.github.io/todah-website/`

## 이번 테스트에서 확인할 것

- 랜딩페이지가 HTTPS에서 정상 표시되는지
- Instagram 실제 게시물 임베드가 로딩되는지
- 모바일 화면이 깨지지 않는지
- 외부 링크가 정상 작동하는지

## Instagram 테스트 게시물

현재 `@teamkodesign`의 아래 게시물을 임베드 테스트 대상으로 사용합니다.

`https://www.instagram.com/teamkodesign/p/CnoNkKmvqdr/`

## 주의

Instagram/Meta/Metricool API 토큰 같은 비밀키는 `index.html` 안에 넣지 마세요.
최종 홈페이지의 최근 Instagram 6개 자동 연동은 서버/API 레이어를 따로 두는 방식으로 구현하는 것이 안전합니다.

## 다음 단계

테스트가 성공하면:
1. `@todah_153` 기준으로 연동 계정 변경
2. 최근 POST + REEL 6개 자동 노출
3. Story 제외
4. 업로드 날짜 표시
5. 클릭 시 Instagram 원 게시물 이동
6. 최근 프로젝트 5개 + Instagram 최근 콘텐츠 자동 갱신
