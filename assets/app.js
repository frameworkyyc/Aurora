/* ---- how far a scroll-driven section has run --------------------------
   On a wide screen a section is pinned, so its run starts when its top meets
   the top of the window: the drawing is already in place before it begins.
   On a phone nothing is pinned for long enough to read that way, so the run
   starts the moment the section appears over the bottom edge and finishes at
   the same place as before. The animation then plays while the section is
   travelling up the screen rather than only once it has arrived. */
/* progress through a section whose drawing pins to the top of the screen on a
   phone: 0 when it pins, 1 when the last note has passed */
/* the aurora blades of the badge, measured off the artwork (x, width, foot
   and tip, as fractions of the badge). Shared by the phone badge and the
   wide-screen hero so both draw the same mark. */
window.__AURORA_BLADES = [{"x": 0.06441, "w": 0.02278, "base": 0.65708, "tip": 0.21239}, {"x": 0.10448, "w": 0.02435, "base": 0.64233, "tip": 0.21313}, {"x": 0.14611, "w": 0.02435, "base": 0.62316, "tip": 0.28614}, {"x": 0.18814, "w": 0.02357, "base": 0.60398, "tip": 0.24779}, {"x": 0.22977, "w": 0.02357, "base": 0.60029, "tip": 0.34218}, {"x": 0.2718, "w": 0.02435, "base": 0.61578, "tip": 0.29572}, {"x": 0.31383, "w": 0.02357, "base": 0.64676, "tip": 0.31416}, {"x": 0.35467, "w": 0.02357, "base": 0.64971, "tip": 0.33112}, {"x": 0.3967, "w": 0.02435, "base": 0.66003, "tip": 0.26475}, {"x": 0.43833, "w": 0.02435, "base": 0.691, "tip": 0.20133}, {"x": 0.47997, "w": 0.02435, "base": 0.71018, "tip": 0.24853}, {"x": 0.5216, "w": 0.02435, "base": 0.71976, "tip": 0.05826}, {"x": 0.56324, "w": 0.02435, "base": 0.72714, "tip": 0.13053}, {"x": 0.60487, "w": 0.02435, "base": 0.73525, "tip": 0.08112}, {"x": 0.6465, "w": 0.02435, "base": 0.73378, "tip": 0.00074}, {"x": 0.68814, "w": 0.02435, "base": 0.73083, "tip": 0.0}, {"x": 0.72977, "w": 0.02435, "base": 0.72861, "tip": 0.0354}, {"x": 0.77141, "w": 0.02435, "base": 0.70796, "tip": 0.04351}, {"x": 0.81304, "w": 0.02435, "base": 0.71386, "tip": 0.18805}, {"x": 0.85507, "w": 0.02357, "base": 0.72861, "tip": 0.27139}, {"x": 0.89631, "w": 0.02435, "base": 0.7382, "tip": 0.33038}, {"x": 0.9348, "w": 0.02278, "base": 0.7441, "tip": 0.36726}];

window.__pinProgress = function(el, pin){
  var r = el.getBoundingClientRect();
  var span = el.offsetHeight - (pin ? pin.offsetHeight : window.innerHeight);
  return span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
};
window.__sectionProgress = function(el){
  var r = el.getBoundingClientRect();
  var vh = window.innerHeight;
  if(window.matchMedia('(max-width:860px)').matches){
    var h = el.offsetHeight;
    return h > 0 ? Math.max(0, Math.min(1, (vh - r.top) / h)) : 0;
  }
  var span = el.offsetHeight - vh;
  return span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
};

(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function(v,a,b){ return v<a?a:v>b?b:v; };

  /* ---- gentle parallax on project photography ---- */
  if(!reduce){
    /* named apart from the hero's shooting stars: both live in this scope and
       a shared name left each clobbering the other */
    var plates = [].slice.call(document.querySelectorAll('.proj-media img'));
    var ticking = false;
    var shift = function(){
      var vh = window.innerHeight;
      plates.forEach(function(img){
        var r = img.getBoundingClientRect();
        if(r.bottom < -100 || r.top > vh+100) return;
        var c = (r.top + r.height/2 - vh/2) / vh;
        img.style.transform = 'translate3d(0,'+(c*-18).toFixed(1)+'px,0) scale(1.10)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function(){
      if(!ticking){ ticking = true; requestAnimationFrame(shift); }
    },{passive:true});
    shift();
  }

  /* ---- scroll reveal ---- */
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e,i){
        if(e.isIntersecting){
          e.target.style.transitionDelay = Math.min(i*70,210) + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },{threshold:.14,rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){ io.observe(el); });
  } else {
    rv.forEach(function(el){ el.classList.add('in'); });
  }
})();

/* ---- the safety figures roll up like a mechanical counter ---- */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = [].slice.call(document.querySelectorAll('[data-roll]'));
  if(!els.length) return;
  var DH = 1.06;   /* digit height, in em, matching .reel */

  els.forEach(function(el){
    var value = el.getAttribute('data-roll');
    var suffix = el.getAttribute('data-suffix') || '';
    el.setAttribute('aria-label', value + suffix);
    el.textContent = '';
    var reels = [];
    value.split('').forEach(function(d, i){
      var reel = document.createElement('span');
      reel.className = 'reel';
      reel.setAttribute('aria-hidden','true');
      var strip = document.createElement('span');
      strip.className = 'reel-strip';
      for(var c=0;c<6;c++){
        for(var n=0;n<10;n++){
          var line = document.createElement('i');
          line.textContent = n;
          strip.appendChild(line);
        }
      }
      reel.appendChild(strip);
      el.appendChild(reel);
      reels.push({strip:strip, d:parseInt(d,10), i:i});
    });
    if(suffix){
      var sfx = document.createElement('span');
      sfx.className = 'suffix';
      sfx.setAttribute('aria-hidden','true');
      sfx.textContent = suffix;
      el.appendChild(sfx);
    }
    el._reels = reels;
  });

  function roll(el, delay){
    if(el._done) return;
    el._done = true;
    el._reels.forEach(function(r){
      /* leading digits spin further, so the number settles left to right */
      var cycles = reduce ? 0 : 2 + (el._reels.length - 1 - r.i);
      var off = (cycles*10 + r.d) * DH;
      if(reduce){
        r.strip.style.transition = 'none';
        r.strip.style.transform = 'translateY(-' + off.toFixed(4) + 'em)';
      } else {
        r.strip.style.transitionDuration = (1.15 + r.i*0.16).toFixed(2) + 's';
        r.strip.style.transitionDelay = (delay/1000 + r.i*0.07).toFixed(2) + 's';
        requestAnimationFrame(function(){
          r.strip.style.transform = 'translateY(-' + off.toFixed(4) + 'em)';
        });
      }
    });
    setTimeout(function(){ el.classList.add('rolled'); }, reduce ? 0 : delay + 700);
  }

  var band = document.querySelector('.stats');
  function go(){ els.forEach(function(el,i){ roll(el, reduce ? 0 : i*160); }); }

  if(reduce || !band || !('IntersectionObserver' in window)){ go(); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ go(); io.disconnect(); }
    });
  },{threshold:0.35});
  io.observe(band);
})();
/* ---- mobile navigation ---- */
(function(){
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if(!btn || !nav) return;
  var hdr = btn.closest('header'), lab = btn.querySelector('.vh');
  function set(open){
    nav.classList.toggle('open', open);
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if(lab) lab.textContent = open ? 'Close' : 'Menu';
    if(hdr) hdr.classList.toggle('menu-open', open);
  }
  btn.addEventListener('click', function(){ set(!nav.classList.contains('open')); });
  nav.addEventListener('click', function(e){ if(e.target.tagName === 'A') set(false); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && nav.classList.contains('open')){ set(false); btn.focus(); } });
  window.matchMedia('(min-width:861px)').addEventListener && window.matchMedia('(min-width:861px)').addEventListener('change', function(m){ if(m.matches) set(false); });
})();

/* ---- enquiry form: composes an email, so it works with no backend ---- */
(function(){
  var form = document.getElementById('enquiry');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var get = function(n){ var el = form.elements[n]; return el ? el.value.trim() : ''; };
    var name = get('name'), org = get('org'), phone = get('phone');
    var site = get('site'), message = get('message');
    var subject = 'Project enquiry' + (org ? ' — ' + org : '');
    var body = [
      name ? 'Name: ' + name : '',
      org ? 'Company: ' + org : '',
      phone ? 'Phone: ' + phone : '',
      site ? 'Project location: ' + site : '',
      '',
      message
    ].filter(Boolean).join('\n');
    window.location.href = 'mailto:info@aurorasurveys.ca?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();


/* ---- the surveyor on the ridge: a transparent, looping animation ----
   The slot in the markup (.wr-anim) names the files and where the scene's
   ground point sits in the mountain SVG's own coordinates, so it scales and
   crops with the range at every width. Near the screen, the still (the
   loop's first frame) is shown in place of the static SVG figure, then the
   video plays over it from that same frame.
   Chrome, Edge and Firefox play VP9 WebM with a real alpha channel. Safari
   (and every iOS browser, all WebKit) cannot decode VP9 alpha, so it gets an
   H.264 copy of the same white-on-black frames, blended with
   mix-blend-mode:screen: black adds nothing, white stays white, so the
   background disappears without an alpha channel. The loop pauses off
   screen and in a hidden tab; with reduced motion only the still is shown.
   With no files set, the static SVG figure stays. */
(function(){
  var slot = document.querySelector('.wr-anim');
  var band = slot && slot.closest('.wwd-ridge');
  var svg = band && band.querySelector('svg');
  if(!slot || !svg) return;
  var d = slot.dataset;
  var webm = (d.webm || '').trim(), mp4 = (d.mp4 || '').trim(), poster = (d.poster || '').trim();
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!poster && !webm && !mp4) return;                        /* nothing supplied */
  if(reduce && !poster) return;

  var anchor = (d.anchor || '1488 108').split(/\s+/).map(Number);
  var foot = (d.foot || '0.5 0.98').split(/\s+/).map(Number);
  var unitsW = +d.width || 80, aspect = +d.aspect || 1;       /* width / height */

  function place(){
    var m = svg.getScreenCTM(), r = band.getBoundingClientRect();
    if(!m || !r.width) return;
    var w = unitsW * m.a, h = w / aspect;
    var fx = m.e + anchor[0] * m.a - r.left, fy = m.f + anchor[1] * m.d - r.top;
    slot.style.setProperty('--wr-w', w.toFixed(1) + 'px');
    slot.style.setProperty('--wr-h', h.toFixed(1) + 'px');
    slot.style.setProperty('--wr-x', (fx - w * foot[0]).toFixed(1) + 'px');
    slot.style.setProperty('--wr-y', (fy - h * foot[1]).toFixed(1) + 'px');
  }
  place();
  if('ResizeObserver' in window) new ResizeObserver(place).observe(band);
  window.addEventListener('resize', place);

  function show(){ slot.classList.add('is-on'); band.classList.add('anim-on'); }

  /* WebKit (Safari, and all browsers on iOS) gets the blended H.264 copy */
  var webkit = /Apple/.test(navigator.vendor || '');
  var probe = document.createElement('video');
  var useWebm = !!webm && !webkit && !!probe.canPlayType && probe.canPlayType('video/webm; codecs="vp9"') !== '';
  var src = useWebm ? webm : mp4;
  /* Safari's H.264 copy has no alpha, so it is blended; Firefox gets the same
     blend on the WebM in case its decoder drops the alpha channel. Screen
     leaves real transparency unchanged, so it is harmless where alpha works.
     Chrome and Edge are left exactly as they were. */
  if(!useWebm || /Firefox\//.test(navigator.userAgent)) slot.classList.add('is-blend');

  var still = null, v = null, started = false, inView = false;
  function start(){
    if(started) return;
    started = true;
    if(poster){
      still = new Image();
      still.alt = ''; still.decoding = 'async';
      still.onload = show;
      still.src = poster;
      slot.appendChild(still);
    }
    if(reduce || !src) return;                                 /* a still, never motion */
    v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.disablePictureInPicture = true; v.preload = 'auto';
    v.addEventListener('playing', function(){ show(); slot.classList.add('is-playing'); }, {once:true});
    v.src = src;
    slot.appendChild(v);
  }
  function sync(){
    if(inView) start();
    if(!v) return;
    if(inView && !document.hidden){
      var pr = v.play(); if(pr && pr.catch) pr.catch(function(){});
    } else if(!v.paused){ v.pause(); }
  }
  document.addEventListener('visibilitychange', sync);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ inView = es[es.length-1].isIntersecting; sync(); },
      {rootMargin:'200px 0px'}).observe(band);
  } else { inView = true; sync(); }
})();

