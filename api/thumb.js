// 네이버 블로그 썸네일 프록시.
// 브라우저가 blogthumb.pstatic.net 이미지를 직접 요청하면 브라우저·환경에 따라 핫링크 차단으로
// 빈 칸이 뜨는 경우가 있어, 서버에서 받아 같은 도메인으로 내려준다.
// 아무 URL이나 대신 받아주는 열린 프록시가 되지 않도록 네이버 이미지 호스트만 허용한다.
const ALLOWED_HOSTS = /(^|\.)pstatic\.net$/;

export default async function handler(req, res) {
  let target;
  try {
    target = new URL(String(req.query.u || ''));
  } catch {
    res.status(400).end('bad url');
    return;
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.test(target.hostname)) {
    res.status(403).end('host not allowed');
    return;
  }

  try {
    const upstream = await fetch(target, { headers: { Referer: 'https://blog.naver.com/' } });
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !type.startsWith('image/')) {
      res.status(502).end('upstream error');
      return;
    }
    const body = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(body);
  } catch {
    res.status(502).end('upstream error');
  }
}
