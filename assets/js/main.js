(function(){
  const root = document.getElementById('heroCarousel');
  if(!root) return;
  const slides = [...root.querySelectorAll('.hero-slide')];
  const dots = [...root.querySelectorAll('.hero-dot')];
  const caption = root.querySelector('.hero-caption');
  let index = 0;
  let timer = null;
  const interval = 6200;

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