/* (The industries rail lives in assets/industries.js, a separate script, so nothing else on the page can stop it from loading.) */

/* ---- careers enquiry: composes an email, like the project enquiry ---- */
(function(){
  var form = document.getElementById('careers-form');
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var get = function(n){ var el = form.elements[n]; return el ? el.value.trim() : ''; };
    var name = get('name'), email = get('email'), phone = get('phone');
    var area = get('area'), message = get('message');
    var subject = 'Careers enquiry' + (name ? ' \u2014 ' + name : '');
    var body = [
      name ? 'Name: ' + name : '',
      email ? 'Email: ' + email : '',
      phone ? 'Phone: ' + phone : '',
      area ? 'Area of interest: ' + area : '',
      '',
      message
    ].filter(Boolean).join('\n');
    window.location.href = 'mailto:info@aurorasurveys.ca?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();

/* ---- the wordmark is already the hero; the header only takes it over
        once the hero has scrolled away ---- */
(function(){
  var stage  = document.getElementById('top');
  var header = document.querySelector('header');
  if(!stage || !header) return;              /* inner pages keep the logo always */
  header.classList.add('hero-page');

  var badge = stage.querySelector('.badge-live');
  var isStatic = function(){ return !!(badge && badge.offsetWidth); };

  function past(){
    if(isStatic()){
      /* mobile: the badge itself has to clear the header */
      return badge.getBoundingClientRect().bottom <= header.offsetHeight;
    }
    /* wide screen: the logo arrives once the hero, wordmark and all, has
       scrolled up past the bar */
    return stage.getBoundingClientRect().bottom <= header.offsetHeight;
  }

  var on = null, ticking = false;
  function update(){
    var v = past();
    if(v !== on){ on = v; header.classList.toggle('brand-on', v); }
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, {passive:true});
  window.addEventListener('resize', update);
  update();
})();


/* ---- the mountain breaks drift as they pass, back range slower than front ---- */
(function(){
  var ridges = [].slice.call(document.querySelectorAll('.ridge'));
  if(!ridges.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide   = window.matchMedia('(min-width:861px)');
  if(reduce) return;

  var parts = ridges.map(function(r){
    return {el:r, back:r.querySelector('.ridge-back'), front:r.querySelector('.ridge-front')};
  });

  var ticking = false;
  function frame(){
    var vh = window.innerHeight;
    for(var i=0;i<parts.length;i++){
      var p = parts[i];
      if(!p.back) continue;
      var r = p.el.getBoundingClientRect();
      if(r.bottom < -120 || r.top > vh + 120) continue;
      /* -1 below the fold, +1 above it */
      var t = 1 - (r.top + r.height/2) / vh * 2;
      p.back.setAttribute('transform',  'translate(' + (t*17).toFixed(2) + ',' + (t*-2.4).toFixed(2) + ')');
      p.front.setAttribute('transform', 'translate(' + (t*-7).toFixed(2) + ',0)');
    }
    ticking = false;
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(frame); } }

  function bind(){
    if(wide.matches) return;
    window.addEventListener('scroll', onScroll, {passive:true});
    frame();
  }
  bind();
  window.addEventListener('resize', function(){ if(!wide.matches) frame(); });
})();


/* ---- the badge's aurora, alive: blades breathe and drift in colour,
        feet pinned to the mountain line so the mark stays the mark ---- */
(function(){
  var wrap = document.querySelector('.badge-live');
  var cv   = wrap && wrap.querySelector('.badge-lights');
  if(!wrap || !cv) return;
  /* hidden on a wide screen: start the first time it is shown instead, for
     a tablet that loads in landscape and is then turned to portrait */
  if(!wrap.offsetWidth){
    var later = function(){
      if(!wrap.offsetWidth) return;
      window.removeEventListener('resize', later);
      boot();
    };
    window.addEventListener('resize', later);
    return;
  }
  boot();
  function boot(){
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the frame's top rail sits at 0.111 of the badge and is open between
     0.496 and 0.798 — only blades under that opening may pass it */
  var RAIL_Y = 0.1111, GAP_L = 0.512, GAP_R = 0.782;

  var BLADES = window.__AURORA_BLADES;

  var W=0,H=0,dpr=1,t=0,raf=0,live=false;
  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = wrap.clientWidth; H = wrap.clientHeight;
    if(!W||!H) return;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  /* smooth, seedless wobble so no two blades move together */
  function wave(x){ return Math.sin(x)*0.55 + Math.sin(x*1.7+1.3)*0.30 + Math.sin(x*2.9+3.1)*0.15; }

  /* the mountain is defined by where the blades stop, so fit a smooth curve
     through their feet and sit every blade on it */
  var FEET = BLADES.map(function(b){ return {x:b.x, y:b.base}; });
  function foot(u){
    var n = FEET.length;
    if(u <= FEET[0].x)   return FEET[0].y;
    if(u >= FEET[n-1].x) return FEET[n-1].y;
    var i = 0;
    while(i < n-2 && FEET[i+1].x < u) i++;
    var p0 = FEET[Math.max(0,i-1)], p1 = FEET[i], p2 = FEET[i+1], p3 = FEET[Math.min(n-1,i+2)];
    var tt = (u - p1.x) / (p2.x - p1.x || 1);
    /* Catmull-Rom through the four neighbouring feet */
    var t2 = tt*tt, t3 = t2*tt;
    return 0.5*((2*p1.y) + (-p0.y + p2.y)*tt +
                (2*p0.y - 5*p1.y + 4*p2.y - p3.y)*t2 +
                (-p0.y + 3*p1.y - 3*p2.y + p3.y)*t3);
  }

  function draw(){
    if(!W||!H) return;
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<BLADES.length;i++){
      var b = BLADES[i];

      /* one long crest sweeping left to right, with a slower swell under it,
         so the curtain moves as a sheet rather than as separate blades */
      var travel = t*0.42 - b.x*6.4;
      var swell  = 0.66*Math.sin(travel) + 0.34*Math.sin(travel*0.47 + t*0.14);
      var swing  = b.tip < 0.04 ? 0.22 : 0.32;
      var breathe = 1 + swing*swell;

      var cx = b.x*W, bw = b.w*W;
      var yb = foot(b.x)*H;
      var len = (b.base - b.tip)*H*breathe;
      /* blades stop under the rail unless they sit in the opening */
      var inGap = (b.x - b.w*0.5) > GAP_L && (b.x + b.w*0.5) < GAP_R;
      var ceilingY = (inGap ? 0.004 : RAIL_Y + 0.040) * H;
      var yt = Math.max(ceilingY, yb - len);

      /* colour: green at the foot always, the point drifting up through
         teal and cyan into blue and violet, as a real curtain does */
      var s1 = 0.5 + 0.5*Math.sin(t*0.20 - b.x*4.2);       /* colour band drifting across */
      var s2 = 0.5 + 0.5*Math.sin(t*0.09 + 1.1);            /* slow wash over the whole curtain */
      /* shaped so the curtain sits green most of the time and swings hard into
         blue and violet now and then, rather than living in the middle */
      var raw = Math.max(0, Math.min(1, 0.62*s1 + 0.55*s2 - 0.09));
      var mix = Math.pow(raw, 2.0);
      var hueTip = 116 + 190*mix;                           /* green -> teal -> blue -> violet */
      var hueMid = 120 + 96*Math.pow(mix, 1.4);
      var g = ctx.createLinearGradient(0,yb,0,yt);
      g.addColorStop(0,    'hsl(' + (132 + 10*mix).toFixed(1) + ',48%,' + (32 + 7*mix).toFixed(1) + '%)');
      g.addColorStop(0.46, 'hsl(' + hueMid.toFixed(1) + ',' + (56 + 16*mix).toFixed(1) + '%,' + (51 + 6*mix).toFixed(1) + '%)');
      g.addColorStop(1,    'hsl(' + hueTip.toFixed(1) + ',' + (62 + 26*mix).toFixed(1) + '%,' + (76 - 8*mix).toFixed(1) + '%)');
      ctx.fillStyle = g;

      /* the foot is cut by the mountain, so curve it along the ridge */
      var half = bw/2, STEPS = 6;
      ctx.beginPath();
      ctx.moveTo(cx - half, foot(b.x - b.w/2)*H);
      for(var k=1;k<=STEPS;k++){
        var fx = b.x - b.w/2 + b.w*(k/STEPS);
        ctx.lineTo(cx - half + bw*(k/STEPS), foot(fx)*H);
      }
      ctx.lineTo(cx + bw*0.045, yt);
      ctx.lineTo(cx - bw*0.045, yt);
      ctx.closePath();
      ctx.fill();
    }
  }

  function loop(){
    t += 0.016;
    draw();
    raf = live ? requestAnimationFrame(loop) : 0;
  }
  function start(){ if(!raf && !reduce){ live=true; raf=requestAnimationFrame(loop); } }
  function stop(){ live=false; if(raf){ cancelAnimationFrame(raf); raf=0; } }

  window.addEventListener('resize', function(){ resize(); draw(); });
  resize(); draw();

  if(reduce) return;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ e.isIntersecting ? start() : stop(); });
    },{threshold:0}).observe(wrap);
  } else start();
  }
})();

