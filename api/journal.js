// 네이버 블로그 RSS를 서버에서 대신 가져와 JOURNAL 섹션용 JSON으로 변환하는 프록시.
// 브라우저에서 직접 RSS를 fetch하면 CORS로 막히고, 썸네일 이미지는 referrer 체크로 막히기 때문에
// 이 함수가 서버 사이드에서 fetch하고, 프론트에서는 이 API만 호출한다.
const BLOG_ID = 'ceomaker';
const RSS_URL = `https://rss.blog.naver.com/${BLOG_ID}.xml`;

function extract(pattern, text) {
  const match = text.match(pattern);
  return match ? match[1] : '';
}

export default async function handler(req, res) {
  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
    const xml = await response.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 6) {
      const block = match[1];
      const title = extract(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/, block);
      const rawLink = extract(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/, block);
      const pubDate = extract(/<pubDate>([\s\S]*?)<\/pubDate>/, block);
      const category = extract(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/, block);
      const description = extract(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/, block);
      // RSS 기본 썸네일(type=s3)은 365px 정사각 크롭이라 카드에서 흐리고 잘려 보인다.
      // type=w2 는 원본 비율 그대로 743px 폭으로 내려준다.
      const rawThumb = extract(/<img[^>]+src="([^"]+)"/, description);
      const thumbnail = rawThumb ? rawThumb.replace(/\?type=\w+$/, '') + '?type=w2' : null;
      const text = description.replace(/<img[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);

      items.push({
        title,
        link: rawLink.split('?')[0],
        pubDate,
        category,
        thumbnail,
        text
      });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ items: [], error: String(err && err.message || err) });
  }
}
