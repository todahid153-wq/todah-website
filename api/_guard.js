// 문의·업로드 API 공용 방어 로직. 파일명이 _로 시작해서 Vercel이 별도 API 경로로 만들지 않는다.
import crypto from 'node:crypto';

const TOKEN_TTL_MS = 30 * 60 * 1000;

function secret() {
  return process.env.FORM_SECRET || '';
}

function sign(ts) {
  return crypto.createHmac('sha256', secret()).update(String(ts)).digest('hex');
}

export function issueToken() {
  const ts = Date.now();
  return `${ts}.${sign(ts)}`;
}

export function verifyToken(token) {
  if (!secret() || typeof token !== 'string') return false;
  const [ts, mac] = token.split('.');
  const age = Date.now() - Number(ts);
  if (!ts || !mac || !(age >= 0 && age <= TOKEN_TTL_MS)) return false;
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(mac);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// 브라우저가 이 사이트에서 보낸 요청인지 확인한다 (다른 사이트·스크립트의 직접 호출 차단).
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      return new URL(origin).host === req.headers.host;
    } catch {
      return false;
    }
  }
  // 브라우저는 같은 사이트로 보내는 GET에는 Origin을 붙이지 않고 Sec-Fetch-Site만 붙인다.
  return req.headers['sec-fetch-site'] === 'same-origin';
}

export const BLOB_URL = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>]+$/i;