/* ---- wide-screen hero: the official Badge SHORT, its aurora alive ----
   The frame, wordmark and SURVEYS are the supplied vector artwork, shown as
   it is. The 24 aurora lines are the same artwork's own paths, drawn here on a
   canvas the size of the badge so they can move: every line keeps its shape,
   its place in the row and the slanted foot cut by the mountain edge, and
   only its length changes, with the foot held fixed. The movement and colour
   shift are the badge's original ones: one long crest sweeping left to right
   with a slower swell under it, and tips drifting from green through bright
   blue to purple (the brand's green, Bright Blue and Purple). As in the logo,
   only the tall lines that stand in the gap of the frame's top rail may rise
   above it. Wide screens only; with reduced motion it is drawn once and holds. */
window.__BADGE_SHORT = {"w":199.143,"h":157.475,"blades":[{"pts":[[10.469,86.535],[10.701,86.45],[10.937,86.363],[11.177,86.275],[11.422,86.186],[11.67,86.096],[11.923,86.004],[12.18,85.911],[12.442,85.817],[12.708,85.721],[12.979,85.624],[13.254,85.526],[13.535,85.426],[13.632,85.39],[13.729,85.355],[13.827,85.319],[13.925,85.282],[14.024,85.246],[14.122,85.208],[14.221,85.171],[14.32,85.133],[14.418,85.095],[14.517,85.056],[14.616,85.016],[14.715,84.977],[12.641,51.324]],"fx0":10.25,"step":0.25,"foot":[86.535,86.524,86.432,86.34,86.249,86.157,86.067,85.976,85.886,85.796,85.706,85.616,85.527,85.438,85.347,85.254,85.16,85.062,84.977],"ymin":51.324},{"pts":[[17.961,83.547],[18.317,83.374],[18.674,83.198],[19.031,83.019],[19.389,82.839],[19.748,82.655],[20.107,82.47],[20.466,82.283],[20.826,82.094],[21.185,81.903],[21.544,81.71],[21.903,81.516],[22.262,81.32],[20.176,45.348]],"fx0":17.75,"step":0.25,"foot":[83.547,83.528,83.406,83.283,83.16,83.035,82.909,82.782,82.654,82.525,82.396,82.265,82.134,82.001,81.868,81.734,81.599,81.463,81.327,81.32],"ymin":45.348},{"pts":[[25.539,79.484],[25.899,79.279],[26.257,79.073],[26.613,78.868],[26.968,78.664],[27.321,78.461],[27.672,78.259],[28.022,78.058],[28.369,77.858],[28.715,77.66],[29.058,77.463],[29.399,77.268],[29.738,77.074],[27.711,43.352]],"fx0":25.5,"step":0.25,"foot":[79.484,79.364,79.22,79.077,78.933,78.79,78.646,78.502,78.358,78.214,78.07,77.926,77.783,77.639,77.496,77.353,77.21,77.074],"ymin":43.352},{"pts":[[33.105,75.219],[33.48,75.023],[33.849,74.832],[34.212,74.649],[34.57,74.471],[34.922,74.301],[35.268,74.138],[35.608,73.982],[35.942,73.833],[36.269,73.693],[36.59,73.56],[36.904,73.436],[37.211,73.32],[35.25,52.578]],"fx0":33.0,"step":0.25,"foot":[75.219,75.143,75.012,74.883,74.756,74.63,74.506,74.384,74.264,74.146,74.031,73.919,73.808,73.701,73.597,73.497,73.4,73.32],"ymin":52.578},{"pts":[[40.684,72.785],[40.721,72.792],[40.751,72.797],[40.781,72.803],[41.066,72.888],[41.349,72.972],[41.649,73.061],[41.966,73.155],[42.298,73.252],[42.644,73.354],[43.004,73.46],[43.377,73.569],[43.761,73.683],[44.156,73.799],[44.562,73.92],[44.977,74.043],[42.785,43.809]],"fx0":40.5,"step":0.25,"foot":[72.785,72.797,72.868,72.943,73.017,73.091,73.165,73.238,73.312,73.385,73.459,73.532,73.606,73.679,73.753,73.827,73.901,73.976,74.043],"ymin":43.809},{"pts":[[48.316,75.055],[48.664,75.163],[49.011,75.271],[49.359,75.381],[49.707,75.491],[50.055,75.603],[50.401,75.714],[50.747,75.827],[51.091,75.94],[51.433,76.053],[51.773,76.166],[52.111,76.28],[52.445,76.395],[50.32,52.961]],"fx0":48.25,"step":0.25,"foot":[75.055,75.112,75.19,75.268,75.347,75.426,75.505,75.585,75.666,75.746,75.828,75.91,75.992,76.075,76.159,76.243,76.328,76.395],"ymin":52.961},{"pts":[[55.84,77.645],[56.214,77.799],[56.572,77.952],[56.913,78.102],[57.236,78.251],[57.54,78.397],[57.823,78.54],[58.085,78.681],[58.325,78.818],[58.541,78.953],[58.733,79.084],[58.899,79.212],[59.039,79.336],[59.105,79.399],[59.175,79.463],[59.248,79.529],[59.324,79.596],[59.404,79.663],[59.486,79.732],[59.571,79.801],[59.659,79.872],[59.749,79.943],[59.842,80.015],[59.938,80.087],[60.035,80.16],[57.855,47.141]],"fx0":55.75,"step":0.25,"foot":[77.645,77.711,77.814,77.921,78.03,78.142,78.257,78.377,78.503,78.635,78.775,78.927,79.097,79.301,79.531,79.743,79.943,80.134,80.16],"ymin":47.141},{"pts":[[63.375,82.336],[63.854,82.62],[64.325,82.896],[64.784,83.161],[65.226,83.412],[65.645,83.649],[66.038,83.868],[66.399,84.067],[66.724,84.245],[67.008,84.4],[67.246,84.528],[67.434,84.629],[67.566,84.699],[65.391,52.426]],"fx0":63.25,"step":0.25,"foot":[82.336,82.41,82.559,82.706,82.852,82.997,83.141,83.284,83.426,83.567,83.707,83.847,83.985,84.123,84.26,84.396,84.53,84.664,84.699],"ymin":52.426},{"pts":[[70.848,84.664],[71.164,84.669],[71.488,84.677],[71.821,84.688],[72.161,84.702],[72.506,84.719],[72.857,84.74],[73.213,84.765],[73.572,84.794],[73.935,84.828],[74.299,84.866],[74.665,84.909],[75.031,84.957],[72.926,60.586]],"fx0":70.75,"step":0.25,"foot":[84.664,84.667,84.671,84.677,84.686,84.695,84.706,84.719,84.734,84.75,84.768,84.788,84.811,84.835,84.861,84.889,84.92,84.953,84.957],"ymin":60.586},{"pts":[[78.496,85.773],[78.615,85.818],[78.732,85.863],[78.849,85.909],[78.964,85.956],[79.078,86.005],[79.19,86.054],[79.301,86.105],[79.41,86.157],[79.517,86.21],[79.623,86.265],[79.726,86.321],[79.828,86.379],[80.042,86.506],[80.259,86.643],[80.478,86.787],[80.7,86.94],[80.925,87.1],[81.153,87.268],[81.384,87.442],[81.619,87.623],[81.856,87.809],[82.097,88.002],[82.342,88.2],[82.59,88.402],[80.461,54.168]],"fx0":78.25,"step":0.25,"foot":[85.773,85.775,85.87,85.972,86.082,86.202,86.334,86.481,86.637,86.802,86.975,87.155,87.34,87.531,87.726,87.924,88.125,88.329,88.402],"ymin":54.168},{"pts":[[85.941,91.168],[86.258,91.419],[86.581,91.671],[86.911,91.923],[87.247,92.177],[87.59,92.431],[87.939,92.685],[88.296,92.938],[88.659,93.192],[89.03,93.444],[89.407,93.696],[89.792,93.946],[90.184,94.195],[88.0,43.348]],"fx0":85.75,"step":0.25,"foot":[91.168,91.214,91.412,91.607,91.8,91.991,92.179,92.364,92.547,92.728,92.906,93.081,93.254,93.424,93.591,93.756,93.919,94.079,94.195],"ymin":43.348},{"pts":[[93.434,96.004],[93.764,96.164],[94.099,96.321],[94.438,96.475],[94.782,96.627],[95.131,96.776],[95.484,96.922],[95.843,97.065],[96.206,97.205],[96.575,97.342],[96.948,97.476],[97.327,97.607],[97.711,97.734],[97.539,93.945],[95.535,49.289]],"fx0":93.25,"step":0.25,"foot":[96.004,96.036,96.157,96.275,96.39,96.503,96.613,96.72,96.825,96.928,97.028,97.126,97.221,97.314,97.405,97.494,97.58,97.664,97.734],"ymin":49.289},{"pts":[[103.07,16.355],[100.902,98.633],[101.26,98.719],[101.619,98.804],[101.98,98.887],[102.341,98.969],[102.703,99.05],[103.066,99.129],[103.43,99.207],[103.795,99.284],[104.16,99.359],[104.527,99.433],[104.894,99.506],[105.262,99.578]],"fx0":100.75,"step":0.25,"foot":[98.633,98.656,98.717,98.776,98.834,98.892,98.948,99.004,99.06,99.115,99.168,99.222,99.274,99.326,99.377,99.428,99.478,99.527,99.576,99.578],"ymin":16.355},{"pts":[[112.781,100.891],[110.605,29.668],[108.617,94.727],[108.453,100.156],[108.817,100.219],[109.181,100.282],[109.544,100.345],[109.907,100.407],[110.269,100.468],[110.63,100.529],[110.991,100.59],[111.351,100.651],[111.71,100.711],[112.068,100.771],[112.425,100.831],[112.781,100.891]],"fx0":108.25,"step":0.25,"foot":[100.156,100.164,100.208,100.251,100.294,100.337,100.38,100.422,100.465,100.507,100.549,100.592,100.634,100.676,100.718,100.76,100.802,100.843,100.885,100.891],"ymin":29.668},{"pts":[[118.141,23.332],[115.992,101.453],[116.369,101.523],[116.743,101.593],[117.115,101.664],[117.484,101.736],[117.85,101.809],[118.213,101.883],[118.573,101.958],[118.929,102.034],[119.281,102.112],[119.63,102.19],[119.975,102.27],[120.316,102.352]],"fx0":115.75,"step":0.25,"foot":[101.453,101.455,101.501,101.547,101.594,101.642,101.691,101.74,101.789,101.84,101.891,101.943,101.996,102.05,102.105,102.161,102.218,102.276,102.336,102.352],"ymin":23.332},{"pts":[[127.852,101.891],[125.676,12.723],[123.469,103.25],[123.526,103.27],[123.583,103.289],[123.64,103.309],[123.697,103.329],[123.753,103.349],[123.81,103.37],[123.866,103.39],[123.922,103.41],[123.977,103.431],[124.033,103.451],[124.089,103.472],[124.145,103.492],[124.41,103.344],[124.678,103.199],[124.952,103.057],[125.232,102.918],[125.52,102.782],[125.816,102.649],[126.123,102.518],[126.441,102.389],[126.771,102.262],[127.116,102.137],[127.475,102.013],[127.852,101.891]],"fx0":123.25,"step":0.25,"foot":[103.25,103.261,103.348,103.439,103.433,103.295,103.162,103.033,102.91,102.792,102.679,102.571,102.467,102.366,102.27,102.179,102.091,102.005,101.924,101.891],"ymin":12.723},{"pts":[[135.398,100.988],[133.211,0.078],[131.023,101.051],[131.077,101.039],[131.13,101.027],[131.182,101.016],[131.235,101.004],[131.288,100.992],[131.344,100.98],[131.75,100.899],[132.142,100.837],[132.519,100.792],[132.884,100.763],[133.235,100.749],[133.575,100.75],[133.903,100.764],[134.22,100.789],[134.528,100.826],[134.827,100.872],[135.116,100.926],[135.398,100.988]],"fx0":131.0,"step":0.25,"foot":[101.051,101.001,100.949,100.899,100.859,100.824,100.794,100.773,100.758,100.749,100.75,100.757,100.771,100.793,100.822,100.86,100.904,100.956,100.988],"ymin":0.078},{"pts":[[141.164,101.977],[141.299,101.938],[141.435,101.897],[141.574,101.851],[141.714,101.802],[141.857,101.75],[142.0,101.694],[142.146,101.636],[142.293,101.574],[142.442,101.51],[142.593,101.443],[142.745,101.373],[142.898,101.301],[142.711,93.879],[140.746,16.711],[138.582,101.961],[138.784,102.008],[138.987,102.049],[139.191,102.084],[139.397,102.111],[139.606,102.13],[139.817,102.14],[140.032,102.141],[140.25,102.131],[140.472,102.111],[140.698,102.079],[140.928,102.034],[141.164,101.977]],"fx0":138.5,"step":0.25,"foot":[101.961,102.0,102.051,102.091,102.12,102.137,102.141,102.131,102.107,102.069,102.017,101.952,101.875,101.789,101.695,101.592,101.484,101.37,101.301],"ymin":16.711},{"pts":[[148.285,9.977],[146.051,99.613],[146.399,99.419],[146.752,99.225],[147.108,99.031],[147.468,98.837],[147.831,98.645],[148.197,98.455],[148.567,98.268],[148.94,98.085],[149.316,97.906],[149.695,97.732],[150.077,97.564],[150.461,97.402]],"fx0":146.0,"step":0.25,"foot":[99.613,99.502,99.364,99.226,99.089,98.954,98.82,98.688,98.557,98.428,98.302,98.178,98.056,97.937,97.822,97.708,97.598,97.491,97.402],"ymin":9.977},{"pts":[[153.855,93.754],[153.922,96.398],[154.197,96.36],[154.473,96.328],[154.749,96.303],[155.026,96.285],[155.302,96.276],[155.579,96.273],[155.856,96.28],[156.133,96.294],[156.41,96.317],[156.688,96.349],[156.965,96.391],[157.242,96.441],[157.299,96.453],[157.355,96.465],[157.411,96.478],[157.467,96.49],[157.522,96.503],[157.578,96.516],[157.633,96.528],[157.688,96.541],[157.744,96.553],[157.799,96.566],[157.855,96.578],[157.91,96.59],[155.82,49.332]],"fx0":153.75,"step":0.25,"foot":[93.754,96.387,96.354,96.325,96.303,96.287,96.277,96.274,96.277,96.287,96.304,96.328,96.359,96.397,96.443,96.498,96.555,96.59],"ymin":49.332},{"pts":[[161.352,97.57],[161.693,97.689],[162.034,97.809],[162.373,97.932],[162.711,98.057],[163.049,98.184],[163.386,98.312],[163.723,98.443],[164.061,98.574],[164.399,98.707],[164.737,98.842],[165.077,98.977],[165.418,99.113],[163.355,43.355]],"fx0":161.25,"step":0.25,"foot":[97.57,97.622,97.709,97.797,97.888,97.979,98.072,98.166,98.261,98.356,98.453,98.551,98.649,98.748,98.847,98.946,99.046,99.113],"ymin":43.355},{"pts":[[168.887,100.465],[169.202,100.581],[169.521,100.696],[169.844,100.811],[170.171,100.925],[170.502,101.038],[170.838,101.151],[171.178,101.262],[171.523,101.373],[171.873,101.483],[172.228,101.591],[172.588,101.699],[172.953,101.805],[170.891,53.742]],"fx0":168.75,"step":0.25,"foot":[100.465,100.507,100.598,100.689,100.778,100.865,100.952,101.038,101.121,101.204,101.286,101.366,101.444,101.522,101.598,101.672,101.746,101.805],"ymin":53.742},{"pts":[[176.402,102.676],[176.747,102.753],[177.092,102.83],[177.436,102.905],[177.78,102.979],[178.124,103.052],[178.466,103.123],[178.808,103.193],[179.148,103.262],[179.487,103.329],[179.824,103.396],[180.159,103.46],[180.492,103.523],[178.426,61.945]],"fx0":176.25,"step":0.25,"foot":[102.676,102.698,102.754,102.809,102.864,102.919,102.972,103.025,103.078,103.13,103.181,103.232,103.282,103.332,103.381,103.43,103.477,103.523],"ymin":61.945},{"pts":[[183.824,104.113],[184.244,104.181],[184.654,104.247],[185.055,104.31],[185.445,104.371],[185.825,104.429],[186.193,104.484],[186.549,104.537],[186.894,104.588],[187.225,104.635],[187.543,104.68],[187.847,104.722],[188.137,104.762],[185.961,67.559]],"fx0":183.75,"step":0.25,"foot":[104.113,104.142,104.182,104.222,104.262,104.302,104.341,104.379,104.417,104.455,104.493,104.53,104.567,104.603,104.639,104.674,104.709,104.743,104.762],"ymin":67.559}]};
(function(){
  var stage = document.getElementById('top');
  var cv    = stage && stage.querySelector('.hero-aurora');
  var badge = stage && stage.querySelector('.hero-badge');
  var ART   = window.__BADGE_SHORT;
  if(!cv || !badge || !ART) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the frame's top rail and the gap in it, in the artwork's own units */
  var RAIL_Y = 36.22, GAP_L = 98.06, GAP_R = 153.42;
  var CEIL_UNDER_RAIL = RAIL_Y + 0.04 * ART.h;     /* the lines under the rail stop just below it */
  var CEIL_IN_GAP = 0.6;                           /* the ones in the gap may reach the top of the artwork */

  var B = ART.blades, N = B.length, XMIN = 1e9, XMAX = -1e9;
  B.forEach(function(b){
    var xs = b.pts.map(function(p){ return p[0]; });
    b.xa = Math.min.apply(null, xs); b.xb = Math.max.apply(null, xs);
    b.cx = (b.xa + b.xb) / 2;
    b.mid = footAt(b, b.cx);
    b.inGap = b.xa > GAP_L && b.xb < GAP_R;
    b.ceil = b.inGap ? CEIL_IN_GAP : CEIL_UNDER_RAIL;
    XMIN = Math.min(XMIN, b.xa); XMAX = Math.max(XMAX, b.xb);
  });
  B.forEach(function(b){
    b.u = 0.064 + 0.871 * (b.cx - XMIN) / (XMAX - XMIN);   /* position along the curtain, as in the badge */
    b.swing = b.inGap && b.ymin < 20 ? 0.22 : 0.32;        /* the tallest lines swing less */
  });
  function footAt(b, x){
    var f = b.foot, i = (x - b.fx0) / b.step;
    if(i <= 0) return f[0];
    if(i >= f.length-1) return f[f.length-1];
    var j = Math.floor(i), r = i - j;
    return f[j] + (f[j+1] - f[j]) * r;
  }

  /* the brand's Green, Bright Blue and Purple, as hue / saturation / lightness
     (hues 134, 197 and 255 are theirs); saturation and lightness are raised
     from the printed values so the colour reads clearly as light against the
     sky. tone(m) walks Green -> Bright Blue -> Purple as m goes 0 -> 1. */
  var HSL_G = [134, 72, 46], HSL_B = [197, 88, 46], HSL_P = [255, 66, 58];
  function tone(m, light){
    m = m < 0 ? 0 : m > 1 ? 1 : m;
    var a, b, f;
    if(m < 0.5){ a = HSL_G; b = HSL_B; f = m / 0.5; } else { a = HSL_B; b = HSL_P; f = (m - 0.5) / 0.5; }
    f = f*f*(3 - 2*f);                                  /* ease, so each colour holds a moment */
    var l = (a[2] + (b[2]-a[2])*f) * light;
    return 'hsl(' + (a[0] + (b[0]-a[0])*f).toFixed(1) + ',' + (a[1] + (b[1]-a[1])*f).toFixed(1) + '%,' + Math.min(78, l).toFixed(1) + '%)';
  }

  var ctx = null, W = 0, H = 0, dpr = 1, k = 1;
  function measure(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    if(!W || !H) return false;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    k = W / ART.w;
    return true;
  }

  var ease = function(v){ v = v<0?0:v>1?1:v; return 1 - Math.pow(1-v, 3); };
  var t = reduce ? 4 : 0, born = 0, p = 0;

  function draw(){
    if(!W || !H) return;
    ctx.clearRect(0,0,W,H);
    var age = t - born;
    for(var i=0; i<N; i++){
      var b = B[i];
      var grow = reduce ? 1 : ease((age - 0.25 - i*0.045) / 1.5);
      if(grow <= 0.002) continue;

      var travel  = t*0.42 - b.u*6.4;
      var swell   = 0.66*Math.sin(travel) + 0.34*Math.sin(travel*0.47 + t*0.14);
      var breathe = reduce ? 1 : 1 + b.swing*swell;
      var rise    = b.mid - b.ymin;
      var s       = Math.min(breathe, (b.mid - b.ceil) / rise) * grow;

      /* colour flows across the curtain like light moving through it: a wave
         runs left to right along the row (a band crosses the whole badge in
         about nine seconds), with a slower swell under it so it never repeats
         exactly. Each line is graded from its foot to its tip, the tip a step
         ahead in the sequence, so the colour also climbs the lines. The
         sequence is the brand's Green, Bright Blue and Purple. */
      var ph = t*0.55 - b.u*5.2;
      var wv = 0.7*Math.sin(ph) + 0.3*Math.sin(ph*0.53 + t*0.17 + 1.3);
      var m  = Math.max(0, Math.min(1, 0.5 + 0.5*wv*1.25));
      var cFoot = tone(m - 0.40, 0.88);
      var cMid  = tone(m, 1);
      var cTip  = tone(m + 0.34, 1.10);

      /* the foot stays on the mountain edge; everything above it scales */
      ctx.beginPath();
      var top = 1e9;
      for(var q=0; q<b.pts.length; q++){
        var x = b.pts[q][0], y = b.pts[q][1];
        var fy = footAt(b, x);
        var yy = (fy - (fy - y) * s) * k;
        if(yy < top) top = yy;
        q ? ctx.lineTo(x*k, yy) : ctx.moveTo(x*k, yy);
      }
      ctx.closePath();
      var yb = b.mid * k;
      var gr = ctx.createLinearGradient(0, yb, 0, Math.min(top, yb - 1));
      gr.addColorStop(0,    cFoot);
      gr.addColorStop(0.46, cMid);
      gr.addColorStop(1,    cTip);
      ctx.fillStyle = gr;
      ctx.fill();
    }
  }

  /* scroll: 0 at the top, 1 once the hero has gone; the badge reads it
     through --hero-p */
  function scrollP(){
    var h = stage.offsetHeight || 1;
    var v = -stage.getBoundingClientRect().top / h;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  function applyScroll(){
    var np = reduce ? 0 : scrollP();
    if(np !== p){ p = np; stage.style.setProperty('--hero-p', p.toFixed(4)); }
  }

  var raf = 0, visible = true, last = 0, started = false;
  function frame(now){
    raf = 0;
    if(!visible) return;
    applyScroll();
    t += last ? Math.min(now - last, 100) / 1000 : 0.016;
    last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function go(){ if(!raf && !reduce) raf = requestAnimationFrame(frame); }

  function start(){
    if(started || !cv.offsetWidth) return false;
    started = true;
    ctx = cv.getContext('2d');
    measure();
    draw();
    window.addEventListener('resize', function(){ if(cv.offsetWidth && measure()) draw(); });
    if(reduce) return true;
    /* the entrance replays whenever the hero is made ready again (the
       portfolio demo does this when it loops back to the top) */
    if('MutationObserver' in window){
      new MutationObserver(function(){
        if(stage.classList.contains('stage-ready')) born = t;
      }).observe(stage, {attributes:true, attributeFilter:['class']});
    }
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        visible = es[es.length-1].isIntersecting;
        if(visible){ last = 0; go(); }
      },{threshold:0}).observe(stage);
    }
    go();
    return true;
  }
  /* wide screens only: a tablet that loads in portrait and is turned to
     landscape starts the hero then */
  if(!start()){
    var later = function(){ if(start()) window.removeEventListener('resize', later); };
    window.addEventListener('resize', later);
  }
})();

