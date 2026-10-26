/* ════════════════════════════════════════════════════════
   HERO CANVAS — bokeh blobs
════════════════════════════════════════════════════════ */
const canvas = document.getElementById('hero-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');

  const COLORS = [
    [162, 200, 240],  // sky
    [186, 200, 245],  // periwinkle
    [166, 214, 226],  // pale aqua
    [201, 224, 244],  // mist
    [176, 210, 246],  // soft blue
    [191, 216, 249],  // pale azure
  ];

  class Blob {
    constructor() { this.init(); }
    init() {
      this.r  = Math.random() * 120 + 40;
      // Keep blobs away from edges so they never appear as clipped corner shapes
      const margin = this.r + 20;
      this.x  = margin + Math.random() * Math.max(canvas.width  - margin * 2, 1);
      this.y  = margin + Math.random() * Math.max(canvas.height - margin * 2, 1);
      // Guarantee a minimum speed so no blob ever looks frozen
      const minSpeed = 0.18;
      const speed = minSpeed + Math.random() * 0.22;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.alpha = Math.random() * 0.18 + 0.04;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.006 + Math.random() * 0.008;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += this.pulseSpeed;
      const r = this.r + Math.sin(this.pulse) * 8;
      // Keep blob centers fully inside the canvas so the circle is never
      // clipped at the edges, which would leave hard-edged colour blocks.
      const margin = this.r + 10;
      if (this.x - margin < 0)                  { this.x = margin;                    this.vx =  Math.abs(this.vx); }
      else if (this.x + margin > canvas.width)  { this.x = canvas.width  - margin;   this.vx = -Math.abs(this.vx); }
      if (this.y - margin < 0)                  { this.y = margin;                    this.vy =  Math.abs(this.vy); }
      else if (this.y + margin > canvas.height) { this.y = canvas.height - margin;   this.vy = -Math.abs(this.vy); }
      return r;
    }
    draw() {
      const r = this.update();
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
      const [R,G,B] = this.color;
      grad.addColorStop(0,   `rgba(${R},${G},${B},${this.alpha})`);
      grad.addColorStop(0.5, `rgba(${R},${G},${B},${this.alpha * 0.5})`);
      grad.addColorStop(1,   `rgba(${R},${G},${B},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let blobs = [];
  let parallaxOffsetX = 0, parallaxOffsetY = 0;
  let targetParallaxX = 0, targetParallaxY = 0;

  function initCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    blobs = Array.from({ length: 18 }, () => new Blob());
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    // Apply gentle parallax offset
    parallaxOffsetX += (targetParallaxX - parallaxOffsetX) * 0.04;
    parallaxOffsetY += (targetParallaxY - parallaxOffsetY) * 0.04;
    ctx.translate(parallaxOffsetX, parallaxOffsetY);
    blobs.forEach(b => b.draw());
    ctx.restore();
    requestAnimationFrame(drawCanvas);
  }

  window.addEventListener('resize', initCanvas);
  initCanvas();
  drawCanvas();

  /* Parallax: mouse moves blobs slightly */
  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetParallaxX = (e.clientX - cx) * 0.018;
    targetParallaxY = (e.clientY - cy) * 0.018;
  });

  /* Hero content parallax */
  const heroParallax = document.getElementById('hero-parallax');
  if (heroParallax) {
    document.addEventListener('mousemove', e => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) * 0.007;
      const dy = (e.clientY - cy) * 0.007;
      heroParallax.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  }
}


/* ════════════════════════════════════════════════════════
   WATER PAINTING — ink follows mouse, expands & fades
════════════════════════════════════════════════════════ */
const waterCanvas = document.getElementById('water-canvas');
if (waterCanvas) {
  const wCtx = waterCanvas.getContext('2d');

  // 8 colors mapped to 8 movement directions (clockwise from right)
  const WATER_PALETTE = [
    [120, 172, 226],  // sky blue       → right
    [142, 190, 236],  // light azure    → down-right
    [152, 168, 226],  // periwinkle     → down
    [120, 140, 212],  // indigo blue    → down-left
    [170, 176, 232],  // soft lavender  → left
    [110, 190, 192],  // aqua           → up-left
    [92, 172, 184],   // deep aqua      → up
    [172, 200, 226],  // blue grey      → up-right
  ];

  class Ink {
    constructor(x, y, rgb) {
      this.x  = x + (Math.random() - 0.5) * 28;
      this.y  = y + (Math.random() - 0.5) * 28;
      this.r  = 12 + Math.random() * 16;
      this.maxR = 80 + Math.random() * 120;
      this.rgb  = rgb;
      this.alpha = 0.18 + Math.random() * 0.22;  // higher - blur dilutes perceived color
      this.speed = 3.0 + Math.random() * 4.0;    // fast spread
      this.life  = 1.0;
      this.decay = 0.004 + Math.random() * 0.004;
      this.dx = (Math.random() - 0.5) * 0.25;
      this.dy = (Math.random() - 0.5) * 0.25;
    }
    update() {
      if (this.r < this.maxR) this.r += this.speed;
      this.life -= this.decay;
      this.x += this.dx;
      this.y += this.dy;
      return this.life > 0;
    }
    draw() {
      const a = this.alpha * Math.pow(this.life, 1.4);
      const [R, G, B] = this.rgb;
      const g = wCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0, `rgba(${R},${G},${B},${a.toFixed(3)})`);
      g.addColorStop(1, `rgba(${R},${G},${B},0)`);
      wCtx.fillStyle = g;
      wCtx.beginPath();
      wCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      wCtx.fill();
    }
  }

  let inks = [];
  let wPrevX = -1, wPrevY = -1, wLastDrop = 0;

  function resizeWaterCanvas() {
    waterCanvas.width  = window.innerWidth;
    waterCanvas.height = window.innerHeight;
  }

  function animateWater() {
    // Clear each frame - no destination-out rings
    wCtx.clearRect(0, 0, waterCanvas.width, waterCanvas.height);
    inks = inks.filter(ink => { ink.draw(); return ink.update(); });
    requestAnimationFrame(animateWater);
  }

  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - wLastDrop < 16) return;
    wLastDrop = now;

    const ox = wPrevX < 0 ? e.clientX : wPrevX;
    const oy = wPrevY < 0 ? e.clientY : wPrevY;
    const dx = e.clientX - ox;
    const dy = e.clientY - oy;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 2) {
      const angle = Math.atan2(dy, dx);                         // -π ... π
      const normAngle = (angle + Math.PI) / (Math.PI * 2);     //  0 ... 1
      const cIdx  = Math.floor(normAngle * WATER_PALETTE.length) % WATER_PALETTE.length;
      const cIdx2 = (cIdx + 1) % WATER_PALETTE.length;

      const count = Math.min(3, 1 + Math.floor(speed / 15));
      for (let i = 0; i < count; i++) {
        const t = count > 1 ? i / (count - 1) : 0;
        inks.push(new Ink(
          ox + dx * t,
          oy + dy * t,
          Math.random() < 0.65 ? WATER_PALETTE[cIdx] : WATER_PALETTE[cIdx2]
        ));
      }
      if (inks.length > 400) inks.splice(0, inks.length - 400);
    }

    wPrevX = e.clientX;
    wPrevY = e.clientY;
  });

  window.addEventListener('resize', resizeWaterCanvas);
  resizeWaterCanvas();
  animateWater();
}


/* ════════════════════════════════════════════════════════
   NAV scroll effect
════════════════════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});


/* ════════════════════════════════════════════════════════
   SCROLL REVEAL — Intersection Observer
════════════════════════════════════════════════════════ */
const revealElements = document.querySelectorAll('.reveal, .reveal-group');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Small random stagger for a more organic feel
      const delay = parseFloat(entry.target.dataset.delay || 0);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach((el, i) => {
  // Stagger siblings within the same parent
  const siblings = el.parentElement.querySelectorAll('.reveal, .reveal-group');
  let idx = Array.from(siblings).indexOf(el);
  el.dataset.delay = idx * 80;
  observer.observe(el);
});


/* ════════════════════════════════════════════════════════
   SKILL TAG micro-bounce on load
════════════════════════════════════════════════════════ */
document.querySelectorAll('.skill-tag').forEach((tag, i) => {
  tag.addEventListener('mouseenter', () => {
    tag.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s, filter 0.3s';
  });
});


/* ════════════════════════════════════════════════════════
   SMOOTH SCROLL for all anchor links
   Delegated, so links re-rendered by the language switch
   (footer credit, etc.) keep working.
════════════════════════════════════════════════════════ */
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;

  const hash = anchor.getAttribute('href');
  if (!hash || hash === '#') return;

  const target = document.querySelector(hash);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});


/* ════════════════════════════════════════════════════════
   PROJECT INDEX — the list shows first, a row opens its panel
   Rows carry data-project="<id>"; panels carry the same id,
   so adding a project only means adding markup.

   The panel's height is animated in px and then handed back to
   `auto`, so it keeps reflowing if the text changes (i18n switch).
════════════════════════════════════════════════════════ */
const projectRows = Array.from(document.querySelectorAll('.project-row'));
const projectPanels = Array.from(document.querySelectorAll('.project-detail'));
const projectLayout = document.querySelector('.projects-layout');

if (projectRows.length) {
  const isActive = (row) => row.classList.contains('is-active');

  projectPanels.forEach(panel => {
    panel.addEventListener('transitionend', (e) => {
      if (e.propertyName !== 'height') return;
      if (panel.classList.contains('is-open')) panel.style.height = 'auto';
    });
  });

  const openPanel = (panel) => {
    panel.classList.add('is-open');
    panel.style.height = panel.scrollHeight + 'px';
    // safety net: if transitionend never arrives, still release the
    // fixed height so later reflows (e.g. a language switch) fit
    clearTimeout(panel._autoTimer);
    panel._autoTimer = setTimeout(() => {
      if (panel.classList.contains('is-open')) panel.style.height = 'auto';
    }, 900);
  };

  const closePanel = (panel) => {
    clearTimeout(panel._autoTimer);
    // pin the current height, flush layout, then go to 0 — otherwise
    // `height: auto` has no number to animate from
    panel.style.height = panel.scrollHeight + 'px';
    void panel.offsetHeight;
    panel.classList.remove('is-open');
    panel.style.height = '0px';
  };

  const showProject = (id) => {
    projectPanels.forEach(panel => {
      const on = id !== null && panel.dataset.project === id;
      if (on && !panel.classList.contains('is-open')) openPanel(panel);
      else if (!on && panel.classList.contains('is-open')) closePanel(panel);
    });
    projectRows.forEach(row => {
      const on = id !== null && row.dataset.project === id;
      row.classList.toggle('is-active', on);
      row.setAttribute('aria-expanded', String(on));
    });
    // closed → the index takes the full width and centres itself
    if (projectLayout) projectLayout.classList.toggle('has-open', id !== null);
  };

  projectRows.forEach((row, i) => {
    // same row again → fold it back up
    row.addEventListener('click', () => {
      showProject(isActive(row) ? null : row.dataset.project);
    });

    // Up / Down arrows walk the list and open as they go
    row.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const next = projectRows[(i + step + projectRows.length) % projectRows.length];
      next.focus();
      showProject(next.dataset.project);
    });
  });
}


/* ════════════════════════════════════════════════════════
   LIVE CLOCK in footer (tiny delight)
   Writes into #footer-clock only — the footer text itself is
   owned by i18n.js and may be re-rendered on language change.
════════════════════════════════════════════════════════ */
setInterval(() => {
  const clock = document.getElementById('footer-clock');
  if (!clock) return;

  const now = new Date();
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai'
  });
  const next = `${now.getFullYear()} · ${time} CST`;
  if (clock.textContent !== next) clock.textContent = next;
}, 1000);
