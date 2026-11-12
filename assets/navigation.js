export function createNavigation(nav, content, initial, onSelect) {
  const links = [...nav.querySelectorAll('[data-nav]')];
  const indicator = nav.querySelector('#nav-indicator');
  const mobile = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = initial;
  let gesture;
  let suppressClick = false;
  let reaction;

  function position() {
    const link = links.find(item => item.dataset.nav === selected);
    const inset = mobile.matches ? 2 : 0;
    const target = link.getBoundingClientRect();
    const frame = nav.getBoundingClientRect();
    indicator.style.width = target.width - inset * 2 + 'px';
    indicator.style.height = target.height - inset * 2 + 'px';
    indicator.style.transform = `translate3d(${target.left - frame.left + inset}px, ${target.top - frame.top + inset}px, 0)`;
  }

  function finishGesture() {
    gesture = undefined;
    nav.classList.remove('is-dragging');
    content.classList.remove('is-peeking');
    content.style.removeProperty('--peek-x');
    for (const link of links) link.style.removeProperty('--lift');
    position();
  }

  function select(id) {
    const changed = selected !== id;
    selected = id;
    for (const link of links) {
      if (link.dataset.nav === id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    position();
    if (changed && !reduced.matches) {
      reaction?.cancel();
      reaction = nav.querySelector('[aria-current] .nav-glyph svg').animate([
        { transform: 'scale(.88, 1.04) rotate(-7deg)' },
        { transform: 'translateY(-5px) scale(1.14, .97) rotate(8deg)', offset: .38 },
        { transform: 'translateY(1px) scale(.97, 1.03) rotate(-3deg)', offset: .73 },
        { transform: 'none' },
      ], { duration: 460, easing: 'cubic-bezier(.2,.68,.3,1)' });
    }
  }

  nav.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (!mobile.matches || !event.isPrimary || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const frame = nav.getBoundingClientRect();
    const centers = links.map(link => {
      const box = link.getBoundingClientRect();
      return box.left - frame.left + box.width / 2;
    });
    gesture = {
      pointer: event.pointerId, origin: event.clientX, originY: event.clientY, left: frame.left, centers,
      link: event.target.closest('[data-nav]'), preview: links.findIndex(link => link.dataset.nav === selected),
      dragging: false, width: indicator.offsetWidth,
    };
  });

  nav.addEventListener('pointermove', event => {
    if (gesture?.pointer !== event.pointerId) return;
    const delta = event.clientX - gesture.origin;
    if (!gesture.dragging) {
      const vertical = Math.abs(event.clientY - gesture.originY);
      if (vertical > 10 && vertical > Math.abs(delta)) {
        finishGesture();
        return;
      }
      if (Math.abs(delta) < 7) return;
      gesture.dragging = true;
      nav.classList.add('is-dragging');
      nav.setPointerCapture(event.pointerId);
      if (!reduced.matches) content.classList.add('is-peeking');
    }
    const x = event.clientX - gesture.left;
    const first = gesture.centers[0], last = gesture.centers.at(-1);
    const bounded = Math.max(first, Math.min(last, x));
    const edge = Math.max(-9, Math.min(9, (x - bounded) * .2));
    const spacing = gesture.centers[1] - first;
    gesture.preview = Math.max(0, Math.min(links.length - 1, Math.round((bounded - first) / spacing)));
    const stretch = reduced.matches ? 1 : 1 + Math.min(.09, Math.abs(delta) / 1000);
    indicator.style.transform = `translate3d(${bounded + edge - gesture.width / 2}px, 2px, 0) scaleX(${stretch})`;
    links.forEach((link, index) => link.style.setProperty('--lift', Math.max(0, 1 - Math.abs(bounded - gesture.centers[index]) / spacing)));
    if (!reduced.matches) {
      const center = gesture.centers[links.findIndex(link => link.dataset.nav === selected)];
      const pull = Math.max(-24, Math.min(24, (center - bounded) * .18));
      content.style.setProperty('--peek-x', pull + 'px');
    }
  });

  nav.addEventListener('pointerup', event => {
    if (gesture?.pointer !== event.pointerId) return;
    const { dragging, preview, link } = gesture;
    if (dragging) {
      suppressClick = true;
      // Flush the position under the finger before starting the snap transition.
      getComputedStyle(indicator).transform;
      const id = links[preview].dataset.nav;
      if (id !== selected) onSelect(id);
      finishGesture();
    } else {
      finishGesture();
      const end = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-nav]');
      if (event.pointerType === 'touch' && end && end === link && link.dataset.nav !== selected) onSelect(link.dataset.nav);
    }
  });
  nav.addEventListener('pointercancel', event => {
    if (gesture?.pointer === event.pointerId) finishGesture();
  });
  nav.addEventListener('lostpointercapture', event => {
    if (event.target === nav && gesture?.dragging) finishGesture();
  });
  nav.addEventListener('pointerleave', () => { if (gesture && !gesture.dragging) finishGesture(); });
  nav.addEventListener('dragstart', event => { if (mobile.matches) event.preventDefault(); });
  nav.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  new ResizeObserver(() => {
    if (gesture) finishGesture();
    else position();
  }).observe(nav);
  select(initial);
  requestAnimationFrame(() => nav.classList.add('nav-ready'));
  return { select };
}