/* ---- wide-screen hero: a slow glow behind the badge ----
   Three large soft lights, in the brand's Green, Bright Blue and Purple,
   drift very slowly behind the logo, a minute or more to cross. They are drawn
   small and let the browser scale them up, which keeps the gradient smooth and
   the cost close to nothing, and the canvas is blended onto the sky so it only
   ever adds a little light. Wide screens only; with reduced motion it is drawn
   once and holds. */
(function(){
  var stage = document.getElementById('top');
  var cv    = stage && stage.querySelector('.hero-glow');
  if(!cv) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = null, W = 0, H = 0, t = reduce ? 30 : 0, raf = 0, visible = true, last = 0, started = false;
  var SCALE = 0.25;                                  /* drawn at a quarter of the size */

  /* x, y: where it sits (fractions of the hero) and how far it wanders; r: its
     reach as a fraction of the hero's width; a: its strongest light */
  var LIGHTS = [
    {c:[59,182,87],  x:.44, y:.50, dx:.10, dy:.05, r:.42, a:.105, s:.085, p:0.0},
    {c:[31,131,167], x:.60, y:.42, dx:.12, dy:.06, r:.40, a:.125, s:.070, p:2.1},
    {c:[84,65,151],  x:.50, y:.34, dx:.14, dy:.05, r:.36, a:.140, s:.060, p:4.2}
  ];

  function measure(){
    var w = cv.clientWidth, h = cv.clientHeight;
    if(!w || !h) return false;
    W = Math.max(2, Math.round(w*SCALE)); H = Math.max(2, Math.round(h*SCALE));
    cv.width = W; cv.height = H;
    ctx = cv.getContext('2d');
    return true;
  }
  function draw(){
    if(!W) return;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';
    for(var i=0;i<LIGHTS.length;i++){
      var L = LIGHTS[i];
      var x = (L.x + L.dx*Math.sin(t*L.s + L.p)) * W;
      var y = (L.y + L.dy*Math.cos(t*L.s*0.8 + L.p)) * H;
      var r = L.r * W * (0.94 + 0.06*Math.sin(t*L.s*1.3 + L.p));
      var a = L.a * (0.82 + 0.18*Math.sin(t*L.s*1.1 + L.p*1.7));      /* the light itself breathes a little */
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      var c = L.c;
      g.addColorStop(0,    'rgba('+c[0]+','+c[1]+','+c[2]+','+a.toFixed(3)+')');
      g.addColorStop(0.55, 'rgba('+c[0]+','+c[1]+','+c[2]+','+(a*0.32).toFixed(3)+')');
      g.addColorStop(1,    'rgba('+c[0]+','+c[1]+','+c[2]+',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function frame(now){
    raf = 0;
    if(!visible) return;
    if(!last || now - last >= 40){                    /* 25 fps is plenty for something this slow */
      t += last ? Math.min(now - last, 120) / 1000 : 0.04;
      last = now;
      draw();
    }
    raf = requestAnimationFrame(frame);
  }
  function go(){ if(!raf && !reduce) raf = requestAnimationFrame(frame); }
  function start(){
    if(started || !cv.offsetWidth) return false;
    started = true;
    measure(); draw();
    window.addEventListener('resize', function(){ if(cv.offsetWidth && measure()) draw(); });
    if(reduce) return true;
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        visible = es[es.length-1].isIntersecting;
        if(visible){ last = 0; go(); }
      },{threshold:0}).observe(stage);
    }
    go();
    return true;
  }
  /* a tablet that loads in portrait and is turned to landscape starts it then */
  if(!start()){
    var later = function(){ if(start()) window.removeEventListener('resize', later); };
    window.addEventListener('resize', later);
  }
})();

