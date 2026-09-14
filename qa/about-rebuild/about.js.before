(() => {
  'use strict';

  const statsSection = document.querySelector('.about-stats');
  if (!statsSection) return;

  const statNumbers = [...statsSection.querySelectorAll('[data-count]')];
  if (!statNumbers.length) return;

  const formatStat = (value, numberElement) => {
    const format = numberElement.dataset.format;
    return format === 'dot' ? value.toLocaleString('vi-VN') : String(value);
  };

  const renderStats = (progress) => {
    statNumbers.forEach((numberElement) => {
      const target = Number(numberElement.dataset.count);
      numberElement.textContent = formatStat(Math.round(target * progress), numberElement);
    });
  };

  let hasAnimated = false;
  const animateStats = () => {
    if (hasAnimated) return;
    hasAnimated = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      renderStats(1);
      return;
    }

    const start = performance.now();
    const duration = 1600;
    const easeOut = (value) => 1 - Math.pow(1 - value, 3);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      renderStats(easeOut(progress));
      if (progress < 1) window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    renderStats(1);
    return;
  }

  const statsObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      animateStats();
      statsObserver.disconnect();
    }
  }, { threshold: 0.3 });

  statsObserver.observe(statsSection);
})();
// Keep one visible scrollbar while retaining native wheel, touch and keyboard scrolling.
(() => {
  const scroller = document.querySelector('.qua-trinh-des-scroll');
  const track = document.querySelector('.about-story__scrollbar');
  if (!scroller || !track) return;
  let thumbHeight = 0;
  const update = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    track.hidden = max <= 1;
    thumbHeight = Math.max(32, track.clientHeight * scroller.clientHeight / scroller.scrollHeight);
    track.style.setProperty('--thumb-height', `${thumbHeight}px`);
    track.style.setProperty('--thumb-top', `${max > 0 ? (track.clientHeight - thumbHeight) * scroller.scrollTop / max : 0}px`);
  };
  let dragOffset = null;
  const move = (event) => {
    if (dragOffset === null) return;
    const distance = track.clientHeight - thumbHeight;
    if (distance <= 0) return;
    scroller.scrollTop = (event.clientY - track.getBoundingClientRect().top - dragOffset) / distance * (scroller.scrollHeight - scroller.clientHeight);
  };
  track.addEventListener('pointerdown', (event) => {
    dragOffset = event.target === track.firstElementChild ? event.clientY - track.firstElementChild.getBoundingClientRect().top : thumbHeight / 2;
    track.setPointerCapture(event.pointerId);
    move(event);
  });
  track.addEventListener('pointermove', move);
  track.addEventListener('lostpointercapture', () => { dragOffset = null; });
  scroller.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(scroller);
  document.fonts.ready.then(update);
  update();
})();
