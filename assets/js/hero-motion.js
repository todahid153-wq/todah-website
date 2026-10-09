(function(){
  const media = document.getElementById('heroCarousel');
  if(!media) return;
  media.addEventListener('mouseleave', () => {
    const dot = media.querySelector('.hero-dot.active');
    if(!dot) return;
    dot.classList.remove('active');
    void dot.offsetWidth;
    dot.classList.add('active');
  });
})();
