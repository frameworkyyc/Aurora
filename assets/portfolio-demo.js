/* Portfolio Demo Mode
   ---------------------------------------------------------------------------
   Loaded by app.js ONLY when the page is opened with ?portfolioDemo=1. A normal
   visitor never requests this file.

   Purpose: the Framework portfolio embeds the live Aurora homepage in an iframe
   inside a device mockup. Framework cannot drive a cross-origin iframe, so the
   page runs its own presentation: it scrolls the real site, section by section,
   and lets Aurora's own scroll-driven animations do the work. Nothing here
   redraws or re-implements an animation.

   The whole mode is this one self-contained module:
     - locks the page against visitor input (no scrolling, links, forms, focus)
     - runs one requestAnimationFrame loop that tweens window scroll between
       positions worked out from the live layout, so the same URL suits both a
       desktop and a phone-sized frame
     - stops while the tab is hidden or the frame is off screen
     - fades to the start and replays the entrance when the loop ends
     - with prefers-reduced-motion, does not scroll at all: it holds the hero
   No postMessage, no eval, no HTML injection, no dependencies.            */
(function(){
  'use strict';
  var root = document.documentElement;
  var hero = document.getElementById('top');
  if(!hero || window.__portfolioDemoStarted) return;      /* homepage only, once */
  window.__portfolioDemoStarted = true;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone  = window.matchMedia('(max-width:860px)');

  /* ---- 1. lock the page: it is a presentation, not a browser -------------- */
  var css = document.createElement('style');
  css.textContent =
    'html.portfolio-demo{overflow:hidden !important;scroll-behavior:auto !important;overscroll-behavior:none}' +
    'html.portfolio-demo,html.portfolio-demo *{pointer-events:none !important;cursor:default !important;' +
      '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}' +
    '.pd-curtain{position:fixed;inset:0;z-index:2147483000;background:#071A24;opacity:0;' +
      'pointer-events:none;transition:opacity .5s ease}' +
    'html.pd-fade .pd-curtain{opacity:1}';
  document.head.appendChild(css);
  root.classList.add('portfolio-demo');
  try{ history.scrollRestoration = 'manual'; }catch(e){}

  /* belt and braces for anything that still reaches the page by keyboard or
     assistive input: links, forms, focus and scroll keys are all swallowed */
  function stop(e){ e.preventDefault(); e.stopPropagation(); }
  ['click','auxclick','dblclick','submit','contextmenu','dragstart','keydown','keypress'].forEach(function(t){
    document.addEventListener(t, stop, true);
  });
  document.addEventListener('focusin', function(e){
    if(e.target && e.target.blur) e.target.blur();
  }, true);

  window.scrollTo(0, 0);
  if(reduce) return;                       /* reduced motion: a stable hero, no loop */

  /* ---- 2. the sequence ------------------------------------------------------ */
  function el(id){ return document.getElementById(id); }
  function absTop(node){ return node.getBoundingClientRect().top + window.pageYOffset; }
  function clampY(y){
    var max = Math.max(0, root.scrollHeight - window.innerHeight);
    return y < 0 ? 0 : y > max ? max : y;
  }

  /* The scroll range over which a section's own animation plays. These mirror
     how app.js measures each section's progress, so a fraction f of the span is
     the same fraction of the animation:
       wide screens   the section is pinned: top -> bottom less one screen
       phones         progress runs from the section entering to leaving, except
                      the reality-capture drawing, which pins at the top      */
  function span(id){
    var s = el(id), T = absTop(s), h = s.offsetHeight, vh = window.innerHeight;
    if(!phone.matches) return [T, T + h - vh];
    if(id === 'capture'){
      var pin = s.querySelector('.capture-sticky');
      return [T, T + h - (pin ? pin.offsetHeight : vh)];
    }
    return [T - vh * 0.3, T + h - vh];
  }
  function at(id, f){ return function(){ var r = span(id); return clampY(r[0] + (r[1] - r[0]) * f); }; }
  function intro(){ return clampY(absTop(el('intro')) - window.innerHeight * 0.12); }

  /* view the section -> its animation plays -> pause -> glide to the next.
     dur is the glide in ms, dwell the pause in ms. About 28 seconds in all, with the fade back to the start. */
  var STEPS = [
    {y:function(){ return 0; },   dur:0,    dwell:3000},   /* hero: badge, aurora, readouts */
    {y:intro,                     dur:1000, dwell:1500},   /* headline resolves line by line */
    {y:at('setup',   0),          dur:1100, dwell:400},    /* total station, stage 1 */
    {y:at('setup',   0.5),        dur:2100, dwell:300},    /*   stage 2 */
    {y:at('setup',   1),          dur:2100, dwell:600},    /*   stage 3 */
    {y:at('where',   0),          dur:1000, dwell:400},    /* where we work: the traverse */
    {y:at('where',   0.5),        dur:2000, dwell:300},
    {y:at('where',   1),          dur:2000, dwell:600},
    {y:at('capture', 0),          dur:1000, dwell:400},    /* reality capture: point cloud */
    {y:at('capture', 0.5),        dur:2200, dwell:300},
    {y:at('capture', 1),          dur:2200, dwell:1000},
    {restart:true}
  ];

  function ease(k){ return k < 0.5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3) / 2; }

  /* ---- 3. replaying the entrance on each loop ------------------------------
     Aurora reveals things once. When the loop returns to the top, under the
     curtain, put those classes back so the real entrance plays again. */
  var replayIO = null;
  function resetEntrance(){
    var rv = [].slice.call(document.querySelectorAll('.rv.in'));
    if(rv.length && 'IntersectionObserver' in window){
      if(!replayIO){
        replayIO = new IntersectionObserver(function(es){
          es.forEach(function(e){
            if(e.isIntersecting){ e.target.classList.add('in'); replayIO.unobserve(e.target); }
          });
        }, {threshold:.14, rootMargin:'0px 0px -8% 0px'});
      }
      rv.forEach(function(n){ n.classList.remove('in'); replayIO.observe(n); });
    }
    var introEl = el('intro');
    if(introEl) introEl.classList.remove('lines-in');      /* app.js adds it back on view */
    hero.classList.remove('stage-ready');
    requestAnimationFrame(function(){ hero.classList.add('stage-ready'); });
  }

  /* ---- 4. one loop, paused whenever nobody can see it ---------------------- */
  var curtain = document.createElement('div');
  curtain.className = 'pd-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(curtain);

  var ready = document.readyState === 'complete';
  if(!ready) window.addEventListener('load', function(){ ready = true; }, {once:true});

  var i = 0, phase = 'wait', t = 0, from = 0, to = 0, last = 0, raf = 0;

  function begin(n){
    i = n; t = 0;
    var s = STEPS[n];
    if(s.restart){ phase = 'fadeOut'; root.classList.add('pd-fade'); return; }
    from = window.pageYOffset; to = s.y();
    phase = s.dur > 0 ? 'move' : 'dwell';
  }

  function tick(now){
    raf = 0;
    if(!active) return;
    var dt = last ? Math.min(now - last, 50) : 16;       /* a long gap is a pause, not progress */
    last = now;
    if(phase === 'wait'){
      if(ready){ t += dt; if(t >= 700) begin(0); }       /* let the entrance land first */
    } else {
      t += dt;
      var s = STEPS[i];
      if(phase === 'move'){
        var k = Math.min(1, t / s.dur);
        window.scrollTo(0, from + (to - from) * ease(k));
        if(k >= 1){ phase = 'dwell'; t = 0; }
      } else if(phase === 'dwell'){
        if(t >= s.dwell) begin(i + 1);
      } else if(phase === 'fadeOut'){
        if(t >= 560){ window.scrollTo(0, 0); resetEntrance(); phase = 'settle'; t = 0; }
      } else if(phase === 'settle'){
        if(t >= 260){ root.classList.remove('pd-fade'); phase = 'fadeIn'; t = 0; }
      } else if(phase === 'fadeIn'){
        if(t >= 700) begin(0);
      }
    }
    if(active) raf = requestAnimationFrame(tick);
  }

  var inView = true, active = false;
  function sync(){
    var next = !document.hidden && inView;
    if(next === active) return;
    active = next;
    if(active){ last = 0; if(!raf) raf = requestAnimationFrame(tick); }
    else if(raf){ cancelAnimationFrame(raf); raf = 0; }
  }
  document.addEventListener('visibilitychange', sync);

  /* a one-pixel fixed marker: when the frame is scrolled out of the portfolio
     page, or the page is not on screen, the loop stands still */
  var mark = document.createElement('div');
  mark.setAttribute('aria-hidden', 'true');
  mark.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(mark);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      inView = es[es.length - 1].isIntersecting;
      sync();
    }, {threshold:0}).observe(mark);
  }
  sync();
})();
