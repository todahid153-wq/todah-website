// 참고 사진 업로드용 Vercel Blob 클라이언트 업로드 토큰 발급.
// 브라우저가 이 API를 거쳐 발급받은 토큰으로 Blob 스토리지에 직접 업로드한다 (서버리스 함수 용량 제한 우회).
// 폼 토큰이 없거나 다른 사이트에서 온 요청에는 업로드 토큰을 내주지 않는다.
import { handleUpload } from '@vercel/blob/client';
import { sameOrigin, verifyToken } from './_guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  // 업로드 완료 알림은 Blob 서버가 보내는 요청이라 handleUpload가 서명을 직접 검증한다.
  if (body.type === 'blob.generate-client-token' && !sameOrigin(req)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!verifyToken(clientPayload)) throw new Error('invalid form token');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000
        };
      },
      onUploadCompleted: async () => {}
    });

    res.status(200).json(jsonResponse);
  } catch (err) {
    res.status(400).json({ error: String((err && err.message) || err) });
  }
}
