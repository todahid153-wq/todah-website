// Instagram Graph API를 서버에서 대신 호출해 최신 게시물을 JSON으로 반환하는 프록시.
// 액세스 토큰은 Vercel 환경변수(IG_ACCESS_TOKEN, IG_ACCOUNT_ID)에만 저장되어 있고,
// 클라이언트/소스코드에는 절대 노출되지 않는다.
export default async function handler(req, res) {
  const token = process.env.IG_ACCESS_TOKEN;
  const accountId = process.env.IG_ACCOUNT_ID;

  if (!token || !accountId) {
    res.status(500).json({ items: [], error: 'IG_ACCESS_TOKEN or IG_ACCOUNT_ID not configured' });
    return;
  }

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.instagram.com/v21.0/${accountId}/media?fields=${fields}&limit=6&access_token=${token}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error((data && data.error && data.error.message) || `Instagram API error: ${response.status}`);
    }

    const items = (data.data || []).map((post) => ({
      id: post.id,
      link: post.permalink,
      timestamp: post.timestamp,
      caption: (post.caption || '').slice(0, 90),
      mediaType: post.media_type,
      // 비디오/릴스는 media_url이 영상이라 썸네일은 thumbnail_url을 우선 사용
      image: post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url
    }));

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ items: [], error: String(err && err.message || err) });
  }
}
