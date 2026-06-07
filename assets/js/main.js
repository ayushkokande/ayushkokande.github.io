/* ====================================================================
   TIME-OF-DAY PALETTE
   9 keyframes across 24h. Linearly interpolated by minute.
   Drives --accent / --accent-glow / --accent-soft (CSS) and the
   lattice node + edge colors (canvas, via window.__palette).
   ==================================================================== */
const Sky = (function () {
  // Each keyframe: hour, accent RGB, rest RGB (lattice cool tone),
  // sky RGB (top-of-viewport atmosphere — the dominant signal),
  // bg RGB (deep grounded color the page fades to).
  // The sky is intentionally more saturated than the bg so the
  // atmosphere visibly shifts through the day while text stays readable.
  const KEYS = [
    { h:  0,   accent: [150, 112, 158], rest: [104,  98,  92], sky: [228, 224, 232], bg: [246, 245, 248], phase: 'night'      },
    { h:  5,   accent: [168, 110, 142], rest: [106,  96,  90], sky: [236, 224, 228], bg: [248, 246, 246], phase: 'pre-dawn'   },
    { h:  7,   accent: [196, 104,  74], rest: [110,  94,  82], sky: [248, 230, 214], bg: [251, 248, 242], phase: 'dawn'       },
    { h: 10,   accent: [178,  96,  68], rest: [104,  96,  86], sky: [233, 234, 230], bg: [248, 247, 242], phase: 'morning'    },
    { h: 13,   accent: [188, 108,  70], rest: [100,  96,  88], sky: [228, 232, 236], bg: [247, 246, 242], phase: 'midday'     },
    { h: 16,   accent: [184, 122,  58], rest: [106,  96,  78], sky: [242, 232, 212], bg: [250, 248, 241], phase: 'afternoon'  },
    { h: 18.5, accent: [198,  92,  62], rest: [110,  92,  80], sky: [248, 226, 208], bg: [251, 247, 240], phase: 'sunset'     },
    { h: 20,   accent: [186,  92, 112], rest: [104,  92,  92], sky: [240, 224, 228], bg: [249, 246, 246], phase: 'dusk'       },
    { h: 22,   accent: [158, 110, 158], rest: [102,  94,  96], sky: [232, 226, 236], bg: [247, 245, 249], phase: 'twilight'   },
    { h: 24,   accent: [150, 112, 158], rest: [104,  98,  92], sky: [228, 224, 232], bg: [246, 245, 248], phase: 'night'      },
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpRGB(a, b, t) {
    return [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t)),
    ];
  }

  function paletteAt(hourFloat) {
    let a = KEYS[0], b = KEYS[1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (KEYS[i].h <= hourFloat && hourFloat < KEYS[i + 1].h) {
        a = KEYS[i]; b = KEYS[i + 1]; break;
      }
    }
    const t = (hourFloat - a.h) / (b.h - a.h);
    return {
      accentRGB: lerpRGB(a.accent, b.accent, t),
      restRGB:   lerpRGB(a.rest,   b.rest,   t),
      skyRGB:    lerpRGB(a.sky,    b.sky,    t),
      bgRGB:     lerpRGB(a.bg,     b.bg,     t),
      activeRGB: lerpRGB(a.accent, b.accent, t),
      phase: t < 0.5 ? a.phase : b.phase,
    };
  }

  function apply(p) {
    const root = document.documentElement.style;
    const rgb = a => `rgb(${a[0]}, ${a[1]}, ${a[2]})`;
    const rgba = (a, o) => `rgba(${a[0]}, ${a[1]}, ${a[2]}, ${o})`;
    root.setProperty('--accent', rgb(p.accentRGB));
    root.setProperty('--accent-soft', rgba(p.accentRGB, 0.15));
    root.setProperty('--accent-glow', rgba(p.accentRGB, 0.45));
    root.setProperty('--sky', rgb(p.skyRGB));
    root.setProperty('--bg', rgb(p.bgRGB));
    // Expose lattice colors to the canvas loop
    window.__palette = p;
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function formatHM(hourFloat) {
    const h = Math.floor(hourFloat);
    const m = Math.floor((hourFloat - h) * 60);
    return `${pad(h)}:${pad(m)}`;
  }
  function nowHour() {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  return { paletteAt, apply, formatHM, nowHour };
})();

/* ====================================================================
   TIME CONTROL UI — phase badge + scrubber
   ==================================================================== */
(function () {
  const badge    = document.getElementById('timeBadge');
  const nowEl    = document.getElementById('timeNow');
  const phaseEl  = document.getElementById('timePhase');
  const modeEl   = document.getElementById('timeMode');
  const scrubber = document.getElementById('timeScrubber');
  const slider   = document.getElementById('timeSlider');
  const reset    = document.getElementById('timeReset');

  let manual = false;        // when true, slider value drives palette
  let manualHour = 0;
  let tickHandle = null;

  function update() {
    const hour = manual ? manualHour : Sky.nowHour();
    const p = Sky.paletteAt(hour);
    Sky.apply(p);
    nowEl.textContent = Sky.formatHM(hour);
    phaseEl.textContent = p.phase;
    modeEl.textContent = manual ? 'manual' : '';
    if (!manual) slider.value = Math.round(hour * 60);
  }

  function startTick() {
    if (tickHandle) clearInterval(tickHandle);
    // Update every 20s so the transition stays smooth even between keyframes
    tickHandle = setInterval(update, 20000);
  }

  badge.addEventListener('click', () => {
    scrubber.classList.toggle('is-open');
  });

  slider.addEventListener('input', (e) => {
    manual = true;
    manualHour = parseInt(e.target.value, 10) / 60;
    update();
  });

  reset.addEventListener('click', (e) => {
    e.stopPropagation();
    manual = false;
    update();
  });

  update();
  startTick();
})();


/* ====================================================================
   NEURAL LATTICE — canvas-rendered field of nodes + connections.
   Ambient: random sparks propagate through the graph.
   Reactive: cursor injects local activation that spreads.
   ==================================================================== */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const cv = document.getElementById('lattice');
  const ctx = cv.getContext('2d', { alpha: true });

  // Tunables
  const GRID_X = 14;            // node columns
  const GRID_Y = 9;             // node rows
  const JITTER = 0.55;          // randomness in node placement
  const CONNECT_DIST_F = 1.6;   // factor of cell-size that counts as a neighbor
  const MOUSE_REACH = 220;      // px radius mouse activates within
  const SPARK_EVERY = 1100;     // ms between random sparks
  const DECAY = 0.965;          // per-frame activation falloff

  let W = 0, H = 0, DPR = 1;
  let nodes = [];
  let edges = [];
  let mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = window.innerWidth * DPR;
    H = cv.height = window.innerHeight * DPR;
    cv.style.width = window.innerWidth + 'px';
    cv.style.height = window.innerHeight + 'px';
    buildLattice();
  }

  function buildLattice() {
    nodes = [];
    edges = [];
    const cellW = W / (GRID_X + 1);
    const cellH = H / (GRID_Y + 1);
    const connectDist = Math.min(cellW, cellH) * CONNECT_DIST_F;

    for (let j = 1; j <= GRID_Y; j++) {
      for (let i = 1; i <= GRID_X; i++) {
        const jx = (Math.random() - 0.5) * cellW * JITTER;
        const jy = (Math.random() - 0.5) * cellH * JITTER;
        nodes.push({
          x: i * cellW + jx,
          y: j * cellH + jy,
          x0: i * cellW + jx,
          y0: j * cellH + jy,
          phase: Math.random() * Math.PI * 2,
          act: 0,
        });
      }
    }
    // Build edges between near pairs
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = nodes[a].x - nodes[b].x;
        const dy = nodes[a].y - nodes[b].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < connectDist) edges.push([a, b, d]);
      }
    }
  }

  function spark() {
    // Pick a random node and inject activation
    const n = nodes[Math.floor(Math.random() * nodes.length)];
    n.act = Math.max(n.act, 0.95);
  }

  let lastSpark = 0;

  function frame(t) {
    ctx.clearRect(0, 0, W, H);

    // Mouse activation
    if (mouse.active) {
      const mx = mouse.x * DPR;
      const my = mouse.y * DPR;
      const reach = MOUSE_REACH * DPR;
      for (const n of nodes) {
        const dx = n.x - mx;
        const dy = n.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < reach) {
          const k = 1 - d / reach;
          n.act = Math.max(n.act, k * 0.85);
        }
      }
    }

    // Ambient sparks
    if (t - lastSpark > SPARK_EVERY) {
      spark();
      if (Math.random() < 0.4) spark();
      lastSpark = t;
    }

    // Subtle drift on each node
    for (const n of nodes) {
      n.phase += 0.005;
      n.x = n.x0 + Math.sin(n.phase) * 4 * DPR;
      n.y = n.y0 + Math.cos(n.phase * 0.8) * 4 * DPR;
    }

    // Propagate activation along edges (one-pass bleed)
    const next = nodes.map(n => n.act);
    for (const [a, b] of edges) {
      const A = nodes[a].act;
      const B = nodes[b].act;
      // bleed a bit of energy to the lower-activation neighbor
      if (A > B) next[b] = Math.max(next[b], A * 0.55);
      else if (B > A) next[a] = Math.max(next[a], B * 0.55);
    }
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].act = next[i] * DECAY;
      if (nodes[i].act < 0.005) nodes[i].act = 0;
    }

    // Draw edges first (under nodes)
    ctx.lineWidth = 1 * DPR;
    const pal = window.__palette || {
      activeRGB: [193, 95, 60],
      restRGB: [104, 98, 90]
    };
    const aR = pal.activeRGB[0], aG = pal.activeRGB[1], aB = pal.activeRGB[2];
    const rR = pal.restRGB[0], rG = pal.restRGB[1], rB = pal.restRGB[2];

    for (const [a, b] of edges) {
      const A = nodes[a];
      const B = nodes[b];
      const e = Math.max(A.act, B.act);
      const baseAlpha = 0.03;
      const alpha = baseAlpha + e * 0.5;
      if (alpha < 0.04 && e < 0.05) continue; // skip near-invisible edges for perf
      // Mix in active accent based on activation level
      if (e > 0.1) {
        ctx.strokeStyle = `rgba(${aR}, ${aG}, ${aB}, ${alpha})`;
      } else {
        ctx.strokeStyle = `rgba(${rR}, ${rG}, ${rB}, ${alpha})`;
      }
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    // Draw nodes
    for (const n of nodes) {
      const r = (1.4 + n.act * 4) * DPR;
      const alpha = 0.25 + n.act * 0.75;
      if (n.act > 0.12) {
        // glow
        ctx.fillStyle = `rgba(${aR}, ${aG}, ${aB}, ${alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${aR}, ${aG}, ${aB}, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(${rR}, ${rG}, ${rB}, ${alpha})`;
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, { passive: true });
  window.addEventListener('mouseout', () => { mouse.active = false; });

  resize();
  requestAnimationFrame(frame);
})();

/* ====================================================================
   CUSTOM CURSOR
   ==================================================================== */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const cursor = document.getElementById('cursor');
  let tx = 0, ty = 0, cx = 0, cy = 0;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  function loop() {
    // lerp for smooth follow
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  document.querySelectorAll('[data-magnetic], a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
})();

/* ====================================================================
   MAGNETIC HOVER on hero links
   ==================================================================== */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const STRENGTH = 0.25;
  const RANGE = 80;

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < RANGE * 2) {
        el.style.transform = `translate(${dx * STRENGTH}px, ${dy * STRENGTH}px)`;
      }
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

/* ====================================================================
   PROJECT CARD TILT + spotlight
   ==================================================================== */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -6;
      const ry = (px - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(2px)`;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ====================================================================
   SCROLL REVEAL
   ==================================================================== */
(function () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();
