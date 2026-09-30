const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Loading screen ----------
const loader = document.querySelector('.loader');

window.addEventListener('load', () => {
  window.setTimeout(() => {
    loader?.classList.add('is-hidden');
  }, prefersReducedMotion ? 0 : 900);
});

// ---------- Hero letter reveal ----------
document.querySelectorAll('[data-reveal-text]').forEach((element) => {
  const text = element.dataset.revealText || element.textContent || '';
  element.textContent = '';

  [...text].forEach((character, index) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.style.setProperty('--i', index);
    span.textContent = character === ' ' ? '\u00A0' : character;
    element.appendChild(span);
  });
});

// ---------- Mobile menu ----------
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileNav?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileNav?.classList.toggle('is-open', !open);
  document.body.classList.toggle('menu-open', !open);
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 820) closeMenu();
});


// ---------- Local MP4 preview system ----------
const cards = [...document.querySelectorAll('.project-card[data-video-src]')];
let activeCard = null;
const dwellTimers = new WeakMap();

function createLocalVideo(src, title) {
  const video = document.createElement('video');
  video.src = src;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.controls = false;
  video.disablePictureInPicture = true;
  video.tabIndex = -1;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('controlsList', 'nodownload noplaybackrate nofullscreen');
  video.setAttribute('disableRemotePlayback', '');
  video.title = `${title || 'Project'} video preview`;
  return video;
}

function stopPreview(card) {
  if (!card) return;

  const timer = dwellTimers.get(card);
  if (timer) {
    clearTimeout(timer);
    dwellTimers.delete(card);
  }

  const media = card.querySelector('.project-media');
  const layer = card.querySelector('.video-layer');
  const video = layer?.querySelector('video');

  video?.pause();
  media?.classList.remove('is-playing');
  layer?.classList.remove('is-active');
  layer?.setAttribute('aria-hidden', 'true');

  if (layer) {
    window.setTimeout(() => {
      if (!layer.classList.contains('is-active')) layer.replaceChildren();
    }, 180);
  }

  if (activeCard === card) activeCard = null;
}

function startPreview(card) {
  if (!card || prefersReducedMotion) return;
  if (activeCard === card) return;

  if (activeCard) stopPreview(activeCard);

  const videoSrc = card.dataset.videoSrc;
  const layer = card.querySelector('.video-layer');
  const media = card.querySelector('.project-media');
  const title = card.querySelector('h3')?.textContent?.trim();

  if (!videoSrc || !layer || !media) return;

  const video = createLocalVideo(videoSrc, title);
  layer.replaceChildren(video);
  layer.classList.add('is-active');
  layer.setAttribute('aria-hidden', 'false');
  media.classList.add('is-playing');
  activeCard = card;

  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function queuePreview(card, delay = 550) {
  const oldTimer = dwellTimers.get(card);
  if (oldTimer) clearTimeout(oldTimer);

  const timer = window.setTimeout(() => {
    startPreview(card);
    dwellTimers.delete(card);
  }, delay);

  dwellTimers.set(card, timer);
}

cards.forEach((card) => {
  const media = card.querySelector('.project-media');
  if (!media) return;

  if (canHover) {
    media.addEventListener('mouseenter', () => startPreview(card));
    media.addEventListener('mouseleave', () => stopPreview(card));
  }

  media.addEventListener('focus', () => startPreview(card));
  media.addEventListener('blur', () => stopPreview(card));
});

if (!canHover && !prefersReducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const card = entry.target;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.68) {
        queuePreview(card, 550);
      } else {
        stopPreview(card);
      }
    });
  }, {
    root: null,
    rootMargin: '-7% 0px -7% 0px',
    threshold: [0.25, 0.5, 0.68, 0.82]
  });

  cards.forEach((card) => observer.observe(card));
}

// ---------- Footer year ----------
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// ---------- Sonara project-page placeholder ----------
const sonaraModal = document.querySelector('#sonara-coming-soon');
const sonaraCard = document.querySelector('[data-project-coming-soon="sonara"]');
const sonaraOpeners = [
  sonaraCard?.querySelector('.project-media'),
  sonaraCard?.querySelector('.project-coming-soon-link')
].filter(Boolean);

