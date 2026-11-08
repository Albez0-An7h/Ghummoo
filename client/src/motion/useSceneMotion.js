/* Scroll motion for Ghumo scenes, built on GSAP + ScrollTrigger.

   Rules (docs/V0_1_MOTION_GUIDELINES.md):
   - Scrubbed to native scroll only: no pinning, no scroll-jacking, nothing blocks input.
   - transform and opacity only.
   - gsap.matchMedia gives three tiers: full (desktop), lite (phones, about half the travel and
     no continuous loops) and none (prefers-reduced-motion). It reverts automatically when a
     media query stops matching, and everything is reverted on unmount.
   - Content is visible by default; reveal tweens only run when motion is allowed. */
import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const MOTION_QUERIES = {
  full: '(prefers-reduced-motion: no-preference) and (min-width: 768px)',
  lite: '(prefers-reduced-motion: no-preference) and (max-width: 767.98px)',
  reduced: '(prefers-reduced-motion: reduce)',
};

const all = (root, sel) => Array.from(root.querySelectorAll(sel));

function sceneTimeline(root, scope, { travel, loops }) {
  const trigger = { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: 0.6 };

  // Parallax: deeper (nearer) layers travel further. Values are in SVG user units.
  all(root, '[data-depth]').forEach((el) => {
    const depth = Number(el.dataset.depth) || 0;
    gsap.fromTo(el, { y: depth * travel }, { y: -depth * travel, ease: 'none', scrollTrigger: trigger });
  });

  all(root, '[data-rise]').forEach((el) => gsap.fromTo(el, { y: travel * 0.6 }, { y: -travel * 0.2, ease: 'none', scrollTrigger: trigger }));
  all(root, '[data-sun]').forEach((el) => gsap.fromTo(el, { opacity: 0.05 }, { opacity: 0.6, ease: 'none', scrollTrigger: trigger }));
  all(root, '[data-draw]').forEach((el) => {
    const len = el.getTotalLength?.() || 1200;
    gsap.fromTo(el, { strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { ...trigger, end: 'center center' } });
  });

  if (!loops) return;
  // Slow ambient loops, paused whenever the scene is off screen.
  const ambient = [
    ...all(root, '[data-drift]').map((el, i) => gsap.to(el, { x: i % 2 ? -60 : 60, duration: 18 + i * 4, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true })),
    ...all(root, '[data-wave]').map((el, i) => gsap.to(el, { x: 24, duration: 3.2 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true })),
    // Rotation only: `y` belongs to the parallax tween on the same layer.
    ...all(root, '[data-bob]').map((el, i) => gsap.fromTo(el, { rotation: i % 2 ? -1.5 : 1.5 }, { rotation: i % 2 ? 1.5 : -1.5, transformOrigin: '50% 100%', duration: 2.4 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true })),
  ];
  ScrollTrigger.create({
    trigger: scope,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => ambient.forEach((t) => (self.isActive ? t.play() : t.pause())),
  });
}

/* Parallax + ambient motion for every scene inside `ref`. Each element with [data-scene] is
   its own trigger. */
export function useSceneMotion(ref, deps = []) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const run = (opts) => all(root, '[data-scene]').forEach((scene) => sceneTimeline(scene, scene, opts));
      mm.add(MOTION_QUERIES.full, () => run({ travel: 70, loops: true }));
      mm.add(MOTION_QUERIES.lite, () => run({ travel: 30, loops: false }));
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* Reveal [data-reveal] children as they scroll into view (once). Items stagger within their
   [data-reveal-group]. Without motion they are simply visible. */
export function useReveal(ref, deps = []) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const groups = all(root, '[data-reveal-group]');
        groups.forEach((g) => {
          const items = all(g, '[data-reveal]');
          if (!items.length) return;
          gsap.from(items, {
            y: 28, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08,
            scrollTrigger: { trigger: g, start: 'top 85%', once: true },
          });
        });
        // Delhi-style hand-off: a scene fades and lifts as its trip cards arrive.
        all(root, '[data-handoff]').forEach((el) => {
          gsap.to(el, { opacity: 0.35, scale: 0.96, transformOrigin: '50% 100%', ease: 'none', scrollTrigger: { trigger: el.dataset.handoff ? root.querySelector(el.dataset.handoff) : el, start: 'top 70%', end: 'top 25%', scrub: 0.5 } });
        });
      });
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const refreshScroll = () => ScrollTrigger.refresh();
