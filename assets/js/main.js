(function(){
  const root = document.getElementById('heroCarousel');
  if(!root) return;
  const slides = [...root.querySelectorAll('.hero-slide')];
  const dots = [...root.querySelectorAll('.hero-dot')];
  const caption = root.querySelector('.hero-caption');
  let index = 0;
  let timer = null;
  const interval = 4500;

  function update(next){
    slides[index].classList.remove('active');
    dots[index].classList.remove('active');
    index = next;
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    caption.textContent = `RECENT PROJECTS · ${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }

  function start(){
    stop();
    timer = setInterval(() => update((index + 1) % slides.length), interval);
  }

  function stop(){
    if(timer) clearInterval(timer);
  }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
  start();
})();

(function(){
  // TODO: 실제 연락처/카카오톡 채널이 확정되면 해당 요소의 href를 실제 주소로 바꾸고 data-pending 속성을 제거하세요.
  const pending = document.querySelectorAll('[data-pending="contact"]');
  if(!pending.length) return;

  let toastTimer = null;
  function showToast(message){
    let toast = document.querySelector('.toast');
    if(!toast){
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
  }

  pending.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(el.dataset.pendingMsg || '연결 준비 중입니다');
    });
  });
})();

(function(){
  const feed = document.querySelector('[data-journal-feed]');
  if(!feed) return;

  fetch('/api/journal')
    .then((r) => r.ok ? r.json() : Promise.reject(new Error('journal fetch failed')))
    .then((data) => {
      const items = (data.items || []).filter((item) => item.thumbnail).slice(0, 3);
      if(!items.length) return; // API 응답이 비었으면 기존 정적 카드 유지

      feed.innerHTML = '';
      items.forEach((item) => {
        const card = document.createElement('a');
        card.className = 'journal-card';
        card.href = item.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const img = document.createElement('img');
        img.src = '/api/thumb?u=' + encodeURIComponent(item.thumbnail);
        img.alt = item.title;
        img.loading = 'lazy';
        // 로고 배너처럼 가로로 아주 긴 첫 이미지는 4:3 칸에 cover로 자르면 가운데만 남으므로 통째로 보여준다.
        img.addEventListener('load', () => {
          if(img.naturalWidth / img.naturalHeight > 2) img.classList.add('is-wide');
        });
        card.appendChild(img);

        const cat = document.createElement('div');
        cat.className = 'journal-cat';
        cat.textContent = item.category || 'BLOG';
        card.appendChild(cat);

        const title = document.createElement('div');
        title.className = 'journal-title';
        title.textContent = item.title;
        card.appendChild(title);

        const text = document.createElement('div');
        text.className = 'journal-text';
        text.textContent = item.text;
        card.appendChild(text);

        feed.appendChild(card);
      });
    })
    .catch(() => {
      // 네트워크/API 오류 시 기존 정적 카드를 그대로 둔다.
    });
})();

(function(){
  const feed = document.querySelector('[data-instagram-feed]');
  if(!feed) return;

  fetch('/api/instagram')
    .then((r) => r.ok ? r.json() : Promise.reject(new Error('instagram fetch failed')))
    .then((data) => {
      const items = (data.items || []).filter((item) => item.image).slice(0, 6);
      if(!items.length) return; // API 응답이 비었으면 기존 아이콘 링크 유지

      feed.innerHTML = '';
      items.forEach((item) => {
        const card = document.createElement('a');
        card.className = 'insta-post';
        card.href = item.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.caption || 'Instagram post';
        img.loading = 'lazy';
        card.appendChild(img);

        if(item.caption){
          const cap = document.createElement('span');
          cap.textContent = item.caption;
          card.appendChild(cap);
        }

        feed.appendChild(card);
      });
    })
    .catch(() => {
      // 네트워크/API 오류 시 기존 아이콘 링크를 그대로 둔다.
    });
})();

(function(){
  const overlay = document.getElementById('contactModalOverlay');
  if(!overlay) return;

  let formToken = null;
  let formTokenAt = 0;
  async function getToken(force){
    if(!force && formToken && Date.now() - formTokenAt < 20 * 60 * 1000) return formToken;
    const r = await fetch('/api/form-token', { cache: 'no-store' });
    if(!r.ok) throw new Error('폼을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
    formToken = (await r.json()).token;
    formTokenAt = Date.now();
    return formToken;
  }

  function openModal(e){
    if(e) e.preventDefault();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    getToken().catch(() => {});
  }

  function closeModal(){
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-contact-modal]').forEach((el) => {
    el.addEventListener('click', openModal);
  });
  overlay.querySelectorAll('[data-close-contact-modal]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactFormStatus');
  const submitBtn = form.querySelector('.contact-submit');
  const endDateInput = form.endDate;
  const tbdCheckbox = form.endDateTBD;

  tbdCheckbox.addEventListener('change', () => {
    endDateInput.disabled = tbdCheckbox.checked;
    if(tbdCheckbox.checked) endDateInput.value = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if(!form.reportValidity()) return;

    submitBtn.disabled = true;
    status.textContent = '전송 중입니다...';
    status.className = 'contact-form-status';

    try {
      const token = await getToken();
      const files = Array.from(form.photos.files || []);
      let photos = [];

      if(files.length){
        status.textContent = `사진 업로드 중입니다... (0/${files.length})`;
        const { upload } = await import('https://esm.sh/@vercel/blob@0.27.1/client');
        for(let i = 0; i < files.length; i++){
          const blob = await upload(files[i].name, files[i], {
            access: 'public',
            handleUploadUrl: '/api/upload',
            clientPayload: token
          });
          photos.push(blob.url);
          status.textContent = `사진 업로드 중입니다... (${i + 1}/${files.length})`;
        }
      }

      status.textContent = '전송 중입니다...';

      const payload = {
        spaceType: (form.spaceType.value || ''),
        size: form.size.value,
        address: form.address.value.trim(),
        name: form.name.value.trim(),
        contact: form.contact.value.trim(),
        email: form.email.value.trim(),
        budget: form.budget.value,
        scope: (form.scope.value || ''),
        startDate: form.startDate.value,
        endDate: tbdCheckbox.checked ? '' : form.endDate.value,
        endDateTBD: tbdCheckbox.checked,
        content: form.content.value.trim(),
        photos,
        token,
        website: form.website.value
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok){
        if(data.error === 'token'){ formToken = null; throw new Error('접수 시간이 지나 다시 확인이 필요합니다. 한 번 더 눌러주세요.'); }
        throw new Error(data.error || '전송 실패');
      }

      status.textContent = '상담 신청이 접수되었습니다. 빠르게 확인 후 연락드리겠습니다.';
      status.className = 'contact-form-status is-success';
      form.reset();
      setTimeout(closeModal, 1800);
    } catch(err){
      status.textContent = (err && err.message) || '전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      status.className = 'contact-form-status is-error';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();

(function(){
  const links = document.querySelectorAll('[data-mail-template]');
  if(!links.length) return;

  const subject = '[TODAH 153 상담 문의] 성함 / 현장 지역';
  const body = [
    '안녕하세요, TODAH 153에 상담 문의드립니다.',
    '아래 항목을 편하게 채워주세요. 모르는 항목은 비워두셔도 됩니다.',
    '',
    '■ 성함:',
    '■ 연락처:',
    '■ 공간 유형 (주거 / 상업):',
    '■ 평형:',
    '■ 현장 주소 (동까지만 적어주셔도 됩니다):',
    '■ 공사 범위 (전체 / 부분):',
    '■ 예상 예산:',
    '■ 공사 희망 시작일:',
    '■ 공사 마감 희망일 (미정이면 \'미정\'):',
    '■ 원하시는 공사 내용:',
    '',
    '참고하실 현장 사진이나 원하시는 스타일 사진이 있으면 첨부해주세요.',
    '확인 후 빠르게 연락드리겠습니다.'
  ].join('\r\n');

  const href = 'mailto:todahid153@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  links.forEach((a) => { a.href = href; });
})();
