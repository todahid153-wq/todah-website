(function(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  if(!('IntersectionObserver' in window)){
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if(!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
  items.forEach((el) => io.observe(el));
})();

(function(){
  const box = document.querySelector('[data-player]');
  if(!box) return;
  const v = box.querySelector('video');
  const btn = box.querySelector('.pj-play');
  const bar = box.querySelector('.pj-bar');
  const fill = bar.querySelector('i');
  v.controls = false;

  function toggle(){
    if(v.paused || v.ended){
      const p = v.play();
      if(p && p.catch) p.catch(() => {});
    } else {
      v.pause();
    }
  }

  box.addEventListener('click', (e) => {
    if(bar.contains(e.target)) return;
    toggle();
  });
  bar.addEventListener('click', (e) => {
    const r = bar.getBoundingClientRect();
    if(v.duration) v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
  });
  v.addEventListener('play', () => { box.classList.add('is-playing'); btn.setAttribute('aria-label', '영상 일시정지'); });
  v.addEventListener('pause', () => { box.classList.remove('is-playing'); btn.setAttribute('aria-label', '영상 재생'); });
  v.addEventListener('ended', () => { box.classList.remove('is-playing'); btn.setAttribute('aria-label', '영상 다시 재생'); });
  const progress = () => {
    fill.style.width = v.duration ? (v.currentTime / v.duration * 100) + '%' : '0';
  };
  ['timeupdate', 'seeked', 'seeking', 'loadedmetadata'].forEach((ev) => v.addEventListener(ev, progress));
})();
