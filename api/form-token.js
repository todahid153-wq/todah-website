// 문의 폼을 열 때 받아가는 30분짜리 서명 토큰. 폼 제출·사진 업로드 때 함께 보내야 통과한다.
import { issueToken, sameOrigin } from './_guard.js';

export default function handler(req, res) {
  if (req.method !== 'GET' || !sameOrigin(req)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ token: issueToken() });
}
