// Instagram 장기 액세스 토큰(60일 유효)을 매일 갱신하고 Vercel 환경변수에 반영한다.
// Vercel Cron이 매일 이 엔드포인트를 호출한다 (vercel.json의 crons 설정 참고).
// Instagram 정책상 발급 후 24시간이 지난 토큰만 갱신 가능하므로 매일 호출해도 안전하다.
const PROJECT_ID = 'prj_C18r42RwHQq0t0pV9JU9L1L3iU69';
const TEAM_ID = 'team_ffD2E99fI4dAkIcXUy5iNYw4';

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const currentToken = process.env.IG_ACCESS_TOKEN;
  const vercelToken = process.env.VERCEL_API_TOKEN;

  if (!currentToken || !vercelToken) {
    res.status(500).json({ error: 'IG_ACCESS_TOKEN or VERCEL_API_TOKEN not configured' });
    return;
  }

  try {
    const refreshRes = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
    );
    const refreshData = await refreshRes.json();

    if (!refreshRes.ok) {
      throw new Error((refreshData.error && refreshData.error.message) || 'Instagram token refresh failed');
    }

    const newToken = refreshData.access_token;

    const envListRes = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );
    const envList = await envListRes.json();
    const igEnvVar = (envList.envs || []).find(
      (e) => e.key === 'IG_ACCESS_TOKEN' && e.target.includes('production')
    );

    if (!igEnvVar) {
      throw new Error('IG_ACCESS_TOKEN environment variable not found on Vercel project');
    }

    const updateRes = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${igEnvVar.id}?teamId=${TEAM_ID}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: newToken })
      }
    );

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      throw new Error((errData.error && errData.error.message) || 'Failed to update Vercel env var');
    }

    // 환경변수 반영을 위해 재배포를 트리거한다 (설정된 경우).
    if (process.env.VERCEL_DEPLOY_HOOK_URL) {
      await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
    }

    res.status(200).json({
      success: true,
      expiresInDays: Math.round(refreshData.expires_in / 86400)
    });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
