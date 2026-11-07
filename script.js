(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => reducedMotion.matches ? 'auto' : 'smooth';
  const imageStates = new WeakMap();
  const imageObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const state = imageStates.get(entry.target);
      if (state) { state.visible = true; state.reveal(); }
      imageObserver.unobserve(entry.target);
    });
  }, { threshold: .04 }) : null;

  function prepareImage(image) {
    if (reducedMotion.matches || imageStates.has(image)) return;
    image.dataset.reveal = 'waiting';
    const state = {
      visible: !imageObserver,
      loaded: false,
      decoding: false,
      reveal() {
        if (!state.visible || !state.loaded || image.dataset.reveal !== 'waiting') return;
        // Start on the next frame so cached images also visibly come into focus.
        requestAnimationFrame(() => {
          image.dataset.reveal = reducedMotion.matches ? 'ready' : 'revealing';
        });
      },
    };
    imageStates.set(image, state);
    const finish = () => {
      image.dataset.reveal = 'ready';
      imageObserver?.unobserve(image);
    };
    const loaded = async () => {
      if (state.decoding) return;
      state.decoding = true;
      try { if (image.decode) await image.decode(); }
      catch { /* A decoded fallback can still be displayed after a load. */ }
      if (!image.naturalWidth) { finish(); return; }
      state.loaded = true;
      state.reveal();
    };
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', finish, { once: true });
    image.addEventListener('animationend', event => {
      if (event.animationName === 'image-focus') finish();
    });
    imageObserver?.observe(image);
    if (image.complete && image.currentSrc) {
      if (image.naturalWidth) loaded();
      else finish();
    }
  }
  document.querySelectorAll('.media-frame img, .lab-image img, .project-cover img, .project-image img, .stills-grid img').forEach(prepareImage);
  const gallery = document.querySelector('.gallery');
  const stored = {
    read() {
      try { return JSON.parse(sessionStorage.getItem('xiaoyou-gallery') || '{}'); }
      catch { return {}; }
    },
    write(value) {
      try { sessionStorage.setItem('xiaoyou-gallery', JSON.stringify(value)); }
      catch { /* Private browsing and file previews can disable storage. */ }
    },
  };

  if (gallery) {
    const cards = [...gallery.querySelectorAll('.work-card')];
    const filters = [...document.querySelectorAll('[data-filter]')];
    const previous = document.querySelector('.gallery-prev');
    const next = document.querySelector('.gallery-next');
    const count = document.querySelector('.gallery-count');
    const switcher = document.querySelector('.view-switch');
    const hoverTitle = document.querySelector('.hover-title');
    const currentName = document.querySelector('.current-name');
    const currentCode = document.querySelector('.current-code');
    const old = stored.read();
    let filter = filters.some(item => item.dataset.filter === old.filter) ? old.filter : 'all';
    let indexMode = old.indexMode === true;
    let activeIndex = 0;
    let visible = cards;
    let raf = 0;

    function save() {
      stored.write({ filter, indexMode, project: visible[activeIndex]?.dataset.project });
    }

    function updateCurrent() {
      const card = visible[activeIndex];
      if (!card) return;
      const position = String(activeIndex + 1).padStart(2, '0');
      const total = String(visible.length).padStart(2, '0');
      count.replaceChildren(document.createTextNode(position + ' '));
      const totalSpan = document.createElement('span');
      totalSpan.textContent = '/ ' + total;
      count.append(totalSpan);
      const title = card.querySelector('h2').textContent;
      const subtitle = card.querySelector('.project-caption p').textContent;
      currentName.textContent = title + ' / ' + subtitle.split(' · ')[0];
      currentCode.textContent = '[' + card.querySelector('.project-code').textContent.replace(/[\[\]]/g, '') + ']';
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex >= visible.length - 1;
      save();
    }

    function targetLeft(card) {
      const padding = parseFloat(getComputedStyle(gallery).paddingLeft);
      return gallery.scrollLeft + card.getBoundingClientRect().left - gallery.getBoundingClientRect().left - padding;
    }

    function goTo(index, instant = false) {
      if (indexMode || !visible.length) return;
      activeIndex = Math.max(0, Math.min(visible.length - 1, index));
      gallery.scrollTo({ left: targetLeft(visible[activeIndex]), behavior: instant ? 'instant' : behavior() });
      updateCurrent();
    }

    function applyFilter(value, restoreProject) {
      filter = value;
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
      cards.forEach(card => { card.hidden = filter !== 'all' && !card.dataset.categories.split(' ').includes(filter); });
      visible = cards.filter(card => !card.hidden);
      activeIndex = Math.max(0, visible.findIndex(card => card.dataset.project === restoreProject));
      updateCurrent();
      requestAnimationFrame(() => goTo(activeIndex, true));
    }

    function applyView() {
      gallery.classList.toggle('is-index', indexMode);
      document.body.classList.toggle('index-mode', indexMode);
      switcher.setAttribute('aria-pressed', String(indexMode));
      switcher.setAttribute('aria-label', indexMode ? '切换为作品画廊' : '切换为作品索引');
      switcher.querySelector('span').textContent = indexMode ? '画廊' : '索引';
      hoverTitle.classList.remove('is-visible');
      if (indexMode) gallery.scrollLeft = 0;
      else requestAnimationFrame(() => goTo(activeIndex, true));
      save();
    }

    filters.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
    previous.addEventListener('click', () => goTo(activeIndex - 1));
    next.addEventListener('click', () => goTo(activeIndex + 1));
    switcher.addEventListener('click', () => { indexMode = !indexMode; applyView(); });

    gallery.addEventListener('scroll', () => {
      if (raf || indexMode || gallery.classList.contains('is-dragging')) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const start = gallery.getBoundingClientRect().left + parseFloat(getComputedStyle(gallery).paddingLeft);
        let nearest = 0;
        let distance = Infinity;
        visible.forEach((card, index) => {
          const diff = Math.abs(card.getBoundingClientRect().left - start);
          if (diff < distance) { nearest = index; distance = diff; }
        });
        if (nearest !== activeIndex) { activeIndex = nearest; updateCurrent(); }
      });
    }, { passive: true });

    let drag = null;
    let suppressClick = false;
    gallery.querySelectorAll('img').forEach(image => { image.draggable = false; });
    gallery.addEventListener('pointerdown', event => {
      if (indexMode || event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: gallery.scrollLeft, moved: false };
    });
    gallery.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(event.clientY - drag.y)) {
        drag.moved = true;
        gallery.setPointerCapture(event.pointerId);
        gallery.classList.add('is-dragging');
        hoverTitle.classList.remove('is-visible');
      }
      if (drag.moved) {
        event.preventDefault();
        gallery.scrollLeft = drag.scroll - dx;
      }
    });
    function finishDrag(event) {
      if (!drag || event.pointerId !== drag.id) return;
      suppressClick = drag.moved;
      if (gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
      gallery.classList.remove('is-dragging');
      drag = null;
      setTimeout(() => { suppressClick = false; }, 250);
      gallery.dispatchEvent(new Event('scroll'));
    }
    gallery.addEventListener('pointerup', finishDrag);
    gallery.addEventListener('pointercancel', finishDrag);
    gallery.addEventListener('lostpointercapture', event => { if (drag) finishDrag(event); });
    gallery.addEventListener('pointerleave', () => { if (drag && !drag.moved) drag = null; });
    gallery.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    }, true);
    gallery.addEventListener('dragstart', event => event.preventDefault());

    let wheelTime = 0;
    let wheelDistance = 0;
    let wheelTimer;
    gallery.addEventListener('wheel', event => {
      if (indexMode || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const direction = Math.sign(event.deltaY);
      const canMove = direction > 0 ? activeIndex < visible.length - 1 : activeIndex > 0;
      if (!canMove) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientWidth : 1);
      wheelDistance += delta;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelDistance = 0; }, 160);
      if (Math.abs(wheelDistance) > 30 && performance.now() - wheelTime > 380) {
        wheelTime = performance.now();
        wheelDistance = 0;
        goTo(activeIndex + direction);
      }
    }, { passive: false });

    document.addEventListener('keydown', event => {
      if (indexMode || document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target.closest('input, textarea, select, video, [contenteditable="true"]')) return;
      if (!(target === document.body || target === gallery || gallery.contains(target) || target.closest('.gallery-controls'))) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1); }
    });

    function showTitle(card) {
      if (indexMode || drag?.moved || !matchMedia('(hover: hover) and (orientation: landscape) and (min-width: 701px)').matches) return;
      hoverTitle.querySelector('span').textContent = card.querySelector('h2').textContent;
      hoverTitle.querySelector('small').textContent = card.querySelector('.project-caption p').textContent;
      hoverTitle.classList.add('is-visible');
    }
    cards.forEach(card => {
      card.querySelector('.media-frame').addEventListener('mouseenter', () => showTitle(card));
      card.addEventListener('mouseleave', () => hoverTitle.classList.remove('is-visible'));
      card.addEventListener('focusin', () => showTitle(card));
      card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) hoverTitle.classList.remove('is-visible'); });
      card.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
        if (!suppressClick) {
          const index = visible.indexOf(card);
          if (index >= 0) { activeIndex = index; save(); }
        }
      }));
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => goTo(activeIndex, true), 120);
    });
    let hashProject;
    try { hashProject = decodeURIComponent(location.hash.slice(1)); } catch { hashProject = ''; }
    const hasHash = cards.some(card => card.dataset.project === hashProject);
    if (hasHash) filter = 'all';
    applyFilter(filter, hasHash ? hashProject : old.project);
    applyView();
    window.addEventListener('pageshow', () => requestAnimationFrame(() => goTo(activeIndex, true)));
  }

  const about = document.querySelector('#about-dialog');
  const contact = document.querySelector('#contact-dialog');
  const media = document.querySelector('#media-dialog');
  const openers = new WeakMap();

  function openDialog(dialog, trigger) {
    if (!dialog || typeof dialog.showModal !== 'function') return false;
    openers.set(dialog, trigger || document.activeElement);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    return true;
  }
  document.querySelectorAll('[data-open-about]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openDialog(about, link)) event.preventDefault();
  }));
  document.querySelectorAll('[data-open-contact]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openDialog(contact, link)) event.preventDefault();
  }));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      dialog.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
      if (dialog === media) media.querySelector('.media-dialog-body').replaceChildren();
      document.body.classList.toggle('modal-open', Boolean(document.querySelector('dialog[open]')));
      const trigger = openers.get(dialog);
      if (trigger?.isConnected && (!trigger.closest('dialog') || trigger.closest('dialog').open)) trigger.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('[data-lightbox]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof media?.showModal !== 'function') return;
    event.preventDefault();
    const image = document.createElement('img');
    image.alt = link.dataset.caption || link.querySelector('img')?.alt || '作品图像';
    image.addEventListener('load', () => image.classList.toggle('is-tall', image.naturalHeight > image.naturalWidth * 1.6));
    image.src = link.href;
    media.querySelector('.media-dialog-title').textContent = image.alt;
    media.querySelector('.media-dialog-body').replaceChildren(image);
    openDialog(media, link);
    prepareImage(image);
  }));

  document.querySelectorAll('.lab-expand').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.lab-card');
    const expanded = card.dataset.expanded !== 'true';
    card.dataset.expanded = String(expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', (expanded ? '收起：' : '放大：') + card.querySelector('h2').textContent);
    button.querySelector('.lab-zoom-sign').textContent = expanded ? '−' : '＋';
    if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'nearest', behavior: behavior() });
  }));

  const captionEditor = document.querySelector('[data-caption-editor]');
  if (captionEditor) {
    const resetButton = document.querySelector('[data-caption-reset]');
    const storageKey = 'xiaoyou-captions';
    const pageKey = location.pathname;
    const legacyStorageKey = `xiaoyou-captions:${pageKey}`;
    const captions = [...document.querySelectorAll('[data-caption-key]')];
    let editing = false;
    let resetting = false;
    const readAllCaptions = () => {
      try {
        const all = JSON.parse(localStorage.getItem(storageKey) || '{}');
        let migrated = false;
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index);
          if (!key?.startsWith('xiaoyou-captions:')) continue;
          const legacyPage = key.slice('xiaoyou-captions:'.length);
          if (all[legacyPage]) continue;
          const legacy = JSON.parse(localStorage.getItem(key) || '{}');
          if (legacy && typeof legacy === 'object' && Object.keys(legacy).length) {
            all[legacyPage] = legacy;
            migrated = true;
          }
        }
        if (migrated) localStorage.setItem(storageKey, JSON.stringify(all));
        return all;
      } catch { return {}; }
    };
    const readSaved = () => {
      try {
        const all = readAllCaptions();
        if (all[pageKey] && typeof all[pageKey] === 'object') return all[pageKey];
      } catch { /* Storage can be disabled in private/file previews. */ }
      return {};
    };
    const saveCaptions = (force = false) => {
      if (resetting || (!editing && !force)) return;
      const saved = Object.fromEntries(captions.map(item => [item.dataset.captionKey, item.textContent.trim()]));
      try {
        const all = readAllCaptions();
        all[pageKey] = saved;
        localStorage.setItem(storageKey, JSON.stringify(all));
      } catch { /* Keep the current edit visible if storage is unavailable. */ }
    };
    try {
      const saved = readSaved();
      captions.forEach(item => { if (typeof saved[item.dataset.captionKey] === 'string') item.textContent = saved[item.dataset.captionKey]; });
    } catch { /* Storage can be disabled in private/file previews. */ }
    const setEditing = value => {
      editing = value;
      document.body.classList.toggle('caption-editing', editing);
      captions.forEach(item => { item.contentEditable = String(editing); item.spellcheck = editing; });
      captionEditor.textContent = editing ? '保存注释' : '编辑注释';
      if (resetButton) resetButton.hidden = !editing;
      if (editing) captions[0]?.focus();
    };
    captionEditor.addEventListener('click', () => {
      if (!editing) { setEditing(true); return; }
      saveCaptions();
      setEditing(false);
    });
    captions.forEach(item => item.addEventListener('input', saveCaptions));
    window.addEventListener('beforeunload', saveCaptions);
    resetButton?.addEventListener('click', () => {
      resetting = true;
      try {
        const all = readAllCaptions();
        delete all[pageKey];
        localStorage.setItem(storageKey, JSON.stringify(all));
        localStorage.removeItem(legacyStorageKey);
      } catch { /* Ignore unavailable storage. */ }
      location.reload();
    });
  }

  document.querySelectorAll('[data-media-src]').forEach(button => button.addEventListener('click', () => {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.poster = button.dataset.mediaPoster;
    video.src = button.dataset.mediaSrc;
    video.setAttribute('aria-label', button.dataset.mediaName);
    media.querySelector('.media-dialog-title').textContent = button.dataset.mediaName;
    media.querySelector('.media-dialog-body').replaceChildren(video);
    openDialog(media, button);
    video.play().catch(() => { /* Native controls remain available. */ });
  }));

  document.querySelectorAll('.video-start').forEach(button => {
    const video = button.parentElement.querySelector('video');
    video.addEventListener('play', () => { button.hidden = true; });
    video.addEventListener('error', () => { button.hidden = false; button.textContent = '重试播放 ▶'; });
    button.addEventListener('click', async () => {
      button.disabled = true;
      if (!video.getAttribute('src') || video.error) {
        video.src = video.dataset.videoSource;
        video.load();
      }
      try { await video.play(); }
      catch { button.hidden = false; }
      finally { button.disabled = false; }
    });
  });
  if ('IntersectionObserver' in window) {
    const pauseOffscreen = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (!entry.isIntersecting) entry.target.pause(); });
    }, { threshold: 0 });
    document.querySelectorAll('.film-frame video').forEach(video => pauseOffscreen.observe(video));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('video').forEach(video => video.pause());
  });

  document.querySelectorAll('.brief-form').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const text = `项目合作简报 / XIAOYOU\n\n称呼：${String(data.get('name')).trim()}\n联系邮箱：${String(data.get('email')).trim()}\n\n项目想法：\n${String(data.get('idea')).trim()}`;
    const status = form.querySelector('.form-status');
    const fallback = form.querySelector('.brief-fallback');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      status.textContent = '项目简报已复制，可以粘贴到你的沟通工具中。';
      fallback.hidden = true;
    } catch {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      status.textContent = '简报已整理完成，请复制上方文字。';
    }
  }));
})();
