// 홈페이지 상담 신청 폼 제출을 받아 Resend로 이메일 알림을 보낸다.
// 액세스 토큰은 Vercel 환경변수(RESEND_API_KEY)에만 저장되어 있고, 클라이언트에는 노출되지 않는다.
import { BLOB_URL, sameOrigin, verifyToken } from './_guard.js';

const NOTIFY_TO = 'todahid153@gmail.com';

const FIELDS = [
  ['spaceType', '공간 유형'],
  ['size', '평형'],
  ['address', '현장 주소'],
  ['name', '이름'],
  ['contact', '연락처'],
  ['email', '이메일'],
  ['budget', '예산'],
  ['scope', '공사 범위'],
  ['startDate', '공사 예정일'],
  ['endDate', '공사 마감일'],
  ['content', '공사 내용'],
  ['source', '알게 된 경로']
];

const MAX_LEN = { spaceType: 20, size: 10, address: 200, name: 60, contact: 60, email: 120, budget: 15, scope: 20, startDate: 10, endDate: 10, content: 3000, source: 20 };
const SOURCES = new Set(['인스타그램', '네이버 블로그', '유튜브', '검색(네이버·구글)', '지인 소개', '기타']);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (res, code, error) => res.status(code).json({ error });

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  if (!sameOrigin(req)) return fail(res, 403, '잘못된 요청입니다.');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return fail(res, 500, '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // 사람 눈에 보이지 않는 칸에 값이 들어왔으면 봇이다. 알리지 않고 성공처럼 응답만 한다.
  if (body.website) return res.status(200).json({ success: true });

  if (!verifyToken(body.token)) return fail(res, 403, 'token');

  const clean = {};
  for (const [key] of FIELDS) {
    const v = body[key];
    if (v == null || v === '') { clean[key] = ''; continue; }
    if (typeof v !== 'string' && typeof v !== 'number') return fail(res, 400, '입력값이 올바르지 않습니다.');
    const s = String(v).replace(/[\r\n]+/g, key === 'content' ? '\n' : ' ').trim();
    if (s.length > MAX_LEN[key]) return fail(res, 400, '입력값이 너무 깁니다.');
    clean[key] = s;
  }

  if (!clean.name || !clean.contact || !clean.email || !clean.address || !clean.content) {
    return fail(res, 400, '필수 항목을 모두 입력해주세요.');
  }
  if (!EMAIL.test(clean.email)) return fail(res, 400, '이메일 형식을 확인해주세요.');
  if (clean.contact.replace(/\D/g, '').length < 8) return fail(res, 400, '연락처를 확인해주세요.');
  if (clean.source && !SOURCES.has(clean.source)) return fail(res, 400, '입력값이 올바르지 않습니다.');
  if (clean.size && !/^\d+(\.\d+)?$/.test(clean.size)) return fail(res, 400, '평형은 숫자로 입력해주세요.');
  if (clean.budget && !/^\d+$/.test(clean.budget)) return fail(res, 400, '예산은 숫자로 입력해주세요.');
  for (const k of ['startDate', 'endDate']) {
    if (clean[k] && !DATE.test(clean[k])) return fail(res, 400, '날짜 형식을 확인해주세요.');
  }

  const { photos } = body;
  if (photos != null && (!Array.isArray(photos) || photos.length > 10 || photos.some((p) => typeof p !== 'string' || !BLOB_URL.test(p)))) {
    return fail(res, 400, '잘못된 사진 데이터입니다.');
  }

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const rows = FIELDS.map(([key, label]) => {
    let value = clean[key];
    if (key === 'endDate' && body.endDateTBD === true) value = '미정';
    if (key === 'size' && value) value = `${value}평`;
    if (key === 'budget' && value) value = `${Number(value).toLocaleString('ko-KR')}원`;
    if (!value) return '';
    return `<p><strong>${label}:</strong> ${escapeHtml(value).replace(/\n/g, '<br>')}</p>`;
  }).join('');

  const photosHtml = photos && photos.length
    ? `<p><strong>참고 사진:</strong></p>` + photos.map((url) =>
        `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></p>`
      ).join('')
    : '';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TODAH 153 웹사이트 <onboarding@resend.dev>',
        to: [NOTIFY_TO],
        reply_to: clean.email,
        subject: `[홈페이지 상담 신청] ${clean.name}님`,
        html: `<h2>새 상담 신청이 접수되었습니다</h2>${rows}${photosHtml}`
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Resend API error: ${response.status}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('contact form send failed:', err);
    fail(res, 500, '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}
