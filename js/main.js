/* =========================================================================
   Titanic — A Love Story
   Vanilla JS + GSAP ScrollTrigger. Ocean/fog/particle canvases, ambient
   wave audio, chaptered scroll-storytelling. Degrades gracefully without
   GSAP or under prefers-reduced-motion.
   ========================================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* -- Preloader ---------------------------------------------------------- */
  const loader = document.getElementById("loader");
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("is-done"), reduceMotion ? 0 : 1700);
  });
  setTimeout(() => loader.classList.add("is-done"), 4000);

  /* -- Custom cursor ------------------------------------------------------ */
  const cursor = document.getElementById("cursor");
  if (finePointer && !reduceMotion) {
    const dot = cursor.querySelector(".cursor__dot");
    const ring = cursor.querySelector(".cursor__ring");
    let mx = -100, my = -100, rx = -100, ry = -100;

    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    const lerp = (a, b, t) => a + (b - a) * t;
    (function cursorLoop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(cursorLoop);
    })();

    const hoverables = "a, button, .ticket";
    document.addEventListener("pointerover", (e) => {
      cursor.classList.toggle("is-hover", !!e.target.closest(hoverables));
    }, { passive: true });
  }

  /* -- Header + scroll progress ------------------------------------------- */
  const head = document.getElementById("siteHead");
  const progressBar = document.getElementById("progressBar");
  const openingShip = document.querySelector(".opening__ship");
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      head.classList.toggle("is-visible", y > window.innerHeight * 0.55);
      head.classList.toggle("is-scrolled", y > window.innerHeight * 0.55);
      if (!reduceMotion && openingShip && y < window.innerHeight * 1.2) {
        openingShip.style.transform =
          `translateX(calc(-50% + ${y * 0.06}px)) translateY(${y * 0.12}px)`;
      }
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* -- Reveal on scroll ---------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* -- Iceberg countdown ---------------------------------------------------- */
  const seconds = document.getElementById("seconds");
  if (seconds) {
    const secIO = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        secIO.unobserve(entry.target);
        if (reduceMotion) continue;
        let v = 37;
        const timer = setInterval(() => {
          v -= 1;
          seconds.textContent = String(Math.max(v, 0));
          if (v <= 0) clearInterval(timer);
        }, 140);
      }
    }, { threshold: 0.7 });
    secIO.observe(seconds);
  }

  /* -- Ticket tilt ---------------------------------------------------------- */
  const ticket = document.getElementById("ticket");
  if (ticket && finePointer && !reduceMotion) {
    ticket.addEventListener("pointermove", (e) => {
      const r = ticket.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ticket.style.transform = `rotateY(${px * 10}deg) rotateX(${py * -8}deg) translateY(-4px)`;
    });
    ticket.addEventListener("pointerleave", () => { ticket.style.transform = ""; });
  }

  /* =======================================================================
     Canvas atmospheres
     ======================================================================= */
  const canvasSetup = (canvas) => {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  };

  // Animate only while the canvas is on screen.
  const animateWhenVisible = (canvas, start, stop) => {
    if (reduceMotion) { start(); stop(); return; }
    const vis = new IntersectionObserver((entries) => {
      for (const entry of entries) (entry.isIntersecting ? start : stop)();
    }, { threshold: 0 });
    vis.observe(canvas);
  };

  /* Ocean: layered slow waves; optionally a starfield above the horizon. */
  function ocean(canvas, { stars = false, calm = false } = {}) {
    let ctx, w, h, field = [], waves = [], raf = null;

    const build = () => {
      ({ ctx, w, h } = canvasSetup(canvas));
      field = stars
        ? Array.from({ length: Math.floor((w * h) / 3800) }, () => ({
            x: Math.random() * w,
            y: Math.random() * h * 0.6,
            r: Math.random() * 1.1 + 0.2,
            base: Math.random() * 0.5 + 0.15,
            amp: Math.random() * 0.35,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.9 + 0.4
          }))
        : [];
      waves = Array.from({ length: 5 }, (_, i) => ({
        baseY: h * (0.62 + i * 0.085),
        amp: (calm ? 2.5 : 5) + i * (calm ? 1 : 2),
        len: 0.008 - i * 0.001,
        speed: (calm ? 0.12 : 0.22) + i * 0.05,
        alpha: 0.05 + i * 0.025
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of field) {
        const a = s.base + (reduceMotion ? 0 : Math.sin((t / 1000) * s.speed + s.phase) * s.amp);
        ctx.globalAlpha = Math.max(0.05, a);
        ctx.fillStyle = "#e8e2d2";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const wave of waves) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) {
          const yy = wave.baseY
            + Math.sin(x * wave.len + (t / 1000) * wave.speed) * wave.amp
            + Math.sin(x * wave.len * 2.7 + (t / 1000) * wave.speed * 1.6) * wave.amp * 0.4;
          ctx.lineTo(x, yy);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(16, 27, 45, ${wave.alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(139, 147, 161, ${wave.alpha * 0.9})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    build();
    animateWhenVisible(canvas,
      () => { if (raf === null) raf = requestAnimationFrame(draw); },
      () => { cancelAnimationFrame(raf); raf = null; });
    if (reduceMotion) draw(0);
    window.addEventListener("resize", () => { build(); if (reduceMotion) draw(0); });
  }

  /* Drifting particles: cold frost (down) or warm gold dust (up). */
  function particles(canvas, { color = "#cfd6dd", rising = false, density = 14 } = {}) {
    let ctx, w, h, flakes = [], raf = null;

    const build = () => {
      ({ ctx, w, h } = canvasSetup(canvas));
      flakes = Array.from({ length: Math.floor(w / density) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vy: (Math.random() * 0.35 + 0.12) * (rising ? -1 : 1),
        vx: Math.random() * 0.25 - 0.05,
        a: Math.random() * 0.25 + 0.08
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const f of flakes) {
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        f.y += f.vy; f.x += f.vx;
        if (!rising && f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        if (rising && f.y < -4) { f.y = h + 4; f.x = Math.random() * w; }
        if (f.x > w + 4) f.x = -4;
      }
      raf = requestAnimationFrame(draw);
    };

    build();
    animateWhenVisible(canvas,
      () => { if (raf === null) raf = requestAnimationFrame(draw); },
      () => { cancelAnimationFrame(raf); raf = null; });
    window.addEventListener("resize", build);
  }

  const openingOcean = document.getElementById("openingOcean");
  if (openingOcean) ocean(openingOcean, { stars: true });
  const endingOcean = document.getElementById("endingOcean");
  if (endingOcean) ocean(endingOcean, { calm: true });
  const meetDust = document.getElementById("meetDust");
  if (meetDust) particles(meetDust, { color: "#c8a86e", rising: true, density: 34 });
  const loveDust = document.getElementById("loveDust");
  if (loveDust) particles(loveDust, { color: "#c8a86e", rising: true, density: 22 });
  const vowFrost = document.getElementById("vowFrost");
  if (vowFrost) particles(vowFrost, { color: "#cfd6dd", density: 20 });

  /* =======================================================================
     Ambient ocean audio — filtered noise with a slow swell. Starts on the
     Enter gesture; toggle lives in the header.
     ======================================================================= */
  const soundToggle = document.getElementById("soundToggle");
  let audio = null;

  function createOceanAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();

    const len = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {           // brown noise ≈ distant surf
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass"; lowpass.frequency.value = 420; lowpass.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    const lfo = ctx.createOscillator();          // the swell
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.045;
    lfo.connect(lfoGain).connect(gain.gain);

    src.connect(lowpass).connect(gain).connect(ctx.destination);
    src.start(); lfo.start();
    gain.gain.setTargetAtTime(0.11, ctx.currentTime, 2.5);

    return {
      ctx,
      async on()  { await ctx.resume(); },
      async off() { await ctx.suspend(); }
    };
  }

  async function setSound(onState) {
    if (onState && !audio) audio = createOceanAudio();
    if (!audio) return;
    if (onState) await audio.on(); else await audio.off();
    soundToggle.setAttribute("aria-pressed", String(onState));
  }

  soundToggle.addEventListener("click", () => {
    setSound(soundToggle.getAttribute("aria-pressed") !== "true");
  });

  /* -- Enter experience ----------------------------------------------------- */
  const enterBtn = document.getElementById("enterBtn");
  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
      if (!reduceMotion) setSound(true);
      document.getElementById("chapter-1")
        .scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* =======================================================================
     GSAP cinematics
     ======================================================================= */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Opening content drifts up and dissolves into the sea.
    gsap.to(".opening__content", {
      y: -90, autoAlpha: 0, ease: "none",
      scrollTrigger: { trigger: ".opening", start: "top top", end: "75% top", scrub: true }
    });

    // Deep parallax inside every clipped media frame.
    gsap.utils.toArray(".plx").forEach((wrap) => {
      const media = wrap.querySelector("img, video");
      if (!media) return;
      gsap.fromTo(media, { yPercent: -7 }, {
        yPercent: 7, ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    // Line art draws itself as its panel arrives (works in both layouts).
    let drawTriggers = [];
    function buildDraws(containerTween) {
      drawTriggers.forEach((t) => t.kill());
      drawTriggers = [];
      document.querySelectorAll(".draw").forEach((svg) => {
        svg.querySelectorAll("path, rect, line, circle, ellipse").forEach((el) => {
          const len = el.getTotalLength ? el.getTotalLength() : 0;
          if (!len) return;
          el.style.strokeDasharray = len;
          const tween = gsap.fromTo(el, { strokeDashoffset: len }, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: svg,
              containerAnimation: containerTween || undefined,
              start: containerTween ? "left 85%" : "top 80%",
              end: containerTween ? "left 30%" : "top 35%",
              scrub: 1
            }
          });
          drawTriggers.push(tween.scrollTrigger);
        });
      });
    }

    // Chapter 1 — pinned horizontal boarding gallery on wide screens.
    const board = document.getElementById("chapter-1");
    const boardPin = board.querySelector(".board__pin");
    const boardTrack = document.getElementById("boardTrack");
    let boardTween = null;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      board.classList.add("board--horizontal");
      const amount = () => Math.max(0, boardTrack.scrollWidth - window.innerWidth);
      boardTween = gsap.to(boardTrack, {
        x: () => -amount(), ease: "none",
        scrollTrigger: {
          trigger: boardPin,
          start: "top top",
          end: () => "+=" + amount(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      buildDraws(boardTween);
      return () => {
        board.classList.remove("board--horizontal");
        boardTween = null;
        buildDraws(null);
      };
    });
    mm.add("(max-width: 899px)", () => { buildDraws(null); });

    // The Reel — one pinned timeline that scrubs through the film's scenes:
    // horizontal travel, Ken Burns per still, crossfades, subtitle captions,
    // a cold grade at the iceberg, and a fade to black at the end.
    const reel = document.getElementById("reel");
    const strip = document.getElementById("reelStrip");
    if (reel && strip) {
      mm.add("(min-width: 820px)", () => {
        reel.classList.add("reel--film");
        const scenes = gsap.utils.toArray(strip.querySelectorAll(".scene"));
        const n = scenes.length;
        const HOLD = 7, MOVE = 3, SPAN = HOLD + MOVE;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: reel,
            start: "top top",
            end: () => "+=" + Math.round(n * window.innerHeight * 1.7),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        scenes.forEach((scene, i) => {
          const start = i * SPAN;

          // travel to this scene
          if (i > 0) {
            tl.to(strip, {
              xPercent: -(100 / n) * i,
              duration: MOVE,
              ease: "power1.inOut"
            }, start - MOVE);
          }

          // slow camera: Ken Burns on each still, crossfading down the stack
          const imgs = scene.querySelectorAll(".scene__stack img");
          imgs.forEach((img, j) => {
            tl.fromTo(img,
              { scale: 1.12, xPercent: j % 2 ? 2.5 : -2.5 },
              { scale: 1.22, xPercent: j % 2 ? -2.5 : 2.5, duration: SPAN, ease: "none" },
              Math.max(0, start - MOVE));
            if (j > 0) {
              tl.fromTo(img, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.5 },
                start + (HOLD / imgs.length) * j);
            }
          });

          // captions rise like subtitles, then clear before the next scene
          const bits = scene.querySelectorAll(".scene__eyebrow, .scene__title, .scene__count, .scene__line");
          bits.forEach((el, k) => {
            tl.fromTo(el, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9 },
              start + 0.4 + k * 0.85);
          });
          if (i < n - 1) {
            tl.to(scene.querySelector(".scene__caption"),
              { autoAlpha: 0, duration: 0.8 }, start + HOLD - 0.5);
          }
        });

        // the world turns cold at the iceberg…
        tl.fromTo(".reel__cold", { autoAlpha: 0 }, { autoAlpha: 0.55, duration: MOVE + 2 }, 2 * SPAN - MOVE);
        // …and the film fades to black at the very end
        tl.to(".reel__black", { autoAlpha: 1, duration: 2 }, n * SPAN - 2);

        return () => reel.classList.remove("reel--film");
      });
    }

    // Ending — credits roll like a film once they reach the screen.
    const credits = document.getElementById("credits");
    const roll = document.getElementById("creditsRoll");
    if (credits && roll) {
      credits.classList.add("credits--film");
      const rollDistance = () => Math.max(0, roll.scrollHeight - window.innerHeight * 0.42);
      gsap.fromTo(roll, { y: () => window.innerHeight }, {
        y: () => -rollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: credits,
          start: "top top",
          end: () => "+=" + (rollDistance() + window.innerHeight),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
    }

    ScrollTrigger.refresh();
  }

  onScroll();
})();
