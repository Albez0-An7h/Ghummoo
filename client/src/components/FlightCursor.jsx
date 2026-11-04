import { useEffect, useRef } from 'react';

/*
  FlightCursor: a small orange plane that replaces the pointer and leaves a fading,
  curved dotted flight path behind it.

  - Rendered on one fixed <canvas> (pointer-events: none). Pointer movement only writes to refs,
    so React never re-renders; drawing happens in requestAnimationFrame, and the loop sleeps
    once the trail has faded.
  - The plane sits exactly on the real pointer, so clicks stay precise. The trail is emitted by
    a softly lagging follower point, which is what gives the path its gentle curve.
  - Over links, buttons, inputs and other controls the plane steps aside and the native
    pointer/text cursor returns.
  - Only enabled for fine, hovering pointers (mouse/trackpad) and when reduced motion is off.
*/

const BRAND = '242, 106, 46'; // #F26A2E
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [role="tab"], [role="radio"], [role="checkbox"], [contenteditable="true"], [data-native-cursor]';

const DOT_SPACING = 11; // px of travel between dots
const DOT_LIFE = 750; // ms
const MAX_DOTS = 48;
const FOLLOW = 0.22; // follower easing per 60fps frame (lower = more lag and more curve)

const canEnable = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawPlane(ctx, x, y, angle, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  // Soft glow.
  ctx.shadowColor = `rgba(${BRAND}, 0.55)`;
  ctx.shadowBlur = 10;
  ctx.fillStyle = `rgb(${BRAND})`;
  // Top-view airliner, nose at (0,0) pointing along +x, ~17px long.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-1.6, -1.5, -4, -1.5);
  ctx.lineTo(-7, -7.5);
  ctx.lineTo(-9, -7.5);
  ctx.lineTo(-7.6, -1.5);
  ctx.lineTo(-12.5, -1.4);
  ctx.lineTo(-14.6, -4);
  ctx.lineTo(-15.8, -4);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-15.8, 4);
  ctx.lineTo(-14.6, 4);
  ctx.lineTo(-12.5, 1.4);
  ctx.lineTo(-7.6, 1.5);
  ctx.lineTo(-9, 7.5);
  ctx.lineTo(-7, 7.5);
  ctx.lineTo(-4, 1.5);
  ctx.quadraticCurveTo(-1.6, 1.5, 0, 0);
  ctx.closePath();
  ctx.fill();
  // Fine ivory outline so the plane reads on orange or photo backgrounds.
  ctx.shadowBlur = 0;
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'rgba(255, 247, 239, 0.9)';
  ctx.stroke();
  ctx.restore();
}

export default function FlightCursor() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canEnable()) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const root = document.documentElement;
    root.classList.add('flight-cursor');

    const s = {
      x: -100, y: -100, // real pointer
      fx: -100, fy: -100, // lagging follower (trail source)
      angle: -Math.PI / 4, // plane heading; rests pointing up-right like a cursor
      travel: 0,
      dots: [],
      visible: false, // pointer inside the window
      overControl: false, // pointer over an interactive element
      planeAlpha: 0,
      raf: 0,
      last: 0,
      started: false,
    };

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const frame = (now) => {
      const dt = Math.min(48, s.last ? now - s.last : 16);
      s.last = now;
      const k = 1 - (1 - FOLLOW) ** (dt / 16.67); // frame-rate independent easing

      // Follower eases toward the pointer and drops dots at even spacing along its path.
      const px = s.fx;
      const py = s.fy;
      s.fx += (s.x - s.fx) * k;
      s.fy += (s.y - s.fy) * k;
      const step = Math.hypot(s.fx - px, s.fy - py);
      if (s.visible && step > 0.05) {
        s.travel += step;
        while (s.travel >= DOT_SPACING) {
          s.travel -= DOT_SPACING;
          const t = step ? 1 - s.travel / step : 1;
          s.dots.push({ x: px + (s.fx - px) * Math.min(1, Math.max(0, t)), y: py + (s.fy - py) * Math.min(1, Math.max(0, t)), born: now });
          if (s.dots.length > MAX_DOTS) s.dots.shift();
        }
      }

      // Heading follows the direction of travel; at rest it eases back to the cursor angle.
      const dx = s.x - s.fx;
      const dy = s.y - s.fy;
      const moving = Math.hypot(dx, dy) > 1.5;
      const target = moving ? Math.atan2(dy, dx) : -Math.PI / 4;
      let diff = target - s.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      s.angle += diff * (moving ? 0.28 : 0.08) * (dt / 16.67);

      const wantPlane = s.visible && !s.overControl ? 1 : 0;
      s.planeAlpha += (wantPlane - s.planeAlpha) * Math.min(1, 0.25 * (dt / 16.67));

      // Draw.
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      s.dots = s.dots.filter((d) => now - d.born < DOT_LIFE);
      for (const d of s.dots) {
        const life = 1 - (now - d.born) / DOT_LIFE; // 1 → 0
        const eased = life * (2 - life) * life; // holds, then fades out smoothly
        ctx.beginPath();
        ctx.fillStyle = `rgba(${BRAND}, ${0.85 * eased})`;
        ctx.arc(d.x, d.y, 1 + 1.4 * eased, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.planeAlpha > 0.02) drawPlane(ctx, s.x, s.y, s.angle, s.planeAlpha);

      // Sleep when nothing is left to animate; the next pointer move wakes the loop.
      const settled = !s.dots.length && !moving && Math.abs(diff) < 0.01 && Math.abs(wantPlane - s.planeAlpha) < 0.02;
      s.raf = settled ? 0 : requestAnimationFrame(frame);
      if (settled) {
        s.last = 0;
        // Leave the final plane frame drawn.
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        if (wantPlane) drawPlane(ctx, s.x, s.y, s.angle, 1);
      }
    };
    const wake = () => { if (!s.raf) s.raf = requestAnimationFrame(frame); };

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      s.x = e.clientX;
      s.y = e.clientY;
      if (!s.started) { s.fx = s.x; s.fy = s.y; s.started = true; }
      s.visible = true;
      const el = e.target instanceof Element ? e.target : null;
      const control = el && el.closest(INTERACTIVE);
      s.overControl = Boolean(control && !control.hasAttribute('data-cursor-passthrough'));
      wake();
    };
    const onLeave = (e) => {
      if (!e.relatedTarget) { s.visible = false; wake(); }
    };
    const onHide = () => {
      if (document.hidden) { s.visible = false; s.dots = []; wake(); }
    };
    const onScroll = () => { s.fx = s.x; s.fy = s.y; s.travel = 0; }; // no stray streak when the page scrolls under the pointer

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave, { passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', resize);

    // Turn off live if the user switches input device or enables reduced motion.
    const mqs = [window.matchMedia('(hover: hover) and (pointer: fine)'), window.matchMedia('(prefers-reduced-motion: reduce)')];
    const onMedia = () => {
      const on = canEnable();
      root.classList.toggle('flight-cursor', on);
      canvas.style.display = on ? '' : 'none';
    };
    mqs.forEach((m) => m.addEventListener('change', onMedia));

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', resize);
      mqs.forEach((m) => m.removeEventListener('change', onMedia));
      root.classList.remove('flight-cursor');
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]" />;
}
