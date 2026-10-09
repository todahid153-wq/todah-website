// SNS 자동화: Blob에 저장된 게시 대기열(sns/queue.json)에서 예약 시간이 지난 "approved" 항목을 하나 골라
// Instagram에 게시한다. Vercel Cron이 매일 호출한다 (vercel.json 참고).
// 대기열은 로컬 도구(홍보 마케팅팀/SNS자동화/schedule.mjs)가 채운다.
// 필요한 권한: instagram_business_content_publish (IG_ACCESS_TOKEN에 포함되어 있어야 함)
import { list, put } from '@vercel/blob';

const QUEUE_PATH = 'sns/queue.json';
const IG = 'https://graph.instagram.com/v21.0';

async function igPost(path, params) {
  const body = new URLSearchParams({ ...params, access_token: process.env.IG_ACCESS_TOKEN });
  const r = await fetch(`${IG}/${path}`, { method: 'POST', body });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error((data.error && data.error.message) || `IG ${path} ${r.status}`);
  return data;
}

// 컨테이너가 FINISHED 될 때까지 잠깐 기다린다 (이미지는 보통 수 초 안에 끝남).
async function waitReady(containerId) {
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${IG}/${containerId}?fields=status_code&access_token=${process.env.IG_ACCESS_TOKEN}`);
    const data = await r.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error(`container ${containerId} ERROR`);
    await new Promise((res) => setTimeout(res, 2000));
  }
  throw new Error(`container ${containerId} not ready`);
}

async function publish(item) {
  const accountId = process.env.IG_ACCOUNT_ID;
  const images = item.images.slice(0, 10);
  let creationId;

  if (images.length === 1) {
    creationId = (await igPost(`${accountId}/media`, { image_url: images[0], caption: item.caption })).id;
  } else {
    const children = [];
    for (const url of images) {
      children.push((await igPost(`${accountId}/media`, { image_url: url, is_carousel_item: 'true' })).id);
    }
    for (const id of children) await waitReady(id);
    creationId = (await igPost(`${accountId}/media`, {
      media_type: 'CAROUSEL', children: children.join(','), caption: item.caption
    })).id;
  }

  await waitReady(creationId);
  return (await igPost(`${accountId}/media_publish`, { creation_id: creationId })).id;
}

export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { blobs } = await list({ prefix: QUEUE_PATH });
    if (!blobs.length) {
      res.status(200).json({ published: null, reason: 'queue empty' });
      return;
    }
    const queue = await (await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: 'no-store' })).json();

    if (queue.paused) {
      res.status(200).json({ published: null, reason: 'paused' });
      return;
    }

    const now = Date.now();
    const item = queue.items
      .filter((i) => i.status === 'approved' && Date.parse(i.publishAt) <= now)
      .sort((a, b) => Date.parse(a.publishAt) - Date.parse(b.publishAt))[0];

    if (!item) {
      res.status(200).json({ published: null, reason: 'nothing due' });
      return;
    }

    try {
      item.mediaId = await publish(item);
      item.status = 'published';
      item.publishedAt = new Date().toISOString();
    } catch (err) {
      item.status = 'failed';
      item.error = String((err && err.message) || err);
    }

    await put(QUEUE_PATH, JSON.stringify(queue, null, 2), {
      access: 'public', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60
    });

    res.status(item.status === 'published' ? 200 : 500).json({ id: item.id, status: item.status, error: item.error });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