/* ---- night sky: stars that breathe, the odd one falling, and on the
        instrument backdrop a slow aurora wash behind it all ---- */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function nightSky(cv, opts){
    if(!cv || !cv.offsetWidth || !cv.offsetHeight) return;
    var ctx = cv.getContext('2d');
    opts = opts || {};
    var aurora = !!opts.aurora;
    var rate = opts.rate || 0.0045;          /* chance per frame of a new streak */
    var W=0,H=0,dpr=1,stars=[],shots=[],t=0,raf=0,live=false;

    function build(){
      dpr = Math.min(window.devicePixelRatio||1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      if(!W || !H) return;
      cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var n = Math.round(W*H/5200);
      stars = [];
      for(var i=0;i<n;i++){
        stars.push({
          x: Math.random()*W, y: Math.random()*H,
          r: 0.35 + Math.random()*0.85,
          a: 0.14 + Math.random()*0.40,
          sp: 0.25 + Math.random()*0.85,
          ph: Math.random()*Math.PI*2,
          hue: Math.random() < 0.18 ? 190 : (Math.random() < 0.5 ? 205 : 40)
        });
      }
    }

    function newShot(){
      var y0 = H*(0.04 + Math.random()*0.42);
      return {
        x: W*(0.5 + Math.random()*0.55), y: y0,
        len: 46 + Math.random()*58,
        vx: -(2.6 + Math.random()*2.1), vy: (0.8 + Math.random()*0.8),
        life: 0, max: 44 + Math.random()*26
      };
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      var g = ctx.createLinearGradient(0,0,0,H);
      /* both ends land on the page colour, so the backdrop has no edge where
         it meets the section above or below it */
      if(opts.brandSky && window.matchMedia('(min-width:861px)').matches){
        /* the brand's Sky Gradient: Black at the top to Denim Blue at the bottom */
        g.addColorStop(0, '#000000');
        g.addColorStop(0.38, '#00080d');   /* deeper through the middle and lower sky; the foot still lands on Denim Blue */
        g.addColorStop(0.72, '#020f17');
        g.addColorStop(1, '#05364c');
      } else if(opts.aurora){
        /* a section's own sky: Denim Blue at both ends so it meets the sections
           either side, deepening towards Black between */
        g.addColorStop(0,   '#05364c');
        g.addColorStop(0.20,'#021f2b');
        g.addColorStop(0.62,'#032a3a');
        g.addColorStop(1,   '#05364c');
      } else {
        g.addColorStop(0,   '#071a24');
        g.addColorStop(0.20,'#050f17');
        g.addColorStop(0.62,'#061a25');
        g.addColorStop(1,   '#071a24');
      }
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

      /* a slow curtain of colour drifting across, well under the model */
      if(aurora){
        /* soft elliptical washes rather than banded rectangles, so they have
           no edges at all: three of them drifting at different rates */
        for(var b=0;b<3;b++){
          var ph  = t*0.055 + b*2.1;
          var cx  = W*(0.5 + 0.40*Math.sin(ph));
          var cy  = H*(0.30 + 0.10*Math.sin(ph*0.5 + b));
          var rx  = W*(0.26 + 0.10*Math.sin(ph*0.7 + 1.3));
          var ry  = H*(0.34 + 0.08*Math.sin(ph*0.43 + 2.0));
          var hue = 138 + 34*Math.sin(ph*0.31 + b);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(rx, ry);
          var rg = ctx.createRadialGradient(0,0,0, 0,0,1);
          rg.addColorStop(0,   'hsla('+hue.toFixed(0)+',54%,56%,0.070)');
          rg.addColorStop(0.55,'hsla('+hue.toFixed(0)+',52%,52%,0.030)');
          rg.addColorStop(1,   'hsla('+(hue+26).toFixed(0)+',48%,50%,0)');
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(0,0,1,0,Math.PI*2); ctx.fill();
          ctx.restore();
        }
      }

      for(var i=0;i<stars.length;i++){
        var s = stars[i];
        var tw = reduce ? 0.72 : (0.55 + 0.45*Math.sin(t*s.sp + s.ph));
        var a = s.a * tw;
        if(a <= 0.01) continue;
        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + s.hue + ',35%,92%,' + a.toFixed(3) + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
        if(s.r > 0.95){
          ctx.beginPath();
          ctx.fillStyle = 'hsla(' + s.hue + ',45%,88%,' + (a*0.16).toFixed(3) + ')';
          ctx.arc(s.x, s.y, s.r*3.2, 0, Math.PI*2); ctx.fill();
        }
      }

      for(var k=shots.length-1;k>=0;k--){
        var sh = shots[k];
        var f = sh.life/sh.max;
        var fade = Math.sin(Math.PI*f);
        var tx = sh.x - sh.vx*sh.len*0.28, ty = sh.y - sh.vy*sh.len*0.28;
        var lg2 = ctx.createLinearGradient(sh.x,sh.y,tx,ty);
        lg2.addColorStop(0,'rgba(226,244,255,'+(0.75*fade).toFixed(3)+')');
        lg2.addColorStop(0.45,'rgba(150,205,235,'+(0.22*fade).toFixed(3)+')');
        lg2.addColorStop(1,'rgba(120,180,220,0)');
        ctx.strokeStyle = lg2; ctx.lineWidth = 1.15; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sh.x,sh.y); ctx.lineTo(tx,ty); ctx.stroke();
        sh.x += sh.vx; sh.y += sh.vy; sh.life++;
        if(sh.life > sh.max || sh.x < -90 || sh.y > H+50) shots.splice(k,1);
      }
    }

    function loop(){
      t += 0.016;
      if(shots.length < 2 && Math.random() < rate) shots.push(newShot());
      draw();
      raf = live ? requestAnimationFrame(loop) : 0;
    }
    function start(){ if(!raf && !reduce){ live = true; raf = requestAnimationFrame(loop); } }
    function stop(){ live = false; if(raf){ cancelAnimationFrame(raf); raf = 0; } }

    window.addEventListener('resize', function(){ build(); draw(); });
    build(); draw();
    if(reduce) return;
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){ e.isIntersecting ? start() : stop(); });
      },{threshold:0}).observe(cv);
    } else start();
  }

  nightSky(document.querySelector('.nightsky'),  {rate:0.0045, brandSky:true});
  nightSky(document.querySelector('.setup-sky'),  {rate:0.0045, aurora:true});
})();