function openSonaraModal(event) {
  event?.preventDefault();
  if (!sonaraModal) return;
  if (typeof sonaraModal.showModal === 'function') {
    sonaraModal.showModal();
  } else {
    sonaraModal.setAttribute('open', '');
  }
}

function closeSonaraModal() {
  if (!sonaraModal) return;
  if (typeof sonaraModal.close === 'function') {
    sonaraModal.close();
  } else {
    sonaraModal.removeAttribute('open');
  }
}

sonaraOpeners.forEach((opener) => opener.addEventListener('click', openSonaraModal));
sonaraModal?.querySelector('.project-modal-close')?.addEventListener('click', closeSonaraModal);
sonaraModal?.querySelector('.project-modal-button')?.addEventListener('click', closeSonaraModal);
sonaraModal?.addEventListener('click', (event) => {
  if (event.target === sonaraModal) closeSonaraModal();
});


// ---------- Release button focus after touch ----------
document.querySelectorAll('.button, .project-site-link').forEach((control) => {
  control.addEventListener('touchend', () => {
    window.setTimeout(() => control.blur(), 80);
  }, { passive: true });
});


// ---------- Cross-browser interaction normalization ----------
document.addEventListener('pointerup', (event) => {
  if (event.pointerType === 'mouse') return;
  const control = event.target.closest?.('.button, .project-site-link');
  if (!control) return;
  window.setTimeout(() => control.blur(), 40);
}, { passive: true });

document.addEventListener('pointercancel', (event) => {
  const control = event.target.closest?.('.button, .project-site-link');
  control?.blur();
}, { passive: true });

window.addEventListener('pageshow', () => {
  if (window.innerWidth > 820) closeMenu();
  document.activeElement?.matches?.('.button, .project-site-link') && document.activeElement.blur();
});

// ---------- Landscape-phone smart header ----------
(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastY = Math.max(0, window.scrollY || window.pageYOffset || 0);
  let directionStartY = lastY;
  let lastDirection = 0;
  let ticking = false;

  const viewportHeight = () => window.visualViewport?.height || window.innerHeight;
  const viewportWidth = () => window.visualViewport?.width || window.innerWidth;

  const isShortLandscapePhone = () => {
    const w = viewportWidth();
    const h = viewportHeight();
    const touchCapable = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    return touchCapable && w > h && h <= 650;
  };

  const syncMode = () => {
    const active = isShortLandscapePhone();
    root.classList.toggle('is-short-landscape-phone', active);

    if (active) {
      const headerHeight = Math.ceil(header.getBoundingClientRect().height || 76);
      root.style.setProperty('--landscape-header-space', `${headerHeight}px`);
    } else {
      root.style.removeProperty('--landscape-header-space');
      header.classList.remove('is-scroll-hidden');
    }

    lastY = Math.max(0, window.scrollY || window.pageYOffset || 0);
    directionStartY = lastY;
    lastDirection = 0;
  };

  const showHeader = () => header.classList.remove('is-scroll-hidden');
  const hideHeader = () => {
    if (!document.body.classList.contains('menu-open')) {
      header.classList.add('is-scroll-hidden');
    }
  };

  const update = () => {
    ticking = false;
    if (!root.classList.contains('is-short-landscape-phone')) return;

    const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
    const delta = y - lastY;

    if (Math.abs(delta) < 1) return;

    const direction = delta > 0 ? 1 : -1;
    if (direction !== lastDirection) {
      directionStartY = lastY;
      lastDirection = direction;
    }

    const travel = Math.abs(y - directionStartY);

    if (y <= 12 || document.body.classList.contains('menu-open')) {
      showHeader();
    } else if (direction < 0 && travel >= 4) {
      showHeader();
    } else if (direction > 0 && y > 72 && travel >= 14) {
      hideHeader();
    }

    lastY = y;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  window.addEventListener('resize', syncMode, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(syncMode, 100);
  }, { passive: true });
  window.visualViewport?.addEventListener('resize', syncMode, { passive: true });

  menuButton?.addEventListener('click', showHeader);
  mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', showHeader));

  syncMode();
})();
