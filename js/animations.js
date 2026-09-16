(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || typeof window.gsap === 'undefined') {
    return; // Content is fully visible/functional via CSS alone — nothing to fix up.
  }

  const gsap = window.gsap;
  const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // One-shot fade+rise — reserved for genuinely minor moments only (section
  // eyebrows/heads). Every major section below gets its own distinct,
  // Level-2 signature interaction instead of this.
  const revealFrom = (targets, vars = {}) => {
    const els = gsap.utils.toArray(targets);
    els.forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 28,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: hasScrollTrigger
          ? { trigger: el, start: 'top 85%', once: true }
          : undefined,
        ...vars,
      });
    });
  };

  const revealStagger = (container, itemSelector, vars = {}) => {
    const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
    if (!containerEl) return;
    const items = containerEl.querySelectorAll(itemSelector);
    if (!items.length) return;
    gsap.from(items, {
      opacity: 0,
      y: 28,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: hasScrollTrigger
        ? { trigger: containerEl, start: 'top 85%', once: true }
        : undefined,
      ...vars,
    });
  };

  // =========================================================
  // HERO — pin + scale/fade + bg zoom, with independent-speed
  // parallax between the eyebrow and the headline.
  // =========================================================
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero-eyebrow', { opacity: 0, y: 16, duration: 0.6 })
    .from('.hero-word', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.25')
    .from('.hero-sub', { opacity: 0, y: 16, duration: 0.7 }, '-=0.35')
    .from('.hero-actions', { opacity: 0, y: 16, duration: 0.7 }, '-=0.45');

  if (hasScrollTrigger) {
    gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '+=100%',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
      },
    })
      .to('.hero-bg-img', { scale: 1.28, y: 30, ease: 'none' }, 0)
      .to('.hero-pin-fade', { opacity: 0.65, ease: 'none' }, 0)
      .to('.hero-inner', { scale: 0.82, opacity: 0, y: -30, ease: 'none' }, 0)
      .to('.hero-eyebrow', { y: -40, ease: 'none' }, 0); // moves faster than the rest of .hero-inner

    // ---------- Nav scrolled state ----------
    ScrollTrigger.create({
      start: 'top -80',
      onUpdate: (self) => {
        document.getElementById('nav').classList.toggle('nav--scrolled', self.scroll() > 80);
      },
    });

    // ---------- Nav active-section indicator ----------
    const navLinkEls = document.querySelectorAll('.nav-links a');
    const setActiveLink = (id) => {
      navLinkEls.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    };
    document.querySelectorAll('main > section[id]').forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveLink(section.id),
        onEnterBack: () => setActiveLink(section.id),
      });
    });

    // =========================================================
    // SPONSOR — signature scene. One long pinned, scroll-scrubbed
    // timeline staged by progress, so it can't be skipped in one
    // scroll gesture: eyebrow -> logo resolves from oversized/off-
    // frame -> name+tagline -> CTA -> scene transitions out.
    // =========================================================
    gsap.timeline({
      scrollTrigger: {
        trigger: '.sponsor',
        start: 'top top',
        end: '+=180%',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
      },
    })
      .fromTo('[data-sponsor="1"]', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.15, ease: 'none' }, 0)
      .fromTo(
        '.sponsor-logo-wrap',
        { scale: 2.3, xPercent: -22, filter: 'blur(22px)', opacity: 0.5 },
        { scale: 1, xPercent: 0, filter: 'blur(0px)', opacity: 1, duration: 0.35, ease: 'none' },
        0.15
      )
      .fromTo(
        '[data-sponsor="3"]',
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.22, ease: 'none', stagger: 0.05 },
        0.48
      )
      .fromTo(
        '[data-sponsor="3b"]',
        { opacity: 0, y: 16, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.14, ease: 'none' },
        0.66
      )
      .fromTo('[data-sponsor="4"]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.16, ease: 'none' }, 0.78)
      .to('.sponsor-inner', { scale: 1.05, opacity: 0.8, duration: 0.08, ease: 'none' }, 0.92);

    // =========================================================
    // ABOUT — Level 2, one signature interaction: a gentle
    // continuous parallax on the photo (scale + drift, no pin)
    // plus one clean staggered entrance for the copy. Layout is
    // correct and complete in plain CSS with this fully removed.
    // =========================================================
    ScrollTrigger.matchMedia({
      '(min-width: 981px)': function () {
        const photoTween = gsap.fromTo(
          '.about-photo',
          { scale: 1, y: -20 },
          {
            scale: 1.06,
            y: 20,
            ease: 'none',
            scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
          }
        );
        return () => photoTween.scrollTrigger && photoTween.scrollTrigger.kill();
      },
    });
    revealStagger('.about-copy', '.about-step', { stagger: 0.12 });

    // =========================================================
    // TRAINING APPROACH — pinned word-cycle through the site's
    // real tagline (TRAIN. / FUEL. / TRANSFORM.), tied to progress.
    // Base CSS shows all three words stacked/visible; only switch
    // to the clip-path wipe once the timeline is actually set up.
    // (The single page-flow path, built further down, passes
    // through this section too — no local arrow here.)
    // =========================================================
    const approachStage = document.querySelector('.approach-word-stage');
    if (approachStage) approachStage.classList.add('is-enhanced');

    gsap.timeline({
      scrollTrigger: {
        trigger: '.approach',
        start: 'top top',
        end: '+=120%',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
      },
    })
      .set('.approach-word[data-word="1"]', { clipPath: 'inset(0 0% 0 0)' })
      .to('.approach-word[data-word="1"]', { clipPath: 'inset(0 100% 0 0)', scale: 0.92, duration: 0.28, ease: 'none' }, 0.28)
      .fromTo(
        '.approach-word[data-word="2"]',
        { clipPath: 'inset(0 0 0 100%)', scale: 1.06 },
        { clipPath: 'inset(0 0 0 0%)', scale: 1, duration: 0.28, ease: 'none' },
        0.28
      )
      .to('.approach-word[data-word="2"]', { clipPath: 'inset(0 100% 0 0)', scale: 0.92, duration: 0.28, ease: 'none' }, 0.62)
      .fromTo(
        '.approach-word[data-word="3"]',
        { clipPath: 'inset(0 0 0 100%)', scale: 1.06 },
        { clipPath: 'inset(0 0 0 0%)', scale: 1, duration: 0.28, ease: 'none' },
        0.62
      );

    // =========================================================
    // SERVICES — horizontal pin (desktop) with a "focus" effect:
    // the centered panel sits at full scale/opacity, neighbours
    // recede, so it reads as moving through scenes rather than
    // one flat pan. Mobile: same 3 real panels, stacked + staggered
    // in instead, no horizontal pin. (The single page-flow path
    // passes through this section too — no local arrow here.)
    // =========================================================
    ScrollTrigger.matchMedia({
      '(min-width: 900px)': function () {
        const viewport = document.querySelector('.services-viewport');
        const track = document.querySelector('.services-track');
        if (!viewport || !track) return () => {};
        const panels = gsap.utils.toArray('.service-panel');

        const st = gsap.to(track, {
          x: () => -(track.scrollWidth - viewport.clientWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: '.services',
            start: 'top top',
            end: () => '+=' + (track.scrollWidth - viewport.clientWidth),
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const centerIndex = self.progress * (panels.length - 1);
              panels.forEach((panel, i) => {
                const dist = Math.min(Math.abs(i - centerIndex), 1);
                gsap.set(panel, { scale: 1 - dist * 0.14, opacity: 1 - dist * 0.55 });
                const desc = panel.querySelector('.service-panel-desc');
                if (desc) gsap.set(desc, { opacity: 1 - dist * 0.85 });
              });
            },
          },
        });

        return () => st.scrollTrigger && st.scrollTrigger.kill();
      },
      '(max-width: 899px)': function () {
        revealStagger('.services-track', '.service-panel', { stagger: 0.12 });
      },
    });

    // =========================================================
    // PACKAGES & MEAL PLANS — Level 2, one signature sequence each:
    // headline reveals, then the real photo scales in, then the
    // copy (status/CTA) follows. Reading-focused, so no pinning,
    // no flying text — just one clean, ordered entrance.
    // =========================================================
    document.querySelectorAll('.editorial').forEach((section) => {
      const heading = section.querySelector('.editorial-heading');
      const photo = section.querySelector('.editorial-photo');
      const copyBits = section.querySelectorAll('.editorial-copy > .eyebrow, .editorial-copy > .editorial-lead, .editorial-copy > .editorial-status, .editorial-copy > .btn');

      gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 75%', once: true },
        defaults: { ease: 'power3.out', duration: 0.8 },
      })
        .from(heading, { opacity: 0, y: 26 })
        .from(photo, { opacity: 0, scale: 0.94 }, '-=0.55')
        .from(copyBits, { opacity: 0, y: 18, stagger: 0.08 }, '-=0.5');
    });

    revealFrom('.services-head');

    // =========================================================
    // CONTACT — closing-scene treatment: heading halves converge
    // in from opposite sides instead of a plain fade.
    // =========================================================
    gsap.timeline({
      scrollTrigger: { trigger: '.contact', start: 'top 75%', once: true },
      defaults: { ease: 'power3.out', duration: 0.9 },
    })
      .from('.contact .eyebrow', { opacity: 0, y: 16 })
      .from('.contact-heading-half:nth-child(1)', { opacity: 0, x: -70 }, '<')
      .from('.contact-heading-half:nth-child(2)', { opacity: 0, x: 70 }, '<')
      .from('.contact .section-sub', { opacity: 0, y: 12 }, '-=0.5');
    revealStagger('.contact-grid', '.contact-item', { stagger: 0.07 });

    // =========================================================
    // PAGE FLOW — the ONE continuous snake path + arrowhead for
    // the entire site. There is exactly one <svg>/<path>/arrow
    // (#pageFlow in index.html); no section creates its own.
    //
    // Built by measuring each major section's real absolute
    // document position and threading a single hand-varied path
    // through those points (varied "mood" per stretch — sweeping
    // curve / tight bend / long straight / S / loop — so it reads
    // as composed rather than a regular repeating template).
    //
    // This runs LAST, after every pin above (hero/sponsor/approach/
    // services) has already registered, so their spacer elements
    // already correctly inflate the document — GSAP's refresh cycle
    // temporarily un-pins everything to measure true flow position,
    // which is exactly when this rebuilds too (via onRefresh).
    //
    // A single ScrollTrigger spanning the whole document drives
    // both the path's draw-in (stroke-dashoffset) and the arrow's
    // position/rotation via native SVGPathElement.getPointAtLength()
    // — one listener, no GSAP plugin needed for this part.
    // =========================================================
    (function setupPageFlow() {
      const flow = document.getElementById('pageFlow');
      const svg = document.getElementById('pageFlowSvg');
      const path = document.getElementById('pageFlowPath');
      const arrow = document.getElementById('pageFlowArrow');
      const maskEl = document.getElementById('pageFlowMask');
      const maskBase = document.getElementById('pageFlowMaskBase');
      const maskContent = document.getElementById('pageFlowMaskContent');
      if (!flow || !svg || !path || !arrow) return;

      // Real content the line should recede behind — headings, body copy,
      // buttons, discrete photos/cards — queried fresh at every build so
      // it stays correct if text wraps or a section's height changes.
      // Deliberately NOT a generic "img" match: the hero's full-bleed
      // background photo fills nearly the whole section, and masking that
      // would fade the line for an entire section, which is exactly what
      // was asked not to happen — only bounded content images qualify.
      const CONTENT_SELECTOR = 'h1, h2, h3, p, .btn, .about-tag, .approach-word, .contact-item, .about-photo, .editorial-photo, .sponsor-logo-lg, .meal-gallery img';
      const SVG_NS = 'http://www.w3.org/2000/svg';

      const SECTION_IDS = ['home', 'sponsor', 'about', 'approach', 'services', 'packages', 'meal-plans', 'contact'];
      // Hand-varied character per section-to-section stretch.
      const MOODS = [
        { amp: 0.24, type: 'sweep' },   // home -> sponsor
        { amp: 0.09, type: 'straight' }, // sponsor -> about
        { amp: 0.27, type: 's' },        // about -> approach
        { amp: 0.15, type: 'tight' },    // approach -> services
        { amp: 0.30, type: 'sweep' },    // services -> packages
        { amp: 0.20, type: 's' },        // packages -> meal-plans
        { amp: 0.13, type: 'loop' },     // meal-plans -> contact
      ];

      const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
      let totalLen = 0;
      // Parallel arrays: anchorYs[i] is the real document-Y of anchor i;
      // cumLens[i] is how far along the drawn path (in arc-length) that
      // same anchor sits. Built once per layout, used every scroll frame
      // to convert "the document position the user is currently viewing"
      // into the correct arc-length — NOT a uniform fraction of total
      // path length, which would be wrong here since the sponsor swirl
      // and the services wave deliberately add extra arc-length that
      // doesn't correspond to extra page height.
      let anchorYs = [];
      let cumLens = [];

      function buildSegment(cx, cy, ex, ey, mood) {
        const dy = ey - cy;
        switch (mood.type) {
          case 'straight':
            return `C ${cx.toFixed(1)} ${(cy + dy * 0.3).toFixed(1)}, ${ex.toFixed(1)} ${(cy + dy * 0.7).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
          case 'tight':
            return `C ${cx.toFixed(1)} ${(cy + dy * 0.12).toFixed(1)}, ${ex.toFixed(1)} ${(cy + dy * 0.22).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
          case 'loop':
            return `C ${(cx + (ex - cx) * 1.5).toFixed(1)} ${(cy + dy * 0.22).toFixed(1)}, ${(cx - (ex - cx) * 0.55).toFixed(1)} ${(cy + dy * 0.7).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
          case 's':
            return `C ${ex.toFixed(1)} ${(cy + dy * 0.32).toFixed(1)}, ${cx.toFixed(1)} ${(cy + dy * 0.68).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
          case 'sweep':
          default:
            return `Q ${(cx + (ex - cx) * 0.5).toFixed(1)} ${(cy + dy * 0.18).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
        }
      }

      // SERVICES special case: the horizontal-scroll pin moves its content
      // sideways, not downward, so the path through that exact stretch
      // (services-top -> packages-top, i.e. the pin's full consumed
      // height) switches to a genuine sideways wave instead of the usual
      // curve — several wide alternating swings across the safe channel
      // as y advances, easing back to the normal ex/ey at the very end so
      // it hands off smoothly into the next ordinary segment.
      function buildHorizontalWave(cx, cy, ex, ey, width, ampScale) {
        const cycles = 4;
        const loX = clamp(width * 0.12, width * 0.1, width * 0.9);
        const hiX = clamp(width * 0.88 * ampScale + width * 0.5 * (1 - ampScale), width * 0.1, width * 0.9);
        const dy = (ey - cy) * 0.8; // reserve the final 20% of travel for easing into ex/ey
        const stepY = dy / cycles;
        let d = '';
        let px = cx;
        let py = cy;
        for (let k = 0; k < cycles; k++) {
          const targetX = k % 2 === 0 ? hiX : loX;
          const ny = py + stepY;
          const cp1x = px + (targetX - px) * 0.5;
          const cp2x = targetX - (targetX - px) * 0.15;
          d += ` C ${cp1x.toFixed(1)} ${py.toFixed(1)}, ${cp2x.toFixed(1)} ${ny.toFixed(1)}, ${targetX.toFixed(1)} ${ny.toFixed(1)}`;
          px = targetX;
          py = ny;
        }
        d += ` C ${px.toFixed(1)} ${(py + (ey - py) * 0.4).toFixed(1)}, ${ex.toFixed(1)} ${(py + (ey - py) * 0.7).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
        return d.trim();
      }

      // SPONSOR special case.
      //
      // Root cause of "the arrow goes up out of view": the sponsor section
      // is a scroll-jacked pin (+=180%) — the logo's ON-SCREEN position is
      // frozen for the whole pin while scrollY keeps climbing underneath
      // it. The previous version drew a true circle fixed at one single
      // document-Y (the logo's position). That Y never moves, but the
      // viewport keeps scrolling past it for the rest of the pin — so the
      // arrow (a normal document-positioned element, not itself pinned)
      // fell further and further above the viewport the deeper into the
      // pin the user scrolled. A fixed-center circle is fundamentally
      // incompatible with a long scroll-jacked pin for that reason.
      //
      // Fix: like the (already-working) Services horizontal wave, this
      // now ADVANCES in document-Y across the section's full pinned
      // range in lockstep with scroll, so the arrow can never drift off
      // the viewport — while swinging back and forth across the logo's
      // real x-position several times, which is what reads as "wrapping/
      // orbiting" the logo rather than a static ring around a fixed point.
      function buildLogoSwirl(cx, cy, ex, ey, lcx, r, width, ampScale) {
        const cycles = 3;
        const swing = clamp((r + 50) * ampScale, 50, width * 0.36);
        const loX = clamp(lcx - swing, width * 0.06, width * 0.94);
        const hiX = clamp(lcx + swing, width * 0.06, width * 0.94);
        const dy = (ey - cy) * 0.82; // reserve the tail for easing into ex/ey
        const stepY = dy / cycles;
        let d = '';
        let px = cx;
        let py = cy;
        for (let k = 0; k < cycles; k++) {
          const targetX = k % 2 === 0 ? hiX : loX;
          const ny = py + stepY;
          const cp1x = px + (targetX - px) * 0.5;
          const cp2x = targetX - (targetX - px) * 0.15;
          d += ` C ${cp1x.toFixed(1)} ${py.toFixed(1)}, ${cp2x.toFixed(1)} ${ny.toFixed(1)}, ${targetX.toFixed(1)} ${ny.toFixed(1)}`;
          px = targetX;
          py = ny;
        }
        d += ` C ${px.toFixed(1)} ${(py + (ey - py) * 0.4).toFixed(1)}, ${ex.toFixed(1)} ${(py + (ey - py) * 0.7).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
        return d.trim();
      }

      // Converts a real document-Y position into the matching arc-length
      // along the drawn path, by finding which pair of anchors it falls
      // between and interpolating by fraction-of-that-stretch's height —
      // never by fraction-of-total-path-length. This is what keeps the
      // arrow's progress tracking the user's actual scroll position
      // correctly through the sponsor swirl and the services wave (their
      // extra arc-length only gets "spent" while the user is actually
      // scrolling through that same stretch of page, in proportion to
      // how far through it they are — not before, not after).
      function lengthForY(targetY) {
        if (anchorYs.length < 2) return 0;
        const y = clamp(targetY, anchorYs[0], anchorYs[anchorYs.length - 1]);
        for (let i = 0; i < anchorYs.length - 1; i++) {
          const y0 = anchorYs[i];
          const y1 = anchorYs[i + 1];
          if (y >= y0 && y <= y1) {
            const span = y1 - y0;
            const frac = span > 0 ? (y - y0) / span : 0;
            return cumLens[i] + frac * (cumLens[i + 1] - cumLens[i]);
          }
        }
        return cumLens[cumLens.length - 1];
      }

      function updatePageFlow() {
        if (!totalLen || anchorYs.length < 2) return;

        // The document position currently centered in the user's viewport
        // — this is "where the user is," pins included (a pin keeps the
        // section visually still while scrollY keeps advancing, which is
        // exactly the scroll distance the swirl/wave were sized against).
        const targetY = window.scrollY + window.innerHeight * 0.5;
        const drawn = lengthForY(targetY);

        path.style.strokeDashoffset = String(totalLen - drawn);

        const back = clamp(drawn - 1, 0, totalLen);
        const fwd = clamp(drawn + 1, 0, totalLen);
        const p1 = path.getPointAtLength(back);
        const p2 = path.getPointAtLength(fwd);
        const cur = path.getPointAtLength(drawn);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

        arrow.style.transform = `translate(${cur.x}px, ${cur.y}px) rotate(${angle}deg)`;
      }

      function buildPageFlow() {
        const width = document.documentElement.clientWidth;
        const centerX = width * 0.5;
        const ampScale = width < 640 ? 0.55 : 1; // tighter swings on narrow screens

        const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
        if (sections.length < 2) return;

        const totalHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

        // Real section top positions — drives the path's SHAPE only.
        const sectionYs = sections.map((el) => el.getBoundingClientRect().top + window.scrollY);
        const lastEl = sections[sections.length - 1];
        const lastRect = lastEl.getBoundingClientRect();
        sectionYs.push(lastRect.top + window.scrollY + lastRect.height * 0.55);

        const logoEl = document.querySelector('.sponsor-logo-wrap');
        const logoRect = logoEl ? logoEl.getBoundingClientRect() : null;

        flow.style.height = totalHeight + 'px';
        svg.setAttribute('viewBox', `0 0 ${width} ${totalHeight}`);

        // Content-aware mask: the line stays at full visibility over empty
        // space and recedes (lower luminance = more transparent, via the
        // mask below) wherever it would otherwise cross real content —
        // real measured boxes, not guessed coordinates, so it stays
        // correct if text wraps differently at another width.
        if (maskEl && maskBase && maskContent) {
          // Explicit region bounds on the <mask> itself — without these,
          // userSpaceOnUse falls back to ambiguous percentage defaults
          // that don't reliably cover a document this tall, which is what
          // was causing the mask to apply on some content and not others.
          maskEl.setAttribute('x', '0');
          maskEl.setAttribute('y', '0');
          maskEl.setAttribute('width', String(width));
          maskEl.setAttribute('height', String(totalHeight));
          maskBase.setAttribute('width', String(width));
          maskBase.setAttribute('height', String(totalHeight));
          while (maskContent.firstChild) maskContent.removeChild(maskContent.firstChild);
          document.querySelectorAll(CONTENT_SELECTOR).forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) return;
            const pad = 8;
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', String(r.left - pad));
            rect.setAttribute('y', String(r.top + window.scrollY - pad));
            rect.setAttribute('width', String(r.width + pad * 2));
            rect.setAttribute('height', String(r.height + pad * 2));
            rect.setAttribute('rx', '6');
            maskContent.appendChild(rect);
          });
        }

        let cx = centerX;
        let cy = Math.max(sectionYs[0], 30);
        let d = `M ${cx.toFixed(1)} ${cy.toFixed(1)}`;

        // Pacing table for lengthForY() — built up in step with `d`, but
        // decoupled from sectionYs so the sponsor branch can insert extra
        // checkpoints without disturbing the geometry loop below.
        anchorYs = [cy];
        cumLens = [0];

        for (let i = 1; i < sectionYs.length; i++) {
          const fromId = sections[i - 1] && sections[i - 1].id;
          const mood = MOODS[(i - 1) % MOODS.length];
          const side = i % 2 === 1 ? 1 : -1;
          const ey = sectionYs[i];
          const ex = clamp(centerX + side * mood.amp * ampScale * width, width * 0.1, width * 0.9);

          if (fromId === 'services') {
            d += ' ' + buildHorizontalWave(cx, cy, ex, ey, width, ampScale);
          } else if (fromId === 'sponsor' && logoRect) {
            const lcx = logoRect.left + logoRect.width / 2;
            const r = clamp(logoRect.width / 2 + 30, 90, width * 0.26);
            d += ' ' + buildLogoSwirl(cx, cy, ex, ey, lcx, r, width, ampScale);
          } else {
            d += ' ' + buildSegment(cx, cy, ex, ey, mood);
          }
          cx = ex;
          cy = ey;

          // Measure how far along the path this anchor actually sits, so
          // lengthForY() can interpolate against real arc-length rather
          // than assuming every stretch costs the same amount of path.
          path.setAttribute('d', d);
          anchorYs.push(ey);
          cumLens.push(path.getTotalLength());
        }

        totalLen = cumLens[cumLens.length - 1];
        path.style.strokeDasharray = String(totalLen);
        updatePageFlow();
      }

      buildPageFlow();

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        // No scrub here deliberately — updatePageFlow() reads window.scrollY
        // directly each call, so this just needs to fire on every real
        // scroll tick with zero added easing/lag between the user's
        // actual position and the arrow's.
        onUpdate: () => updatePageFlow(),
        onRefresh: () => buildPageFlow(),
      });
    })();

    // Re-measure pinned/horizontal sections once images affecting layout have loaded.
    const layoutImages = [document.getElementById('heroBgImg'), document.getElementById('aboutPhoto')];
    layoutImages.forEach((img) => {
      if (img && !img.complete) img.addEventListener('load', () => ScrollTrigger.refresh());
    });
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  // ---------- Mobile menu link stagger ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      if (!navLinks.classList.contains('open')) return;
      gsap.from(navLinks.querySelectorAll('a'), {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
        delay: 0.1,
      });
    });
  }

  // ---------- Magnetic buttons (desktop, fine pointer only) ----------
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.btn').forEach((btn) => {
      const strength = 0.35;
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }
})();