/* ---- hero choreography: the entrance plays once the page is ready, and the
        technical readouts follow the pointer ---- */
(function(){
  var wide = window.matchMedia('(min-width:861px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = document.getElementById('top');
  if(stage){
    var ready = function(){ requestAnimationFrame(function(){ stage.classList.add('stage-ready'); }); };
    /* under the loading screen the hero waits for the cover to lift, so its entrance is seen */
    if(/\baur-(full|short)\b/.test(document.documentElement.className)){
      var fired = false, once = function(){ if(!fired){ fired = true; ready(); } };
      window.addEventListener('aur:reveal', once); setTimeout(once, 2600);
    } else ready();
  }

  /* the readouts track the pointer, the way a live instrument would */
  if(wide.matches && !reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var hz = document.querySelector('[data-hz]'),
        lat = document.querySelector('[data-lat]'),
        elev = document.querySelector('[data-elev]');
    var pending = false;
    function dms(deg){
      var d = Math.floor(deg), m = Math.floor((deg-d)*60), sec = Math.floor((((deg-d)*60)-m)*60);
      return d + '\u00b0' + String(m).padStart(2,'0') + '\u2032' + String(sec).padStart(2,'0') + '\u2033';
    }
    window.addEventListener('pointermove', function(e){
      if(e.pointerType && e.pointerType !== 'mouse') return;   /* a touch must never change the page: iOS then treats the tap as a hover and swallows its click */
      if(pending) return; pending = true;
      requestAnimationFrame(function(){
        var u = e.clientX/window.innerWidth, v = e.clientY/window.innerHeight;
        if(hz)   hz.textContent   = dms(u*360);
        if(lat)  lat.textContent  = dms(49.28 + (1-v)*16.72) + 'N';
        if(elev) elev.textContent = Math.round(120 + (1-v)*2180) + ' m';
        pending = false;
      });
    }, {passive:true});
  }
})();

/* ---- Projects hero: where we work -------------------------------------
   A survey drawing rather than an atlas: terrain read as contour lines, a
   traverse run between control points, and each station resolving as the
   line reaches it. It plays itself once on arrival (the view opens from the
   south coast to the whole reach), and then every project station can be
   selected: the map eases in on it and a preview card opens. Vancouver is a
   control point only; it has no project page, so it is not selectable. */
(function(){
  var sec = document.getElementById('map');
  var cv  = sec && sec.querySelector('.survey-map');
  if(!sec || !cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var out = {};
  sec.querySelectorAll('[data-sp]').forEach(function(el){ out[el.getAttribute('data-sp')] = el; });

  /* Real coordinates, and a real coastline to plot them against. The outlines
     below are heavily simplified — this is a survey drawing, not an atlas —
     but the geography underneath is genuine, so the positions mean something. */
  /* The stations come from the shared project data (assets/projects-data.js), the same source as the Services
     page traverse. coord 'regional' marks an approximate reference for a town or region, drawn dashed and
     labelled with an approx sign; 'recorded' values are those already published on the site. */
  var SHARED = window.AURORA_PROJECTS;
  var STN = (SHARED && SHARED.length ? SHARED.map(function(d){
    return {id:d.stn, name:d.place, lat:d.lat, lon:d.lon, elev:d.elev==null ? null : d.elev, method:d.method||'', coord:d.coord, d:d};
  }) : [
    {id:'AS-VAN', name:'Vancouver',     lat:49.28, lon:-123.12, elev:12,   method:'Layout \u00b7 machine control', coord:'recorded', d:{title:'Vancouver',loc:'Vancouver, BC',desc:'',img:'',href:''}},
    {id:'AS-PTA', name:'Port Alice',    lat:50.42, lon:-127.45, elev:8,    method:'LiDAR \u00b7 sonar merge', coord:'recorded', d:{title:'Port Alice',loc:'Port Alice, BC',desc:'',img:'',href:'#proj-50'}},
    {id:'AS-KSM', name:'KSM Mine',      lat:56.52, lon:-130.35, elev:1180, method:'Layout \u00b7 monitoring', coord:'recorded', d:{title:'KSM Mine',loc:'KSM Mine, BC',desc:'',img:'',href:'#proj-56'}},
    {id:'AS-BAF', name:'Baffin Island', lat:66.00, lon:-70.50,  elev:212,  method:'As-built \u00b7 30 km', coord:'recorded', d:{title:'Baffin Island',loc:'Baffin Island, Nunavut',desc:'',img:'',href:'#proj-66'}}
  ]).sort(function(a,b){ return a.lat - b.lat; });
  var approx = function(S){ return S.coord === 'regional' ? '\u2248' : ''; };

  /* [lat, lon] runs. Mainland BC coast, the island, Haida Gwaii, and the
     Arctic land the northern job sits on. */
  var COAST = {
    bcMainland: [
      [48.98,-123.05],[49.29,-123.10],[49.52,-123.24],[49.75,-123.86],[50.10,-124.55],
      [50.48,-124.82],[50.86,-125.04],[51.24,-125.62],[51.62,-127.28],[52.06,-127.86],
      [52.42,-128.12],[53.02,-128.62],[53.58,-129.28],[54.18,-130.32],[54.72,-130.42],
      [55.24,-130.02],[56.10,-131.10],[57.06,-133.08],[58.22,-134.62],[59.12,-136.20],
      [60.00,-138.60]
    ],
    vanIsland: [
      [48.33,-123.60],[48.58,-124.72],[48.92,-125.62],[49.28,-126.10],[49.68,-126.62],
      [50.08,-127.58],[50.52,-128.06],[50.82,-128.42],[50.92,-127.88],[50.68,-127.24],
      [50.38,-126.18],[50.02,-125.22],[49.62,-124.72],[49.18,-123.92],[48.72,-123.42],
      [48.33,-123.60]
    ],
    haidaGwaii: [
      [51.98,-131.02],[52.42,-131.42],[52.94,-132.10],[53.42,-132.62],[54.02,-133.08],
      [54.18,-132.42],[53.62,-131.86],[53.06,-131.52],[52.48,-131.12],[51.98,-131.02]
    ],
    baffin: [
      [62.60,-65.80],[63.74,-68.50],[64.60,-72.10],[65.52,-74.60],[66.48,-76.60],
      [68.02,-77.60],[69.52,-78.10],[71.02,-73.60],[72.48,-72.10],[73.02,-77.00],
      [71.52,-80.10],[70.02,-81.00],[68.52,-79.00],[67.02,-73.10],[65.48,-69.00],
      [64.02,-65.60],[62.60,-65.80]
    ],
    arcticMainland: [
      [60.00,-138.60],[62.00,-136.00],[64.00,-133.00],[66.50,-131.00],[68.50,-133.50],
      [69.50,-130.00],[69.00,-124.00],[68.00,-116.00],[67.50,-108.00],[68.50,-100.00],
      [67.00,-95.00],[65.00,-93.00],[63.00,-91.00],[61.00,-93.50],[60.00,-97.00]
    ]
  };

  /* equirectangular, with longitudes squeezed by the latitude of the frame so
     the shapes do not smear as the view opens north */
  var view = {n:0,s:0,w:0,e:0};
  function projX(lon, lat){
    var k = Math.cos((view.n+view.s)/2 * Math.PI/180);
    var w = (view.e - view.w) * k, x = (lon - view.w) * k;
    return frame.x + (x/w) * frame.w;
  }
  function projY(lat){
    return frame.y + ((view.n - lat)/(view.n - view.s)) * frame.h;
  }
  var frame = {x:0,y:0,w:0,h:0};

  var W=0,H=0,dpr=1,p=0,t=0,raf=0,live=false;
  var narrowNow = function(){ return window.matchMedia('(max-width:860px)').matches; };
  var sel = -1, fk = -1, fcur = 0, ftgt = 0, hov = -1, runT = 0;
  var fly = {from:null, t0:0}, lastFocus = null, ORDER = [];   /* switching between stations: a glide that pulls back and settles */   /* selected station, focus station, focus amount, hovered */
  var started = false, t0 = 0, DUR = 8200;                          /* the arrival run, in ms */
  var pins = [], card = null, lastArr = [];

  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    if(!W||!H) return;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function progress(){
    if(reduce) return 1;
    if(!started) return 0;
    return Math.max(0, Math.min(1, (performance.now() - t0) / DUR));
  }

  /* the view opens northward as the visitor descends: British Columbia first,
     then it keeps widening until Baffin is in the frame */
  var VIEW_NEAR = {n:52.6, s:47.8, w:-131.0, e:-121.0};   /* the south coast */
  var VIEW_MID  = {n:58.5, s:47.6, w:-136.0, e:-118.0};   /* up to the mine */
  var VIEW_FAR  = {n:75.0, s:46.5, w:-142.0, e:-58.0};    /* the whole reach */

  function lerpView(A,B,f){
    return {n:A.n+(B.n-A.n)*f, s:A.s+(B.s-A.s)*f,
            w:A.w+(B.w-A.w)*f, e:A.e+(B.e-A.e)*f};
  }
  var sm = function(v){ v=v<0?0:v>1?1:v; return v*v*v*(v*(v*6-15)+10); };

  /* where the selected station should sit within the drawing: the middle of
     it beside the notes on a wide screen; in the upper part on a phone, clear
     of the card that slides up from the foot */
  function focusView(k){
    var S = STN[k], narrow = narrowNow();
    var fx = 0.5, fy = narrow ? 0.30 : 0.5;
    var Lh = 3.8;
    var cosf = Math.cos(S.lat*Math.PI/180);
    var Lw = Lh * (frame.w/frame.h) / cosf;
    var n = S.lat + fy*Lh, w = S.lon - fx*Lw;
    return {n:n, s:n-Lh, w:w, e:w+Lw};
  }

  /* The focus view for the selected station; while a switch is under way it
     glides from the previous one, pulling back part-way so a long hop (the
     coast to Baffin) reads as travel and not as a smear across the map. */
  function currentFocus(){
    var to = focusView(fk);
    var s = fly.from ? Math.min(1, (performance.now() - fly.t0) / 1250) : 1;
    if(!fly.from || s >= 1){ fly.from = null; lastFocus = to; return to; }
    var e = sm(s), A = fly.from;
    var cx = ((A.w+A.e)/2) + (((to.w+to.e)/2) - ((A.w+A.e)/2)) * e;
    var cy = ((A.n+A.s)/2) + (((to.n+to.s)/2) - ((A.n+A.s)/2)) * e;
    var hw = ((A.e-A.w) + ((to.e-to.w) - (A.e-A.w)) * e) / 2;
    var hh = ((A.n-A.s) + ((to.n-to.s) - (A.n-A.s)) * e) / 2;
    var dist = Math.abs(((to.n+to.s)/2) - ((A.n+A.s)/2)) / (to.n-to.s);
    var bump = 1 + Math.min(6, dist * 1.1) * Math.sin(Math.PI * s);
    lastFocus = {n:cy+hh*bump, s:cy-hh*bump, w:cx-hw*bump, e:cx+hw*bump};
    return lastFocus;
  }

  function setView(p){
    /* On a wide screen the drawing keeps to the right of the notes. On a
       phone it has the whole panel, less the heading at the top and the
       readout along the foot. */
    var narrow = W <= 900;
    var pad = Math.min(W,H)*(narrow ? 0.05 : 0.08);
    var headEl = sec.querySelector('.map-head h1');
    var lx = headEl ? headEl.getBoundingClientRect().left - sec.getBoundingClientRect().left : pad;   /* the text column's left edge */
    var x0 = narrow ? pad : Math.max(W*0.3, lx + 24.5*16);
    var top = narrow ? H*0.27 : pad;          /* clear of the heading */
    var bot = narrow ? H*0.10 : pad;          /* clear of the readout */
    frame.x = x0; frame.y = top;
    frame.w = (W - pad) - x0; frame.h = H - top - bot;

    /* two stages, so the widening has a beat rather than one long drift */
    var v = p < 0.45
      ? lerpView(VIEW_NEAR, VIEW_MID, sm(p/0.45))
      : lerpView(VIEW_MID,  VIEW_FAR, sm((p-0.45)/0.55));
    /* then, if a station is selected, ease in on it */
    if(fcur > 0.0005 && fk >= 0) v = lerpView(v, currentFocus(), sm(fcur));
    view.n=v.n; view.s=v.s; view.w=v.w; view.e=v.e;
  }

  function poly(pts, close, alpha, width){
    ctx.beginPath();
    for(var i=0;i<pts.length;i++){
      var x = projX(pts[i][1], pts[i][0]), y = projY(pts[i][0]);
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    if(close) ctx.closePath();
    ctx.strokeStyle = 'rgba(143,193,211,'+alpha+')';
    ctx.lineWidth = width || 1;
    ctx.stroke();
  }

  function graticule(){
    ctx.save();
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.w, frame.h);
    ctx.clip();
    ctx.font = '400 9px ui-monospace,Menlo,monospace';
    /* parallels every 5 degrees, meridians every 10 */
    var latStep = (view.n-view.s) > 20 ? 10 : 5;
    for(var la=Math.ceil(view.s/latStep)*latStep; la<=view.n; la+=latStep){
      var y = projY(la);
      ctx.strokeStyle = 'rgba(143,193,211,.075)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(frame.x,y); ctx.lineTo(frame.x+frame.w,y); ctx.stroke();
      ctx.fillStyle = 'rgba(143,193,211,.34)';
      ctx.fillText(la.toFixed(0)+'\u00b0N', frame.x+4, y-4);
    }
    var lonStep = (view.e-view.w) > 40 ? 20 : 10;
    for(var lo=Math.ceil(view.w/lonStep)*lonStep; lo<=view.e; lo+=lonStep){
      var x = projX(lo, (view.n+view.s)/2);
      ctx.strokeStyle = 'rgba(143,193,211,.055)';
      ctx.beginPath(); ctx.moveTo(x,frame.y); ctx.lineTo(x,frame.y+frame.h); ctx.stroke();
    }
    ctx.restore();
  }

  function pt(i){
    return [projX(STN[i].lon, STN[i].lat), projY(STN[i].lat)];
  }

  function draw(){
    if(!W||!H) return;
    setView(p);
    ctx.clearRect(0,0,W,H);

    var bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#05364c'); bg.addColorStop(0.5,'#032e41'); bg.addColorStop(1,'#05364c');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    graticule();

    ctx.save();
    ctx.beginPath(); ctx.rect(frame.x, frame.y, frame.w, frame.h); ctx.clip();

    /* the coast as thin technical linework */
    poly(COAST.bcMainland, false, 0.55, 1.15);
    poly(COAST.vanIsland,  true,  0.55, 1.15);
    poly(COAST.haidaGwaii, true,  0.40, 1);

    /* the north arrives once the view has opened far enough to hold it */
    var north = Math.max(0, Math.min(1, (view.n - 60)/10));
    if(north > 0.01){
      ctx.globalAlpha = north;
      poly(COAST.arcticMainland, false, 0.22, 0.9);
      poly(COAST.baffin, true, 0.60, 1.2);
      ctx.globalAlpha = 1;
    }

    /* inland relief, kept quiet: offset copies of the coast reading as
       contours climbing away from the water */
    for(var c=1;c<=4;c++){
      ctx.globalAlpha = 0.15 - c*0.026;
      ctx.beginPath();
      for(var i=0;i<COAST.bcMainland.length;i++){
        var q = COAST.bcMainland[i];
        var x = projX(q[1] + c*0.85, q[0]), y = projY(q[0]);
        i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      }
      ctx.strokeStyle = 'rgba(143,193,211,.9)'; ctx.lineWidth = 0.8; ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* the traverse between control points */
    var legs = STN.length-1;
    runT = Math.max(0, Math.min(1, (p-0.06)/0.86)) * legs;
    var done = Math.floor(runT), frac = runT-done;

    ctx.beginPath();
    var a0 = pt(0); ctx.moveTo(a0[0],a0[1]);
    for(var i2=0;i2<legs;i2++){
      var A = pt(i2), B = pt(i2+1);
      var f = i2<done ? 1 : (i2===done ? frac : 0);
      if(f<=0) break;
      ctx.lineTo(A[0]+(B[0]-A[0])*f, A[1]+(B[1]-A[1])*f);
    }
    ctx.strokeStyle = 'rgba(59,182,87,.85)';
    ctx.lineWidth = 1.4; ctx.setLineDash([7,5]); ctx.stroke(); ctx.setLineDash([]);

    /* labels: selected first, then the rest in order; one that would sit on an already placed label is left off
       (the marker stays; it names itself when the view closes in) */
    var placed = [], showLab = [];
    var order = []; for(var q0=0;q0<STN.length;q0++) order.push(q0);
    order.sort(function(a,b){ return (b===sel)-(a===sel) || (b===hov)-(a===hov) || a-b; });
    for(var oi=0;oi<order.length;oi++){
      var ko = order[oi], Po = pt(ko), so = 7 + 5*Math.max(0,Math.min(1,(runT-(ko-0.55))/0.55));
      var lxo = Po[0]+so*1.6, lyo = Po[1]-5;
      if(lxo > frame.x+frame.w-130) lxo = Po[0]-so*1.6-120;
      var rect = {x:lxo-2, y:lyo-11, w:STN[ko].name.length*7+10, h:30};
      var hit = false;
      for(var pj=0;pj<placed.length;pj++){ var R = placed[pj]; if(rect.x < R.x+R.w && R.x < rect.x+rect.w && rect.y < R.y+R.h && R.y < rect.y+rect.h){ hit = true; break; } }
      showLab[ko] = !hit; if(!hit) placed.push(rect);
    }

    for(var k=0;k<STN.length;k++){
      var P = pt(k);
      var arrive = Math.max(0, Math.min(1, (runT-(k-0.55))/0.55));
      if(arrive<=0) continue;
      var isSel = (k === sel), isHov = (k === hov);
      var dim = (sel >= 0 && !isSel) ? 0.5 : 1;
      var sz = 7 + 5*arrive + (isSel ? 3 : isHov ? 1.5 : 0);
      lastArr[k] = arrive;
      ctx.save();
      ctx.translate(P[0],P[1]);
      if(isSel || isHov){
        /* the chosen station: a ring that breathes, so it reads as live */
        var pr = 17 + (isSel ? 3*Math.sin(t*2.6) : 0);
        ctx.beginPath(); ctx.arc(0,0,pr,0,Math.PI*2);
        ctx.strokeStyle = 'rgba(160,255,200,'+(isSel ? .75 : .45)+')'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,pr+6,0,Math.PI*2);
        ctx.strokeStyle = 'rgba(120,240,170,.16)'; ctx.stroke();
      }
      ctx.globalAlpha = dim;
      ctx.strokeStyle = 'rgba(120,240,170,'+(0.35+0.6*arrive).toFixed(2)+')';
      ctx.lineWidth = 1.2;
      if(STN[k].coord === 'regional') ctx.setLineDash([3,2.5]);   /* approximate regional reference: a dashed marker */
      ctx.beginPath();
      ctx.moveTo(0,-sz); ctx.lineTo(sz*0.87, sz*0.5); ctx.lineTo(-sz*0.87, sz*0.5);
      ctx.closePath(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(0,0,1.6,0,Math.PI*2);
      ctx.fillStyle='rgba(160,255,200,.95)'; ctx.fill();
      ctx.globalAlpha = 0.45*arrive*dim;
      ctx.beginPath();
      ctx.moveTo(-sz*1.9,0); ctx.lineTo(-sz*1.15,0);
      ctx.moveTo(sz*1.15,0); ctx.lineTo(sz*1.9,0);
      ctx.moveTo(0,-sz*1.9); ctx.lineTo(0,-sz*1.35);
      ctx.stroke();
      ctx.restore();

      if(showLab[k]){
        ctx.globalAlpha = arrive*dim;
        ctx.font = (isSel ? '700' : '500') + ' 11px ui-monospace,Menlo,monospace';
        var lx = P[0]+sz*1.6, ly = P[1]-5;
        if(lx > frame.x+frame.w-130) lx = P[0]-sz*1.6-120;
        ctx.fillStyle = 'rgba(226,240,242,.92)';
        ctx.fillText(STN[k].name.toUpperCase(), lx, ly);
        ctx.fillStyle = 'rgba(143,193,211,.7)';
        ctx.fillText(approx(STN[k])+STN[k].lat.toFixed(2)+'\u00b0N  '+Math.abs(STN[k].lon).toFixed(2)+'\u00b0W', lx, ly+13);
        ctx.globalAlpha = 1;
      }
    }

    if(runT>0 && runT<legs){
      var i0=Math.floor(runT), fr=runT-i0;
      var A2=pt(i0), B2=pt(Math.min(i0+1,legs));
      var hx=A2[0]+(B2[0]-A2[0])*fr, hy=A2[1]+(B2[1]-A2[1])*fr;
      ctx.beginPath(); ctx.arc(hx,hy,3.2,0,Math.PI*2);
      ctx.fillStyle='rgba(160,255,190,.95)'; ctx.fill();
      ctx.beginPath(); ctx.arc(hx,hy,9+2*Math.sin(t*2.2),0,Math.PI*2);
      ctx.strokeStyle='rgba(120,240,170,.35)'; ctx.lineWidth=1; ctx.stroke();
    }
    ctx.restore();

    /* the extent of the view, stated plainly, so the widening is legible */
    ctx.font = '400 9px ui-monospace,Menlo,monospace';
    ctx.fillStyle = 'rgba(143,193,211,.45)';
    ctx.fillText('VIEW  ' + view.s.toFixed(1) + '\u00b0N \u2013 ' + view.n.toFixed(1) + '\u00b0N',
                 frame.x, frame.y - 8);

    var cur = sel >= 0 ? sel : Math.max(0, Math.min(STN.length-1, Math.round(runT)));
    var st = STN[cur];
    if(out.id && out.id.textContent !== st.id){
      out.id.textContent = st.id;
      out.lat.textContent = approx(st)+st.lat.toFixed(2)+'\u00b0N'+(st.coord === 'regional' ? ' approx.' : '');
      out.elev.textContent = st.elev == null ? '\u2014' : st.elev+' m';
      out.method.textContent = st.method || '\u2014';
    }
    if(out.run) out.run.textContent = (runT/legs*4180).toFixed(0)+' km';
    placePins();
  }

  /* ---- selecting a station ------------------------------------------------
     Each project station has a real button laid over its marker, so it can be
     reached by mouse, touch and keyboard alike. The preview card is filled from
     the project's own entry further down the page: nothing is written twice. */
  var pinHost = sec.querySelector('.map-pins');
  card = sec.querySelector('.map-card');
  STN.forEach(function(S, i){
    if(!pinHost) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'map-pin'; b.hidden = true;
    b.setAttribute('aria-label', S.name + ', ' + approx(S) + S.lat.toFixed(2) + ' degrees north: preview project');
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function(ev){ ev.stopPropagation(); select(sel === i ? -1 : i); });
    b.addEventListener('pointerenter', function(){ hov = i; });
    b.addEventListener('pointerleave', function(){ if(hov === i) hov = -1; });
    pinHost.appendChild(b); pins[i] = b;
  });
  function placePins(){
    for(var i=0;i<STN.length;i++){
      var b = pins[i]; if(!b) continue;
      var P = pt(i);
      var inside = P[0] > frame.x-4 && P[0] < frame.x+frame.w+4 && P[1] > frame.y-4 && P[1] < frame.y+frame.h+4;
      var ok = inside && (lastArr[i]||0) > 0.7;
      if(b.hidden === ok) b.hidden = !ok;
      if(ok){
        /* crowded markers (Vancouver and Squamish at the widest view) share the space between them, so each stays tappable */
        var dmin = 44, ox = 0, oy = 0;
        for(var j=0;j<STN.length;j++){
          if(j === i) continue; var Q = pt(j); var dx = P[0]-Q[0], dy = P[1]-Q[1]; var dd = Math.hypot(dx, dy);
          if(dd < dmin) dmin = dd;
          if(dd < 24){   /* the touch targets (not the drawn markers) are eased apart so each can be reached */
            var push = Math.min(12, (24-dd)/2), ux = dd > 0.5 ? dx/dd : (i > j ? 0 : 0), uy = dd > 0.5 ? dy/dd : (i > j ? 1 : -1);
            ox += ux*push; oy += uy*push;
          }
        }
        var sz2 = Math.max(20, Math.min(44, dmin + Math.hypot(ox,oy)));
        if(b._s !== sz2){ b._s = sz2; b.style.width = sz2+'px'; b.style.height = sz2+'px'; }
        b.style.transform = 'translate3d('+(P[0]+ox-sz2/2).toFixed(1)+'px,'+(P[1]+oy-sz2/2).toFixed(1)+'px,0)';
      }
    }
    sec.classList.toggle('map-ready', runT >= STN.length-1.05);
  }
  function fill(i){
    var D = STN[i].d, ci = card && card.querySelector('.mc-img');
    if(!card) return false;
    card.classList.toggle('no-img', !D.img);
    if(D.img){ ci.src = D.img; ci.alt = ''; ci.hidden = false; } else { ci.removeAttribute('src'); ci.hidden = true; }
    card.querySelector('.mc-title').textContent = D.names ? 'Projects' : D.title;
    card.querySelector('.mc-loc').textContent = D.loc + ' \u00b7 ' + approx(STN[i]) + STN[i].lat.toFixed(2) + '\u00b0N' + (STN[i].coord === 'regional' ? ' (approx.)' : '');
    card.querySelector('.mc-desc').textContent = D.names ? D.names.join(' \u00b7 ') : (D.desc || '');
    var lk = card.querySelector('.mc-link');
    if(D.href){ lk.setAttribute('href', D.href); lk.hidden = false; } else { lk.hidden = true; }
    return true;
  }
  function select(i){
    if(i >= 0 && !fill(i)) i = -1;
    var switching = i >= 0 && sel >= 0 && i !== sel;
    if(switching && !reduce){
      fly.from = lastFocus || focusView(fk); fly.t0 = performance.now();
      if(card){ card.classList.add('swap'); setTimeout(function(){ card.classList.remove('swap'); }, 220); }
    } else if(i >= 0 && sel < 0){ fly.from = null; }
    sel = i;
    if(i >= 0){ fk = i; ftgt = 1; } else { ftgt = 0; }
    if(reduce){ fcur = ftgt; fly.from = null; }
    if(i >= 0 && card){
      var pos = ORDER.indexOf(i);
      var cnt = card.querySelector('.mc-count');
      if(cnt) cnt.textContent = ('0'+(pos+1)).slice(-2) + ' / ' + ('0'+ORDER.length).slice(-2);
    }
    pins.forEach(function(b, k){ if(b) b.setAttribute('aria-pressed', k === sel ? 'true' : 'false'); });
    sec.classList.toggle('map-open', sel >= 0);
    if(card){ card.hidden = false; card.classList.toggle('open', sel >= 0); card.setAttribute('aria-hidden', sel >= 0 ? 'false' : 'true'); }
    if(!live) { p = progress(); draw(); }
  }
  /* the projects in the order they appear on the page */
  ORDER = STN.map(function(S, i){ return i; });   /* south to north, as on the traverse */
  function step(d){
    if(sel < 0 || ORDER.length < 2) return;
    var pos = ORDER.indexOf(sel);
    select(ORDER[(pos + d + ORDER.length) % ORDER.length]);
  }
  if(card){
    var pv = card.querySelector('.mc-prev'), nx = card.querySelector('.mc-next');
    if(pv) pv.addEventListener('click', function(){ step(-1); });
    if(nx) nx.addEventListener('click', function(){ step(1); });
    card.querySelector('.mc-close').addEventListener('click', function(){ select(-1); });
    card.querySelector('.mc-link').addEventListener('click', function(){ /* the page scrolls to the full entry; the map stays as it is */ });
  }
  /* an empty part of the drawing, or Escape, lets go of the selection */
  sec.addEventListener('click', function(ev){
    if(sel < 0) return;
    if(ev.target.closest('.map-card, .map-pin')) return;
    select(-1);
  });
  document.addEventListener('keydown', function(ev){
    if(sel < 0) return;
    if(ev.key === 'Escape') select(-1);
    else if(ev.key === 'ArrowRight') step(1);
    else if(ev.key === 'ArrowLeft') step(-1);
  });

  function loop(){
    if(live){ t += 0.016; p = progress(); fcur += (ftgt - fcur) * 0.085; if(Math.abs(ftgt - fcur) < 0.0008) fcur = ftgt; draw(); }
    raf = live ? requestAnimationFrame(loop) : 0;
  }
  window.addEventListener('resize', function(){ resize(); p=progress(); draw(); });
  resize(); p=progress(); draw();
  if(reduce) return;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          if(!started){ started = true; t0 = performance.now() + 450; }
          if(!raf){ live=true; raf=requestAnimationFrame(loop);} }
        else { live=false; }
      });
    },{threshold:0}).observe(sec);
  } else { started = true; t0 = performance.now(); live=true; loop(); }
})();

