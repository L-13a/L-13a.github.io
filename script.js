/* ════════════════════════════════════════════════════════
   CURSOR
════════════════════════════════════════════════════════ */
const dot  = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = mouseX + 'px';
  dot.style.top  = mouseY + 'px';
  dot.style.opacity = 1;
  ring.style.opacity = 0.6;
});

// Smooth trailing ring
(function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

// Hide cursor when leaving window
document.addEventListener('mouseleave', () => { dot.style.opacity = 0; ring.style.opacity = 0; });
document.addEventListener('mouseenter', () => { dot.style.opacity = 1; ring.style.opacity = 0.6; });


/* ════════════════════════════════════════════════════════
   HERO CANVAS — bokeh blobs
════════════════════════════════════════════════════════ */
const canvas = document.getElementById('hero-canvas');
const ctx    = canvas.getContext('2d');

const COLORS = [
  [255, 203, 164],  // peach
  [232, 180, 184],  // rose
  [184, 212, 176],  // sage
  [245, 230, 211],  // sand
  [255, 220, 200],  // warm peach
  [248, 210, 185],  // soft apricot
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
document.addEventListener('mousemove', e => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) * 0.007;
  const dy = (e.clientY - cy) * 0.007;
  heroParallax.style.transform = `translate(${dx}px, ${dy}px)`;
});


/* ════════════════════════════════════════════════════════
   WATER PAINTING — ink follows mouse, expands & fades
════════════════════════════════════════════════════════ */
const waterCanvas = document.getElementById('water-canvas');
const wCtx = waterCanvas.getContext('2d');

// 8 colors mapped to 8 movement directions (clockwise from right)
const WATER_PALETTE = [
  [255, 168, 130],  // warm peach     → right
  [240, 185, 140],  // amber          → down-right
  [220, 140, 148],  // dusty rose     → down
  [198, 118, 132],  // deep rose      → down-left
  [160, 145, 205],  // soft lavender  → left
  [118, 178, 140],  // sage green     → up-left
  [108, 168, 158],  // teal-sage      → up
  [195, 186, 140],  // warm sand      → up-right
];

class Ink {
  constructor(x, y, rgb) {
    this.x  = x + (Math.random() - 0.5) * 28;
    this.y  = y + (Math.random() - 0.5) * 28;
    this.r  = 12 + Math.random() * 16;
    this.maxR = 80 + Math.random() * 120;
    this.rgb  = rgb;
    this.alpha = 0.18 + Math.random() * 0.22;  // higher — blur dilutes perceived color
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
  // Clear each frame — no destination-out rings
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
    const angle = Math.atan2(dy, dx);                         // -π … π
    const normAngle = (angle + Math.PI) / (Math.PI * 2);     //  0 … 1
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
════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/* ════════════════════════════════════════════════════════
   LIVE CLOCK in footer (tiny delight)
════════════════════════════════════════════════════════ */
const footer = document.querySelector('footer p');
if (footer) {
  const baseText = footer.innerHTML;
  setInterval(() => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai'
    });
    // Only update if element still matches
    if (footer.innerHTML.includes('·')) {
      footer.innerHTML = baseText.replace('2025', '2025 · ' + time + ' CST');
    }
  }, 1000);
}