/* ---- 08 · the thread: one continuous run down the page, reading out the
        distance covered, and inverting over the light sections ---- */
(function(){
  var thread = document.querySelector('.thread');
  if(!thread || !window.matchMedia('(min-width:1100px)').matches) return;
  var run = thread.querySelector('.thread-run');
  var read = thread.querySelector('[data-thread]');
  var ticking = false;

  function lightAt(y){
    var el = document.elementFromPoint(2, y);
    while(el && el !== document.body){
      if(el.classList && (el.classList.contains('services') || el.classList.contains('teasers') ||
         el.classList.contains('advantage') || el.classList.contains('projects') || el.classList.contains('is-light'))) return true;
      if(el.classList && el.classList.contains('on-dark')) return false;
      el = el.parentElement;
    }
    return false;
  }

  function update(){
    var max = document.body.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    run.style.height = (p*100).toFixed(2) + '%';
    /* distance is read against the real span of the work, 49.28N to 66.00N */
    if(read) read.textContent = (49.28 + p*16.72).toFixed(2) + '\u00b0';
    thread.classList.toggle('on-light', lightAt(window.innerHeight*0.5));
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, {passive:true});
  window.addEventListener('resize', update);
  update();
})();

/* ---- Portfolio Demo Mode: the single switch ------------------------------
   The Framework portfolio embeds this site in a device mockup using
   ?portfolioDemo=1. Everything the mode does lives in assets/portfolio-demo.js,
   which is requested only when the parameter is present; this is the one place
   the parameter is read, and without it nothing here does anything. */
(function(){
  function isPortfolioDemo(){
    try{ return new URLSearchParams(window.location.search).get('portfolioDemo') === '1'; }
    catch(e){ return false; }
  }
  if(!isPortfolioDemo()) return;
  var s = document.createElement('script');
  s.src = 'assets/portfolio-demo.js';
  document.body.appendChild(s);
})();
