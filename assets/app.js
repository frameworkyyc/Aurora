/* ---- how far a scroll-driven section has run --------------------------
   On a wide screen a section is pinned, so its run starts when its top meets
   the top of the window: the drawing is already in place before it begins.
   On a phone nothing is pinned for long enough to read that way, so the run
   starts the moment the section appears over the bottom edge and finishes at
   the same place as before. The animation then plays while the section is
   travelling up the screen rather than only once it has arrived. */
/* progress through a section whose drawing pins to the top of the screen on a
   phone: 0 when it pins, 1 when the last note has passed */
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

  /* ---- latitude stations ---- */
  var LAT_MIN = 48.6, LAT_MAX = 67.2;
  var pos = function(lat){ return (lat - LAT_MIN) / (LAT_MAX - LAT_MIN); };
  var stations = [].slice.call(document.querySelectorAll('.station'));
  var hot = -1;
  stations.forEach(function(s){
    var p = pos(parseFloat(s.dataset.lat));
    s.style.left = (p*100) + '%';
    if(p < 0.06) s.classList.add('edge-left');
    if(p > 0.90) s.classList.add('edge-right');
    s.setAttribute('aria-label','Jump to project at latitude ' + s.dataset.lat + ' degrees north');
    s.addEventListener('mouseenter', function(){ hot = p; });
    s.addEventListener('focus', function(){ hot = p; });
    s.addEventListener('mouseleave', function(){ hot = -1; });
    s.addEventListener('blur', function(){ hot = -1; });
    s.addEventListener('click', function(){
      var lat = parseFloat(s.dataset.lat);
      var id = lat > 60 ? '#proj-66' : lat > 55 ? '#proj-56' : lat > 50 ? '#proj-50' : '#projects';
      var el = document.querySelector(id);
      if(el){ el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'center'}); }
      else { window.location.href = 'projects.html' + (id.indexOf('#proj') === 0 ? id : ''); }
    });
  });
  /* ---- the traverse walks itself: a run that sweeps station to station ---- */
  (function(){
    var run = document.getElementById('axisRun');
    var dot = document.getElementById('axisDot');
    var axis = document.getElementById('axis');
    if(!run || !dot || !axis) return;

    var marks = stations.map(function(st){ return pos(parseFloat(st.dataset.lat)); });

    if(reduce){
      run.style.width = '100%';
      stations.forEach(function(st){ st.classList.add('passed'); });
      return;
    }

    var PERIOD = 9200, t0 = performance.now(), live = false, raf = 0;

    function step(now){
      if(!live){ raf = 0; return; }
      var u = ((now - t0) % PERIOD) / PERIOD;
      var travel = clamp(u/0.84, 0, 1);
      var fade = Math.min(1, u/0.05) * (1 - clamp((u-0.88)/0.12, 0, 1));

      run.style.width = (travel*100).toFixed(2) + '%';
      run.style.opacity = fade.toFixed(3);
      dot.style.left = (travel*100).toFixed(2) + '%';
      dot.style.opacity = (fade*0.95).toFixed(3);

      for(var i=0;i<stations.length;i++){
        var d = travel - marks[i];
        stations[i].classList.toggle('passed', d >= 0 && fade > 0.15);
        stations[i].classList.toggle('hit', Math.abs(d) < 0.016 && fade > 0.15);
      }
      raf = requestAnimationFrame(step);
    }

    function start(){ if(!raf){ live = true; raf = requestAnimationFrame(step); } }
    function stop(){ live = false; }

    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){ e.isIntersecting ? start() : stop(); });
      },{threshold:0}).observe(axis);
    } else start();
  })();

  /* ---- scroll-driven aurora stage ---- */
  var stage = document.getElementById('top');
  var cv = document.getElementById('sky'), ctx = cv && cv.getContext('2d');
  var cue = document.getElementById('cue');
  var W=0, H=0, dpr=1, t=0, p=0, needs=true;

  var mark = new Image();
  mark.onload = function(){ needs = true; if(W) draw(); };
  mark.src = "assets/mark-word.png";

  /* the blades of the lockup, measured off the artwork so their feet stay on
     the mountain line exactly where the logo puts them */
  var LOCK_RAW = [{"x": 0.01253, "w": 0.02639, "tip": 0.26667, "base": 0.74833}, {"x": 0.05739, "w": 0.02639, "tip": 0.23917, "base": 0.7375}, {"x": 0.10092, "w": 0.02639, "tip": 0.31917, "base": 0.72333}, {"x": 0.14578, "w": 0.02639, "tip": 0.29417, "base": 0.71}, {"x": 0.19063, "w": 0.02639, "tip": 0.38917, "base": 0.71083}, {"x": 0.23549, "w": 0.02639, "tip": 0.36333, "base": 0.7225}, {"x": 0.28034, "w": 0.02639, "tip": 0.3875, "base": 0.7425}, {"x": 0.32454, "w": 0.0277, "tip": 0.33417, "base": 0.74333}, {"x": 0.36873, "w": 0.02639, "tip": 0.26167, "base": 0.75833}, {"x": 0.41359, "w": 0.02639, "tip": 0.25833, "base": 0.77833}, {"x": 0.45844, "w": 0.02639, "tip": 0.09, "base": 0.78833}, {"x": 0.5033, "w": 0.02639, "tip": 0.15167, "base": 0.79333}, {"x": 0.54815, "w": 0.02639, "tip": 0.11083, "base": 0.79833}, {"x": 0.59169, "w": 0.02639, "tip": 0.0575, "base": 0.80083}, {"x": 0.63654, "w": 0.02639, "tip": 0.0575, "base": 0.79167}, {"x": 0.6814, "w": 0.02639, "tip": 0.07083, "base": 0.7925}, {"x": 0.72625, "w": 0.02639, "tip": 0.07167, "base": 0.78583}, {"x": 0.77111, "w": 0.02639, "tip": 0.21667, "base": 0.785}, {"x": 0.81464, "w": 0.02639, "tip": 0.24667, "base": 0.79583}, {"x": 0.8595, "w": 0.02639, "tip": 0.3225, "base": 0.8025}, {"x": 0.90435, "w": 0.02639, "tip": 0.345, "base": 0.8075}];

  /* a Catmull-Rom pass over the measured feet: the ridge the blades stand on
     becomes one continuous curve rather than a row of flat steps */
  /* the ridge as a continuous function of x, so a blade's foot can be cut to
     the curve across its own width rather than sitting on a flat edge */
  function lockRidge(u){
    var n = LOCK_RAW.length;
    var xs = LOCK_RAW.map(function(b){ return b.x; });
    if(u <= xs[0])   return LOCK_RAW[0].base;
    if(u >= xs[n-1]) return LOCK_RAW[n-1].base;
    var i = 0;
    while(i < n-2 && xs[i+1] < u) i++;
    var f = (u - xs[i]) / ((xs[i+1] - xs[i]) || 1);
    function base(k){ return LOCK_RAW[Math.max(0, Math.min(n-1, k))].base; }
    var p0 = base(i-1), p1 = base(i), p2 = base(i+1), p3 = base(i+2);
    var f2 = f*f, f3 = f2*f;
    return 0.5*((2*p1) + (-p0+p2)*f + (2*p0-5*p1+4*p2-p3)*f2 + (-p0+3*p1-3*p2+p3)*f3);
  }

  var LOCK_BLADES = (function(raw){
    var n = raw.length;
    function base(i){ return raw[Math.max(0, Math.min(n-1, i))].base; }
    return raw.map(function(b, i){
      var p0 = base(i-1), p1 = base(i), p2 = base(i+1), p3 = base(i+2);
      var f = 0.5, f2 = f*f, f3 = f2*f;
      var y = 0.5*((2*p1) + (-p0+p2)*f + (2*p0-5*p1+4*p2-p3)*f2 + (-p0+3*p1-3*p2+p3)*f3);
      /* mostly the smoothed line, with a little of the original kept */
      return { x:b.x, w:b.w, tip:b.tip, base: b.base*0.15 + y*0.85 };
    });
  })(LOCK_RAW);

  /* the range itself is now a photograph rather than drawn geometry */
  var plate = new Image(), plateOK = false;
  plate.onload = function(){ plateOK = true; needs = true; if(W) draw(); };
  plate.src = (window.innerWidth < 900 ? "assets/hero-range-sm.jpg" : "assets/hero-range.jpg");


  /* On a tablet the browser chrome retracts as you scroll, which changes the
     viewport height mid-gesture. Sizing the hero from that height made the
     whole composition — logo included — resize while scrolling. So the canvas
     is built once at the tallest height the screen can offer and simply runs
     off the bottom of the frame; the container crops it. Nothing re-lays out
     unless the width actually changes. */
  var baseH = 0;
  /* the height actually visible on arrival: the composition is laid out
     against this, while the canvas may run taller underneath it */
  var VH = 0;
  function stageHeight(){
    var vh = Math.max(window.innerHeight || 0, cv.clientHeight || 0);
    /* only touch devices retract their browser chrome, so only they need the
       headroom; on a desktop the viewport is the frame */
    var touch = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
    if(!touch) return vh;
    /* screen.width/height do not swap on rotation, so the tall value is wrong
       in landscape: take whichever edge matches the current orientation */
    var sw = (window.screen && window.screen.width)  || 0;
    var sh = (window.screen && window.screen.height) || 0;
    var landscape = window.innerWidth > window.innerHeight;
    var screenH = landscape ? Math.min(sw, sh) : Math.max(sw, sh);
    /* and never more than the toolbar could plausibly account for */
    return Math.max(vh, Math.min(screenH, Math.round(vh * 1.18)));
  }

  function resize(force){
    var wNow = cv.clientWidth;
    var hNow = stageHeight();
    /* only rebuild when the width changes, or the screen can suddenly offer
       appreciably more height (an actual rotation, not a retracting toolbar) */
    if(!force && wNow === W && hNow <= baseH * 1.02) return;

    dpr = Math.min(window.devicePixelRatio||1, 1.75);
    /* the visible height is only re-read on a real change of shape, never
       because a toolbar slid away mid-scroll */
    if(force || wNow !== W || !VH) VH = window.innerHeight || cv.clientHeight;
    W = wNow;
    baseH = Math.max(baseH, hNow);
    H = baseH;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    /* drawn at its full height and anchored to the top, so the extra hangs
       below the fold rather than squeezing the picture */
    cv.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    buildStars();
    needs = true;
  }

  var clamp = function(v,a,b){ return v<a?a:v>b?b:v; };
  var ease  = function(v){ return v<0.5 ? 4*v*v*v : 1-Math.pow(-2*v+2,3)/2; };
  var track = function(v,a,b){ return clamp((v-a)/(b-a),0,1); };

  /* deterministic pseudo-noise: the curtain reads as measured data, not sparkle */
  function n(x){ return Math.sin(x)*0.5 + Math.sin(x*2.37+1.7)*0.3 + Math.sin(x*5.11+4.2)*0.2; }

  /* ---- the ranges ----------------------------------------------------
     Midpoint displacement gave real peaks but a jagged, noisy edge that sat
     badly against the rest of the identity. These are built instead from a
     small sum of sines: continuous, smooth, and closer to an elevation
     profile than to a mountain photograph. Each range then carries contour
     lines across its face, so it reads as surveyed ground. */
  /* a small deterministic generator, so the star field is identical each load */
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var v = Math.imul(seed ^ seed>>>15, 1 | seed);
    v = v + Math.imul(v ^ v>>>7, 61 | v) ^ v;
    return ((v ^ v>>>14) >>> 0) / 4294967296; }; }

  var RIDGE_N = 129;

  /* The line itself is the drawing. Rather than sampling a profile into 129
     points and joining them — which is what put the small ripple into the
     curve — each range is a handful of control heights converted straight
     into cubic Bézier segments. Nine segments, no sampling, no noise. */
  /* ---- the star field ---------------------------------------------------
     Thousands of points is too many to draw individually every frame, so the
     field is split: everything that never twinkles is painted once into an
     offscreen layer and blitted, and only the few hundred that do twinkle are
     drawn live. Density costs nothing per frame that way. */
  var starLayer = null, live = [];

  function buildStars(){
    var rand = rng(20260816);

    /* a handful of loose concentrations, so the sky is not evenly sown */
    var clusters = [];
    for(var c=0;c<14;c++){
      clusters.push({x:rand()*W, y:rand()*H*0.90, r:(0.22+rand()*0.34)*Math.min(W,H)});
    }
    function place(){
      /* two thirds drift toward a concentration, the rest fall anywhere */
      if(rand() < 0.34){
        var cl = clusters[(rand()*clusters.length)|0];
        var ang = rand()*Math.PI*2;
        /* gaussian-ish falloff from the centre */
        var d = (rand()+rand()+rand())/3 * cl.r * 1.9;
        return [cl.x + Math.cos(ang)*d, cl.y + Math.sin(ang)*d*0.72];
      }
      return [rand()*W, Math.pow(rand(),1.18)*H*0.94];
    }

    function hue(){
      var r = rand();
      if(r < 0.06) return [38, 14];        /* a very few warmer */
      if(r < 0.46) return [212, 12];       /* pale blue-white */
      if(r < 0.74) return [205, 6];        /* slightly cool */
      return [0, 0];                       /* neutral */
    }

    var total = Math.round(W*H/330);
    var tiers = [
      {f:0.65, r:[0.30,0.55], a:[0.10,0.30], tw:0.06, glow:false},  /* the deep field */
      {f:0.20, r:[0.55,0.80], a:[0.22,0.46], tw:0.30, glow:false},
      {f:0.10, r:[0.75,1.05], a:[0.38,0.64], tw:0.60, glow:false},
      {f:0.04, r:[1.00,1.35], a:[0.58,0.82], tw:0.85, glow:false},
      {f:0.01, r:[1.25,1.70], a:[0.78,1.00], tw:1.00, glow:true}
    ];

    /* the static layer */
    starLayer = document.createElement('canvas');
    starLayer.width = Math.round(W*dpr); starLayer.height = Math.round(H*dpr);
    var sc = starLayer.getContext('2d');
    sc.setTransform(dpr,0,0,dpr,0,0);
    /* the layer holds only the stars now; the photograph supplies the sky,
       so the layer stays transparent and composites over it */
    live = [];

    for(var t0=0;t0<tiers.length;t0++){
      var T = tiers[t0], n = Math.round(total*T.f);
      for(var i=0;i<n;i++){
        var xy = place();
        if(xy[0] < -20 || xy[0] > W+20 || xy[1] < -20 || xy[1] > H) continue;
        var hs = hue();
        var st = {
          x: xy[0], y: xy[1],
          r: T.r[0] + rand()*(T.r[1]-T.r[0]),
          a: T.a[0] + rand()*(T.a[1]-T.a[0]),
          h: hs[0], s: hs[1],
          glow: T.glow && rand() < 0.7,
          tw: rand() < T.tw ? (0.35 + rand()*1.45) : 0,
          amp: 0.42 + rand()*0.52,
          ph: rand()*Math.PI*2
        };
        if(st.tw && !reduce) live.push(st);
        else paintStar(sc, st, st.a);
      }
    }

    /* the field thins out toward the skyline rather than stopping at a line:
       erased once here with a gradient, so no clip is needed per frame */
    var fade = sc.createLinearGradient(0, H*0.30, 0, H*0.60);
    fade.addColorStop(0,'rgba(0,0,0,0)');
    fade.addColorStop(1,'rgba(0,0,0,1)');
    sc.globalCompositeOperation = 'destination-out';
    sc.fillStyle = fade; sc.fillRect(0, H*0.30, W, H*0.70);
    sc.globalCompositeOperation = 'source-over';
  }

  /* one star: a crisp core, and for the brightest a tight halo behind it */
  function paintStar(c, st, alpha){
    if(alpha <= 0.01) return;
    var col = 'hsla('+st.h+','+st.s+'%,96%,';
    if(st.glow){
      var g = c.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r*3.4);
      g.addColorStop(0, col + (alpha*0.26).toFixed(3) + ')');
      g.addColorStop(1, col + '0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(st.x, st.y, st.r*3.4, 0, Math.PI*2); c.fill();
    }
    c.fillStyle = col + alpha.toFixed(3) + ')';
    if(st.r < 0.62){
      /* the smallest are drawn as a single device pixel so they stay sharp
         rather than being smeared away by antialiasing */
      var q = 1/dpr;
      c.fillRect(st.x, st.y, q, q);
    } else {
      c.beginPath(); c.arc(st.x, st.y, st.r, 0, Math.PI*2); c.fill();
    }
  }

  function drawSky(){
    if(starLayer){
      /* drawn slightly oversize so the parallax offset never exposes an edge */
      ctx.drawImage(starLayer, skyPx-8, skyPy-8, W+16, H+16);
    }
    for(var i=0;i<live.length;i++){
      var st = live[i];
      var depth = 1 - Math.max(0, Math.min(1, (st.y - H*0.30)/(H*0.30)));
      if(depth <= 0.01) continue;
      var f = (1 - st.amp*0.5 + st.amp*0.5*Math.sin(t*st.tw + st.ph)) * depth;
      var x0 = st.x; st.x += skyPx; var y0 = st.y; st.y += skyPy;
      paintStar(ctx, st, st.a * f);
      st.x = x0; st.y = y0;
    }
  }

  /* ---- shooting stars --------------------------------------------------
     A sharp head with a concentrated bloom, and a trail that brightens close
     behind it before fading away entirely. Every one differs in path, length,
     speed and brightness. */
  /* the streaks currently in flight; this array used to live in the sky
     module that the photograph replaced */
  var shots = [], nextShot = 0;

  function newShot(){
    var big = Math.random() < 0.20;
    var fromLeft = Math.random() < 0.30;
    var drop = 0.30 + Math.random()*0.75;
    var speed = (big ? 4.4 : 2.7) + Math.random()*2.4;
    var dirx = fromLeft ? 1 : -1;
    var m = Math.hypot(1, drop);
    return {
      x: fromLeft ? W*(-0.05 + Math.random()*0.35) : W*(0.30 + Math.random()*0.80),
      y: H*(0.02 + Math.random()*0.46),
      vx: dirx*speed/m, vy: speed*drop/m,
      len: (big ? 150 : 70) + Math.random()*110,
      w: big ? 1.6 : 0.95,
      bright: (big ? 0.90 : 0.48) + Math.random()*0.28,
      life: 0, max: 46 + Math.random()*44
    };
  }

  function drawShots(){
    for(var k=shots.length-1;k>=0;k--){
      var sh = shots[k];
      var f = sh.life/sh.max;
      /* quick in, long out, so it never blinks on or off */
      var fade = f < 0.12 ? f/0.12 : Math.pow(1-(f-0.12)/0.88, 1.5);
      var a = sh.bright * fade;
      var m = Math.hypot(sh.vx, sh.vy) || 1;
      var tx = sh.x - (sh.vx/m)*sh.len, ty = sh.y - (sh.vy/m)*sh.len;

      var lg = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
      lg.addColorStop(0.00,'rgba(242,250,255,'+(a).toFixed(3)+')');
      lg.addColorStop(0.08,'rgba(214,236,255,'+(a*0.78).toFixed(3)+')');
      lg.addColorStop(0.28,'rgba(176,212,248,'+(a*0.34).toFixed(3)+')');
      lg.addColorStop(0.62,'rgba(142,184,232,'+(a*0.10).toFixed(3)+')');
      lg.addColorStop(1.00,'rgba(120,166,220,0)');
      ctx.strokeStyle = lg; ctx.lineCap = 'round'; ctx.lineWidth = sh.w;
      ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(tx, ty); ctx.stroke();

      /* bloom, then the head itself, kept small and sharp */
      var bg = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, sh.w*8);
      bg.addColorStop(0,'rgba(216,238,255,'+(a*0.42).toFixed(3)+')');
      bg.addColorStop(0.45,'rgba(180,214,255,'+(a*0.12).toFixed(3)+')');
      bg.addColorStop(1,'rgba(160,200,250,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.w*8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(252,254,255,'+(a*0.98).toFixed(3)+')';
      ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.w*0.75, 0, Math.PI*2); ctx.fill();

      sh.x += sh.vx; sh.y += sh.vy; sh.life++;
      if(sh.life > sh.max || sh.x < -200 || sh.x > W+200 || sh.y > H*0.95) shots.splice(k,1);
    }
  }

  /* ---- pointer depth ---------------------------------------------------
     A few pixels of separation between the ranges, eased so it never snaps.
     Enough to feel dimensional, not enough to notice as an effect. */
  var pmx = 0, pmy = 0, tmx = 0, tmy = 0, skyPx = 0, skyPy = 0;
  if(!reduce && window.matchMedia('(hover:hover)').matches){
    window.addEventListener('pointermove', function(e){
      tmx = (e.clientX/window.innerWidth  - 0.5) * 2;
      tmy = (e.clientY/window.innerHeight - 0.5) * 2;
    }, {passive:true});
  }

  function draw(){
    /* the pointer offset chases its target, so nothing tracks the cursor exactly */
    pmx += (tmx - pmx) * 0.045;
    pmy += (tmy - pmy) * 0.045;
    skyPx = -pmx * 5; skyPy = -pmy * 3;

    if(!starLayer) buildStars();

    /* --- the plate ------------------------------------------------------
       Covered to the frame and anchored low, so the range and the light in
       the valley always hold the bottom of the hero whatever the viewport
       shape. It lifts a little as the section is scrolled, and the stars and
       wordmark are drawn over it. */
    ctx.fillStyle = '#02040C';
    ctx.fillRect(0,0,W,H);

    var horizon = H*0.62;                 /* where the skyline sits in frame */
    if(plateOK){
      var ir = plate.width/plate.height;
      var dw = W, dh = W/ir;
      if(dh < VH*1.05){ dh = VH*1.05; dw = dh*ir; }
      /* pushed down so the range sits below the lockup rather than behind it:
         the plate's own skyline lands around two thirds down the frame */
      var ox = (W - dw)/2 - pmx*10;
      /* seated so the photograph's skyline lands about two thirds down the
         frame, which puts the range under the wordmark rather than behind it */
      var oy = VH - dh*0.81 - pmy*5;
      ctx.drawImage(plate, ox, oy, dw, dh);
      horizon = oy + dh*0.40;   /* the skyline sits at the top of the range band */
    }

    /* a streak every four to eight seconds, timed rather than diced, and now
       and then a second following close behind */
    if(!reduce){
      if(!nextShot) nextShot = t + 1.2 + Math.random()*2.5;
      if(t > nextShot){
        shots.push(newShot());
        if(Math.random() < 0.22) shots.push(newShot());
        nextShot = t + 4 + Math.random()*4;
      }
    }

    /* the stars sit over the plate and thin out toward the skyline */
    drawSky();
    drawShots();

    /* the lockup, rising with the scroll before the range covers it. The
       blades are drawn live and the wordmark laid over them, so the mark
       breathes without the logo itself being redrawn. */
    if(mark.complete && mark.naturalWidth){
      var narrow = W < 700;
      var mh = Math.min(VH*(narrow?0.52:0.56), W*0.42);
      var mw = mh * mark.naturalWidth / mark.naturalHeight;
      var mx = (W-mw)/2 - pmx*7;
      /* the blades fade out toward their tips, so the eye reads the mark by
         its bright lower half and the wordmark; the box is set high enough
         that that visible mass sits on the centre line */
      var my = VH*0.415 - mh/2;

      ctx.save();
      ctx.shadowColor = 'rgba(4,14,22,.5)'; ctx.shadowBlur = 26;

      for(var bi=0; bi<LOCK_BLADES.length; bi++){
        var bd = LOCK_BLADES[bi];

        /* one crest travelling across the mark, with a slower swell beneath
           it, so the curtain moves as a sheet rather than as separate bars */
        var travel = t*0.40 - bd.x*6.2;
        var swell  = 0.66*Math.sin(travel) + 0.34*Math.sin(travel*0.47 + t*0.13);
        var reach  = 0.78 + 0.20*swell;   /* the peaks are held down a little */

        var cx = mx + bd.x*mw;
        var bw = bd.w*mw;
        var yb = my + lockRidge(bd.x)*mh;
        var yt = yb - (bd.base - bd.tip)*mh*reach;

        /* colour drifts along the same wave: green at the foot always, the
           point running up through teal and cyan and occasionally to violet */
        /* The artwork runs pale mint at the foot to a deeper green at the tip,
           so the animation keeps that direction and only drifts the hue:
           mostly green, occasionally carried up through teal toward blue. */
        var band = 0.5 + 0.5*Math.sin(t*0.19 - bd.x*4.0);
        var wash = 0.5 + 0.5*Math.sin(t*0.085 + 1.2);
        var mix  = Math.pow(Math.max(0, Math.min(1, 0.58*band + 0.52*wash - 0.12)), 2.0);

        var g = ctx.createLinearGradient(0, yb, 0, yt);
        /* foot: pale mint, as drawn */
        g.addColorStop(0,    'hsl(' + (124 + 14*mix).toFixed(0) + ',' + (56 + 8*mix).toFixed(0) + '%,77%)');
        g.addColorStop(0.45, 'hsl(' + (136 + 34*mix).toFixed(0) + ',' + (36 + 16*mix).toFixed(0) + '%,60%)');
        /* tip: deeper, and where the wave peaks it runs to teal and blue */
        g.addColorStop(1,    'hsl(' + (152 + 62*mix).toFixed(0) + ',' + (40 + 22*mix).toFixed(0) + '%,' + (27 + 12*mix).toFixed(0) + '%)');
        ctx.fillStyle = g;

        /* the foot is cut to the ridge across the blade's own width, so the
           mountain line running under the whole mark stays a single curve */
        var uL = bd.x - bd.w/2, uR = bd.x + bd.w/2;
        var yL = my + lockRidge(uL)*mh;
        var yR = my + lockRidge(uR)*mh;
        var yM = my + lockRidge(bd.x)*mh;
        /* the control point that makes the segment pass through the midpoint */
        var yC = 2*yM - (yL + yR)/2;

        ctx.beginPath();
        ctx.moveTo(cx - bw/2, yL);
        ctx.quadraticCurveTo(cx, yC, cx + bw/2, yR);
        ctx.lineTo(cx + bw*0.05, yt);
        ctx.lineTo(cx - bw*0.05, yt);
        ctx.closePath();
        ctx.fill();
      }

      /* the wordmark sits over them, unchanged */
      ctx.drawImage(mark, mx, my - pmy*4, mw, mh);
      ctx.restore();
    }

    if(cue) cue.style.opacity = (1 - track(p,0.02,0.12)).toFixed(2);
    needs = false;
  }

  function progress(){
    var rect = stage.getBoundingClientRect();
    var span = stage.offsetHeight - window.innerHeight;
    return span > 0 ? clamp(-rect.top/span, 0, 1) : 0;
  }

  var visible = true;
  /* The hero is fill-bound rather than CPU-bound: the work per frame is a
     large blit plus several full-width fills. Twinkling reads identically at
     30fps, so the canvas is redrawn on a fixed 30fps budget while scrolling
     still updates immediately. Halves the raster cost for no visible change. */
  var lastDraw = 0, lastP = -1;
  function frame(now){
    if(!reduce){
      t += 0.016;
      var np = progress();
      var moved = np !== p;
      if(moved) p = np;
      if(visible && (moved || now - lastDraw > 33)){
        lastDraw = now;
        draw();
      }
    }
    requestAnimationFrame(frame);
  }

  /* The hero only exists at desktop widths. A tablet opened in portrait gets
     the phone layout, where this canvas has no size; if it is then turned to
     landscape the hero must start at that point rather than wait for a reload. */
  var heroStarted = false;
  function startHero(){
    if(heroStarted || !cv || !stage || !cv.offsetWidth || !cv.offsetHeight) return false;
    heroStarted = true;
    window.addEventListener('resize', function(){ resize(false); p = progress(); draw(); });
    window.addEventListener('orientationchange', function(){
      baseH = 0; setTimeout(function(){ resize(true); p = progress(); draw(); }, 120);
    });
    resize(true);
    if(reduce){
      p = 0.04; draw();
    } else {
      p = progress();
      frame();
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(es){
          es.forEach(function(e){ visible = e.isIntersecting; });
        },{threshold:0}).observe(cv);
      }
    }
    return true;
  }
  if(!startHero()){
    var tryStart = function(){ if(startHero()){
      window.removeEventListener('resize', tryStart);
      window.removeEventListener('orientationchange', tryLater);
    }};
    var tryLater = function(){ setTimeout(tryStart, 160); };
    window.addEventListener('resize', tryStart);
    window.addEventListener('orientationchange', tryLater);
  }

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

/* ---- fallback renderer: canvas 2d, used when WebGL or the three.js CDN is unavailable ---- */
window.__rig2D = function(){
  var sec = document.getElementById('setup');
  var cv  = document.getElementById('rig');
  if(!sec || !cv) return;
  if(!cv.offsetWidth || !cv.offsetHeight) return;
  var ctx = cv.getContext('2d');
  var readout = document.getElementById('readout');
  var beats = [].slice.call(sec.querySelectorAll('.beat'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canFilter = (function(){ try{ ctx.filter='blur(1px)'; var ok = ctx.filter!=='none'; ctx.filter='none'; return ok; }catch(e){ return false; } })();

  var W=0,H=0,dpr=1,s=0,lastS=-1,visible=false;

  /* film grain, generated once */
  var grain = document.createElement('canvas'); grain.width=grain.height=128;
  (function(){
    var g=grain.getContext('2d'), im=g.createImageData(128,128), d=im.data;
    for(var i=0;i<d.length;i+=4){
      var v=128+(Math.random()-0.5)*46;
      d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
    }
    g.putImageData(im,0,0);
  })();

  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    lastS = -1;
  }

  var clamp = function(v,a,b){ return v<a?a:v>b?b:v; };
  var track = function(v,a,b){ return clamp((v-a)/(b-a),0,1); };
  var easeOut = function(v){ return 1-Math.pow(1-v,3); };
  var easeIO  = function(v){ return v<0.5 ? 4*v*v*v : 1-Math.pow(-2*v+2,3)/2; };

  /* ---------- transforms ---------- */
  function T(x,y,z){ return function(p){ return [p[0]+x,p[1]+y,p[2]+z]; }; }
  function S3(x,y,z){ return function(p){ return [p[0]*x,p[1]*y,p[2]*z]; }; }
  function RX(a){ var c=Math.cos(a),n=Math.sin(a); return function(p){ return [p[0], p[1]*c-p[2]*n, p[1]*n+p[2]*c]; }; }
  function RY(a){ var c=Math.cos(a),n=Math.sin(a); return function(p){ return [p[0]*c+p[2]*n, p[1], -p[0]*n+p[2]*c]; }; }
  function RZ(a){ var c=Math.cos(a),n=Math.sin(a); return function(p){ return [p[0]*c-p[1]*n, p[0]*n+p[1]*c, p[2]]; }; }
  function ch(){ var f=arguments; return function(p){ for(var i=0;i<f.length;i++) p=f[i](p); return p; }; }
  var ID = function(p){ return p; };
  function unit(v){ var m=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1; return [v[0]/m,v[1]/m,v[2]/m]; }
  function dirOf(M,d){ var o=M([0,0,0]), q=M(d); return unit([q[0]-o[0],q[1]-o[1],q[2]-o[2]]); }

  /* ---------- camera ---------- */
  var cam = {ry:-0.62, rx:-0.15, dist:6.3, f:3.0, look:1.02, ox:0, oy:0, scale:1};
  var VIEW=[0,0,1], EYE=[0,0,-1];
  function setView(){
    var cy=Math.cos(cam.ry), sy=Math.sin(cam.ry), cx=Math.cos(cam.rx), sx=Math.sin(cam.rx);
    VIEW = [ sy*cx, -sx, -cy*cx ];
    EYE  = [-VIEW[0],-VIEW[1],-VIEW[2]];
  }
  function project(v){
    var x=v[0], y=v[1]-cam.look, z=v[2];
    var c=Math.cos(cam.ry), n=Math.sin(cam.ry);
    var X = x*c + z*n, Z = -x*n + z*c;
    var c2=Math.cos(cam.rx), n2=Math.sin(cam.rx);
    var Y = y*c2 - Z*n2, Z2 = y*n2 + Z*c2;
    var zc = Z2 + cam.dist;
    var k = cam.f/Math.max(0.2,zc) * cam.scale;
    return [cam.ox + X*k, cam.oy - Y*k, zc];
  }

  /* ---------- lighting ---------- */
  var KEY  = unit([-0.55, 0.80, 0.62]);
  var FILL = unit([ 0.70, 0.15,-0.45]);

  /* [specular, shininess, fresnel, metalness] */
  var MAT = {
    plastic:[0.30, 26, 0.16, 0.10],
    paint  :[0.45, 40, 0.14, 0.16],
    metal  :[0.80, 64, 0.26, 0.85],
    rubber :[0.05,  8, 0.07, 0.02],
    glass  :[1.00, 96, 0.50, 0.60]
  };

  var CACHE={};
  function rgbOf(h){ return CACHE[h] || (CACHE[h] = [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]); }

  /* two-band environment: cool sky above, dark ground below */
  var ENV_SKY=[118,143,152], ENV_GND=[10,20,26];

  function litColour(n, hex, mat){
    var base = rgbOf(hex), m = mat || MAT.plastic;
    var d1 = Math.max(0, n[0]*KEY[0]+n[1]*KEY[1]+n[2]*KEY[2]);
    var d2 = Math.max(0, n[0]*FILL[0]+n[1]*FILL[1]+n[2]*FILL[2]);
    var ndv = Math.max(0, n[0]*EYE[0]+n[1]*EYE[1]+n[2]*EYE[2]);
    var hv = unit([KEY[0]+EYE[0], KEY[1]+EYE[1], KEY[2]+EYE[2]]);
    var sp = Math.pow(Math.max(0, n[0]*hv[0]+n[1]*hv[1]+n[2]*hv[2]), m[1]) * m[0];
    var fres = Math.pow(1-ndv, 3) * m[2];
    /* reflected eye vector, sampled against the two-band environment */
    var rd = 2*ndv;
    var ry = rd*n[1] - EYE[1];
    var envMix = clamp(ry*0.5+0.5, 0, 1);
    var er = ENV_GND[0]+(ENV_SKY[0]-ENV_GND[0])*envMix;
    var eg = ENV_GND[1]+(ENV_SKY[1]-ENV_GND[1])*envMix;
    var eb = ENV_GND[2]+(ENV_SKY[2]-ENV_GND[2])*envMix;
    var mt = m[3];
    var amb = 0.30;
    var r = base[0]*(amb + 0.72*d1 + 0.16*d2)*(1-0.40*mt) + er*0.52*mt + 250*sp + 118*fres;
    var g = base[1]*(amb + 0.72*d1 + 0.24*d2)*(1-0.40*mt) + eg*0.52*mt + 250*sp + 146*fres;
    var b = base[2]*(amb + 0.72*d1 + 0.31*d2)*(1-0.40*mt) + eb*0.52*mt + 244*sp + 160*fres;
    return 'rgb('+(r<0?0:r>255?255:r|0)+','+(g<0?0:g>255?255:g|0)+','+(b<0?0:b>255?255:b|0)+')';
  }

  /* ---------- geometry buffer ---------- */
  var faces=[], shadow=[], castOn=true;
  function shadowPoint(p){
    var t = p[1]/KEY[1];
    return project([p[0]-KEY[0]*t, 0.002, p[2]-KEY[2]*t]);
  }
  function poly(pts, hex, mat, nA, nB){
    var a=pts[0], b=pts[1], c=pts[2];
    var e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    var nx=e1[1]*e2[2]-e1[2]*e2[1], ny=e1[2]*e2[0]-e1[0]*e2[2], nz=e1[0]*e2[1]-e1[1]*e2[0];
    var m=Math.sqrt(nx*nx+ny*ny+nz*nz); if(!m) return;
    var n=[nx/m,ny/m,nz/m];
    if(castOn){
      var sh=[]; for(var q=0;q<pts.length;q++) sh.push(shadowPoint(pts[q]));
      shadow.push(sh);
    }
    if(n[0]*VIEW[0]+n[1]*VIEW[1]+n[2]*VIEW[2] > -0.02) return;
    var sp=[], z=0;
    for(var i=0;i<pts.length;i++){ var p2=project(pts[i]); sp.push(p2); z+=p2[2]; }
    var f={p:sp, z:z/pts.length};
    if(nA && nB){
      f.g=[ (sp[0][0]+sp[1][0])/2, (sp[0][1]+sp[1][1])/2,
            (sp[2][0]+sp[3][0])/2, (sp[2][1]+sp[3][1])/2,
            litColour(nA,hex,mat), litColour(nB,hex,mat) ];
    } else {
      f.c = litColour(n,hex,mat);
    }
    faces.push(f);
  }
  function box(w,h,d,hex,M,mat){
    var x=w/2,y=h/2,z=d/2;
    var v=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]].map(M);
    poly([v[4],v[5],v[6],v[7]],hex,mat); poly([v[1],v[0],v[3],v[2]],hex,mat);
    poly([v[5],v[1],v[2],v[6]],hex,mat); poly([v[0],v[4],v[7],v[3]],hex,mat);
    poly([v[3],v[7],v[6],v[2]],hex,mat); poly([v[0],v[1],v[5],v[4]],hex,mat);
  }
  /* cylinder along local Y, smooth-shaded across each strip */
  function cyl(r1,r2,h,seg,hex,M,mat,caps){
    var bot=[], top=[], dir=[];
    for(var i=0;i<seg;i++){
      var t=i/seg*Math.PI*2, cs=Math.cos(t), sn=Math.sin(t);
      bot.push(M([r1*cs,-h/2,r1*sn]));
      top.push(M([r2*cs, h/2,r2*sn]));
      dir.push(dirOf(M,[cs,0,sn]));
    }
    for(var k=0;k<seg;k++){
      var j=(k+1)%seg;
      poly([bot[k],top[k],top[j],bot[j]], hex, mat, dir[k], dir[j]);
    }
    if(caps!==false){ poly(top.slice().reverse(),hex,mat); poly(bot,hex,mat); }
  }
  function cylZ(r1,r2,len,seg,hex,M,mat,caps){ cyl(r1,r2,len,seg,hex,ch(RX(Math.PI/2),M),mat,caps); }
  function disc(r,seg,hex,M,mat){
    var a=[]; for(var i=0;i<seg;i++){ var t=i/seg*Math.PI*2; a.push(M([r*Math.cos(t),0,r*Math.sin(t)])); }
    poly(a.reverse(),hex,mat);
  }

  /* ---------- palette ---------- */
  var YEL='#D9B12A', YEL_D='#93741A', RED='#B81E30', DARK='#23282B', BLACK='#15191B',
      WHITE='#EDEFEC', WARM='#EEF1F1', GREEN='#9BB990', GREEN_D='#7E9E74',
      LENS='#1E7FB0', STEEL='#B6C0C4', ALU='#A9B4B8', SCREEN='#16301F';

  function build(){
    faces.length=0; shadow.length=0;

    var enter  = easeOut(track(s,0.00,0.16));
    var spread = easeIO (track(s,0.10,0.38));
    var drop   = easeIO (track(s,0.32,0.54));
    var swing  = easeIO (track(s,0.48,0.76));
    var tilt   = easeIO (track(s,0.54,0.82));

    cam.ry = -0.74 + 0.30*easeIO(track(s,0,1));
    var push = easeIO(track(s,0.34,0.80));
    cam.look = 1.02 + 0.62*push;
    cam.dist = 6.3 - 3.0*push;
    cam.rx = -0.15 + 0.05*push;
    setView();

    var legLen=1.46, ang=(5+18*spread)*Math.PI/180;
    var hubY = legLen*Math.cos(ang);

    /* ---- tripod ---- */
    castOn = true;
    for(var i=0;i<3;i++){
      var yaw=i*Math.PI*2/3+0.42;
      var L=function(t){ return ch(t, RZ(-ang), RY(yaw), T(0,hubY,0)); };

      box(0.135,0.085,0.115, DARK, L(T(0,-0.055,0)), MAT.rubber);
      cyl(0.019,0.019,0.165,10, STEEL, L(ch(RZ(Math.PI/2), T(0,-0.055,0))), MAT.metal);
      cyl(0.026,0.026,0.014,6, STEEL, L(ch(RZ(Math.PI/2), T(0.085,-0.055,0))), MAT.metal);

      box(0.030,0.80,0.084, YEL, L(T(-0.047,-0.50,0)), MAT.paint);
      box(0.030,0.80,0.084, YEL, L(T( 0.047,-0.50,0)), MAT.paint);
      box(0.031,0.80,0.012, YEL_D, L(T(-0.047,-0.50,0.044)), MAT.paint);
      box(0.031,0.80,0.012, YEL_D, L(T( 0.047,-0.50,0.044)), MAT.paint);

      box(0.150,0.088,0.104, BLACK, L(T(0,-0.905,0)), MAT.rubber);
      cyl(0.015,0.015,0.135,8, STEEL, L(ch(RZ(Math.PI/2), T(0,-0.905,0.022))), MAT.metal);
      cyl(0.031,0.031,0.024,12, DARK, L(ch(RZ(Math.PI/2), T(0.084,-0.905,0.022))), MAT.metal);

      box(0.056,0.62,0.062, ALU, L(T(0,-1.20,0)), MAT.metal);
      box(0.015,0.62,0.064, STEEL, L(T(0,-1.20,0.001)), MAT.metal);
      box(0.072,0.078,0.072, BLACK, L(T(0,-1.475,0)), MAT.rubber);
      cyl(0.020,0.004,0.078,8, STEEL, L(T(0,-1.548,0)), MAT.metal);
      box(0.108,0.017,0.078, DARK, L(T(0,-1.442,0.058)), MAT.rubber);
    }

    /* ---- tripod head ---- */
    cyl(0.238,0.228,0.058,3, RED, ch(RY(0.42), T(0,hubY+0.029,0)), MAT.paint);
    cyl(0.150,0.150,0.032,18, RED, T(0,hubY+0.070,0), MAT.paint);
    cyl(0.029,0.029,0.165,12, STEEL, T(0,hubY-0.058,0), MAT.metal);
    cyl(0.052,0.052,0.032,14, DARK, T(0,hubY-0.150,0), MAT.metal);

    var out={enter:enter, hubY:hubY, drop:drop, tilt:tilt, swing:swing, lens:null};
    if(drop < 0.002){ return out; }

    /* ---- tribrach ---- */
    var dy=(1-drop)*0.85, bY=hubY+0.10+dy;
    cyl(0.126,0.108,0.086,16, DARK, T(0,bY,0), MAT.plastic);
    cyl(0.133,0.133,0.013,16, BLACK, T(0,bY-0.049,0), MAT.rubber);
    for(var j=0;j<3;j++){
      var a2=j*Math.PI*2/3+0.9;
      var F=function(t){ return ch(t, RY(a2), T(0,bY,0)); };
      cyl(0.013,0.013,0.072,10, STEEL, F(T(0.100,-0.030,0)), MAT.metal);
      cyl(0.031,0.031,0.026,14, DARK, F(T(0.100,-0.074,0)), MAT.plastic);
    }
    cyl(0.025,0.025,0.015,12, WARM, T(0.086,bY+0.049,0.046), MAT.glass);

    cyl(0.109,0.100,0.072,18, WHITE, T(0,bY+0.079,0), MAT.plastic);
    cyl(0.113,0.113,0.011,18, ALU,   T(0,bY+0.046,0), MAT.metal);

    /* ---- alidade: wide housing, arms carrying the trunnion ---- */
    var yaw2=(-58+155*swing)*Math.PI/180;
    var A=function(t){ return ch(t, RY(yaw2), T(0,bY+0.108,0)); };

    cyl(0.128,0.134,0.050,20, DARK, A(T(0,0.025,0)), MAT.plastic);          /* standing axis plate */
    box(0.368,0.316,0.252, GREEN, A(T(0,0.202,0)), MAT.paint);
    box(0.352,0.030,0.238, GREEN_D, A(T(0,0.058,0)), MAT.paint);

    for(var sd=-1; sd<=1; sd+=2){
      box(0.098,0.306,0.228, GREEN, A(T(sd*0.135,0.500,0)), MAT.paint);
      cyl(0.050,0.050,0.028,18, GREEN_D, A(ch(RZ(Math.PI/2), T(sd*0.186,0.500,0))), MAT.paint);
    }
    box(0.286,0.286,0.052, GREEN, A(T(0,0.492,-0.086)), MAT.paint);          /* rear panel */

    cyl(0.038,0.032,0.054,18, DARK, A(ch(RZ(Math.PI/2), T(-0.200,0.430,0.02))), MAT.plastic);
    cyl(0.032,0.028,0.042,18, DARK, A(ch(RZ(Math.PI/2), T( 0.200,0.240,0.02))), MAT.plastic);

    /* handle: a flat bar arch */
    for(var hs=0; hs<11; hs++){
      var tm=((hs+0.5)/11)*Math.PI;
      var hx=-Math.cos(tm)*0.136, hy=0.648+Math.sin(tm)*0.136;
      box(0.046,0.040,0.064, GREEN, A(ch(RZ(-(tm-Math.PI/2)), T(hx,hy,0))), MAT.paint);
    }
    for(var hd=-1; hd<=1; hd+=2)
      box(0.058,0.052,0.064, GREEN, A(T(hd*0.136,0.622,0)), MAT.paint);

    /* the big angled control face */
    var CF=function(t){ return A(ch(t, RX(0.46), RY(Math.PI), T(0,0.196,-0.150))); };
    box(0.300,0.190,0.026, DARK, CF(ID), MAT.plastic);
    box(0.282,0.172,0.006, DARK, CF(T(0,0,0.016)), MAT.plastic);
    box(0.250,0.070,0.004, SCREEN, CF(T(0,0.045,0.020)), MAT.glass);
    for(var ky=0;ky<3;ky++) for(var kx=0;kx<5;kx++)
      box(0.036,0.018,0.005, '#C6CDCF', CF(T(-0.096+kx*0.048,-0.028-ky*0.030,0.020)), MAT.plastic);
    for(var cs=-1; cs<=1; cs+=2)
      box(0.020,0.190,0.030, WHITE, CF(T(cs*0.150,0,-0.004)), MAT.plastic);

    /* ---- telescope: short, thick, recessed between the arms ---- */
    var pit=(22-25*tilt)*Math.PI/180;
    var TE=function(t){ return A(ch(t, RX(pit), T(0,0.500,0))); };
    box(0.168,0.166,0.236, WHITE, TE(ID), MAT.plastic);
    box(0.176,0.040,0.070, GREEN_D, TE(T(0,-0.078,-0.020)), MAT.paint);
    cylZ(0.088,0.088,0.052,26, DARK, TE(T(0,0,0.128)), MAT.plastic, false);
    disc(0.066,26, LENS, TE(ch(RX(-Math.PI/2), T(0,0,0.152))), MAT.glass);
    cylZ(0.052,0.052,0.056,20, DARK, TE(T(0,0,-0.130)), MAT.plastic, false);
    cylZ(0.057,0.057,0.032,20, DARK, TE(T(0,0,-0.152)), MAT.rubber, false);
    box(0.058,0.040,0.022, DARK, TE(T(0,0.078,0.108)), MAT.plastic);
    box(0.030,0.058,0.030, DARK, TE(T(0,0.098,0.010)), MAT.plastic);
    for(var td=-1; td<=1; td+=2)
      cyl(0.042,0.042,0.026,18, GREEN_D, TE(ch(RZ(Math.PI/2), T(td*0.086,0,0))), MAT.paint);

    /* ---- antenna ---- */
    cyl(0.011,0.011,0.24,10, ALU, A(ch(RZ(-0.08), T(-0.150,0.590,-0.128))), MAT.metal);
    cyl(0.017,0.013,0.040,10, BLACK, A(ch(RZ(-0.08), T(-0.150,0.720,-0.128))), MAT.rubber);


    /* where the objective sits on screen, for the glint */
    out.lens = project(TE(T(0,0,0.152))([0,0,0]));
    out.lensN = dirOf(TE(ID),[0,0,1]);
    return out;
  }

  /* ---------- render ---------- */
  function draw(){
    ctx.clearRect(0,0,W,H);
    var narrow = W<620;
    cam.scale = Math.min(H*(narrow?0.56:0.62), W*1.45);
    cam.ox = W*(narrow?0.50:0.52);
    cam.oy = H*0.56;

    var st = build();
    var enter = st.enter;
    if(enter <= 0.001) return;

    ctx.save();
    ctx.globalAlpha = enter;
    ctx.translate((1-enter)*W*0.42, 0);

    /* ambient occlusion pool on the ground */
    var gy = cam.oy + cam.scale*0.50;
    var ao = ctx.createRadialGradient(cam.ox, gy, 2, cam.ox, gy, cam.scale*0.46);
    ao.addColorStop(0,'rgba(3,12,17,.55)'); ao.addColorStop(0.5,'rgba(3,12,17,.24)'); ao.addColorStop(1,'rgba(3,12,17,0)');
    ctx.fillStyle = ao;
    ctx.beginPath(); ctx.ellipse(cam.ox, gy, cam.scale*0.46, cam.scale*0.14, 0, 0, Math.PI*2); ctx.fill();

    /* cast shadow: one union fill, blurred once */
    if(shadow.length){
      ctx.save();
      if(canFilter) ctx.filter = 'blur('+(cam.scale*0.018).toFixed(1)+'px)';
      ctx.globalAlpha = enter*0.42;
      ctx.fillStyle = 'rgba(2,10,15,1)';
      ctx.beginPath();
      for(var i2=0;i2<shadow.length;i2++){
        var sp2=shadow[i2];
        ctx.moveTo(sp2[0][0], sp2[0][1]);
        for(var j2=1;j2<sp2.length;j2++) ctx.lineTo(sp2[j2][0], sp2[j2][1]);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }

    /* the instrument */
    faces.sort(function(a,b){ return b.z-a.z; });
    for(var i=0;i<faces.length;i++){
      var f=faces[i], pt=f.p, style;
      if(f.g){
        var lg2 = ctx.createLinearGradient(f.g[0],f.g[1],f.g[2],f.g[3]);
        lg2.addColorStop(0,f.g[4]); lg2.addColorStop(1,f.g[5]);
        style = lg2;
      } else style = f.c;
      ctx.fillStyle = style; ctx.strokeStyle = style; ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(pt[0][0], pt[0][1]);
      for(var j=1;j<pt.length;j++) ctx.lineTo(pt[j][0], pt[j][1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    /* line of sight */
    var beam = track(s,0.72,0.94);
    if(beam>0 && st.drop>0.9){
      var pit=(22-25*st.tilt)*Math.PI/180;
      var yaw2=(-58+155*st.swing)*Math.PI/180;
      var bY=st.hubY+0.10;
      var mk=function(d){ return ch(T(0,0,d), RX(pit), T(0,0.470,0), RY(yaw2), T(0,bY+0.114,0))([0,0,0]); };
      var a1=project(mk(0.26)), a2=project(mk(0.30+7.5*beam));
      var halo=ctx.createLinearGradient(a1[0],a1[1],a2[0],a2[1]);
      halo.addColorStop(0,'rgba(57,180,74,.22)'); halo.addColorStop(1,'rgba(29,172,181,0)');
      ctx.strokeStyle=halo; ctx.lineWidth=7;
      ctx.beginPath(); ctx.moveTo(a1[0],a1[1]); ctx.lineTo(a2[0],a2[1]); ctx.stroke();
      var lg=ctx.createLinearGradient(a1[0],a1[1],a2[0],a2[1]);
      lg.addColorStop(0,'rgba(130,240,160,.95)'); lg.addColorStop(0.35,'rgba(57,180,74,.7)');
      lg.addColorStop(1,'rgba(29,172,181,0)');
      ctx.strokeStyle=lg; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(a1[0],a1[1]); ctx.lineTo(a2[0],a2[1]); ctx.stroke();
    }

    /* glint on the objective when it turns toward the light */
    if(st.lens && st.lensN){
      var toKey = st.lensN[0]*KEY[0]+st.lensN[1]*KEY[1]+st.lensN[2]*KEY[2];
      var toEye = st.lensN[0]*EYE[0]+st.lensN[1]*EYE[1]+st.lensN[2]*EYE[2];
      var gl = Math.max(0, toEye)*0.55 + Math.max(0, toKey)*0.45;
      if(gl > 0.15){
        var rr = cam.scale*0.075*gl;
        var fl = ctx.createRadialGradient(st.lens[0],st.lens[1],0,st.lens[0],st.lens[1],rr);
        fl.addColorStop(0,'rgba(215,245,255,'+(0.55*gl).toFixed(2)+')');
        fl.addColorStop(0.4,'rgba(120,200,235,'+(0.20*gl).toFixed(2)+')');
        fl.addColorStop(1,'rgba(90,180,220,0)');
        ctx.fillStyle=fl;
        ctx.beginPath(); ctx.arc(st.lens[0],st.lens[1],rr,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();

    /* bloom + grain, applied only where the frame is already painted */
    if(canFilter){
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=0.12; ctx.filter='blur(8px)';
      ctx.drawImage(cv,0,0,W,H);
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=0.055;
    var pat=ctx.createPattern(grain,'repeat');
    ctx.fillStyle=pat; ctx.fillRect(0,0,W,H);
    ctx.restore();

    if(readout) readout.classList.toggle('live', s>0.80);
    var live = s<0.34 ? 0 : s<0.62 ? 1 : 2;
    for(var k=0;k<beats.length;k++) beats[k].classList.toggle('live', k===live);
  }

  function progress(){ return window.__sectionProgress(sec); }
  function frame(){
    if(visible){
      s = progress();
      if(Math.abs(s-lastS) > 0.0004){ lastS=s; draw(); }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', function(){ resize(); s=progress(); draw(); });
  resize();

  if(reduce){
    s=1; draw();
    for(var k2=0;k2<beats.length;k2++) beats[k2].classList.add('live');
  } else {
    s=progress(); draw();
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){ visible=e.isIntersecting; });
      },{threshold:0}).observe(sec);
    } else { visible=true; }
    frame();
  }
};

/* ---- total station: WebGL build, with a fallback to the canvas renderer above ---- */
(function(){
  document.documentElement.setAttribute('data-build','20260926-2130');
  var sec = document.getElementById('setup');
  var stage = sec && sec.querySelector('.setup-stage');
  var fallbackCanvas = document.getElementById('rig');
  if(!sec || !stage) return;
  /* hidden on small screens: nothing to render, and no library to fetch */
  if(!stage.offsetWidth || !stage.offsetHeight) return;

  var started = false;
  function useFallback(reason){
    if(started) return; started = true;
    document.documentElement.setAttribute('data-rig','2d');
    if(reason) document.documentElement.setAttribute('data-rig-why', reason);
    if(window.__rig2D) window.__rig2D();
  }
  function webglOK(){
    try{
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    }catch(e){ return false; }
  }

  /* ?rig=2d forces the canvas renderer, ?rig=3d skips the WebGL support sniff */
  var force = (location.search.match(/[?&]rig=(2d|3d)/)||[])[1];
  if(force === '2d'){ useFallback('forced'); return; }
  if(force !== '3d' && !webglOK()){ useFallback('no-webgl'); return; }

  var timer = setTimeout(function(){ useFallback('timeout'); }, 12000);

  /* Load three.js and GLTFLoader, trying each host in turn. cdnjs publishes
     only the core three build — the loaders live in the npm package — so the
     npm-backed hosts are tried first and cdnjs is core-only backup. */
  var CORE = [
    'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
    'https://unpkg.com/three@0.128.0/build/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
  ];
  var LOADER = [
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
    'https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js'
  ];

  function loadFirst(urls, test, done){
    var i = 0;
    (function next(){
      if(i >= urls.length){ done(false); return; }
      var el = document.createElement('script');
      el.src = urls[i++];
      el.async = false;
      el.onload = function(){ test() ? done(true) : next(); };
      el.onerror = next;
      document.head.appendChild(el);
    })();
  }

  loadFirst(CORE, function(){ return typeof window.THREE !== 'undefined'; }, function(ok){
    if(!ok){ clearTimeout(timer); useFallback('three-unavailable'); return; }
    loadFirst(LOADER, function(){ return !!(window.THREE && window.THREE.GLTFLoader); }, function(ok2){
      clearTimeout(timer);
      if(started) return;
      if(!ok2){ console.warn('GLTFLoader unavailable'); useFallback('loader-unavailable'); return; }
      try{ init(); started = true; document.documentElement.setAttribute('data-rig','3d'); }
      catch(err){ console.warn('WebGL rig failed, falling back', err); useFallback('init-threw'); }
    });
  });

  /* ---------------------------------------------------------------- */
  function init(){
    var THREE = window.THREE;
    if(!THREE || !THREE.MeshPhysicalMaterial || !THREE.LatheGeometry) throw new Error('three.js missing');

    var readout = document.getElementById('readout');
    var beats = [].slice.call(sec.querySelectorAll('.beat'));
    /* ?rigdebug=1 renders the model unlit, straight from its base colour map.
       If it appears in debug but not normally, the fault is lighting. */
    var DEBUG = /[?&](rigdebug|ridgebug|rigflat|debug)=1/.test(location.search);
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(fallbackCanvas) fallbackCanvas.style.display = 'none';

    var host = document.createElement('div');
    host.style.cssText = 'position:absolute;inset:0;z-index:2;';
    stage.insertBefore(host, stage.firstChild);

    var renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(26, 1, 0.1, 120);
    var target = new THREE.Vector3(0, 1.02, 0);

    /* ================= procedural maps ================= */
    function cnv(w,h){ var c=document.createElement('canvas'); c.width=w; c.height=h; return c; }

    /* fine grain: breaks up the perfect-plastic look on every painted surface */
    function roughMap(base, amp, scale){
      var c = cnv(256,256), g = c.getContext('2d');
      g.fillStyle = 'rgb('+base+','+base+','+base+')';
      g.fillRect(0,0,256,256);
      var img = g.getImageData(0,0,256,256), d = img.data;
      for(var i=0;i<d.length;i+=4){
        var n = (Math.random()-0.5)*amp;
        d[i] = d[i+1] = d[i+2] = Math.max(0, Math.min(255, base + n));
      }
      g.putImageData(img,0,0);
      /* a few long scuffs, as on kit that lives in a truck */
      g.globalAlpha = 0.5;
      for(var s=0;s<26;s++){
        g.strokeStyle = 'rgb('+Math.round(base*0.55)+','+Math.round(base*0.55)+','+Math.round(base*0.55)+')';
        g.lineWidth = Math.random()*1.6+0.3;
        g.beginPath();
        var x=Math.random()*256, y=Math.random()*256;
        g.moveTo(x,y); g.lineTo(x+(Math.random()-0.5)*90, y+(Math.random()-0.5)*24);
        g.stroke();
      }
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(scale||3, scale||3);
      return t;
    }

    /* knurling, as a normal map of vertical grooves */
    function knurlMap(lines){
      var c = cnv(256,64), g = c.getContext('2d');
      g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0,0,256,64);
      var step = 256/lines;
      for(var i=0;i<lines;i++){
        var x = i*step;
        var grad = g.createLinearGradient(x,0,x+step,0);
        grad.addColorStop(0.0,'rgb(70,128,220)');
        grad.addColorStop(0.5,'rgb(128,128,255)');
        grad.addColorStop(1.0,'rgb(186,128,220)');
        g.fillStyle = grad;
        g.fillRect(x,0,step,64);
      }
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }

    /* the control face: bezel, keypad and a lit display, drawn rather than modelled */
    function faceMaps(){
      var W=512, H=384;
      var c = cnv(W,H), g = c.getContext('2d');
      g.fillStyle = '#20262a'; g.fillRect(0,0,W,H);
      /* recessed panel */
      var pad = 18;
      g.fillStyle = '#171c1f';
      g.fillRect(pad,pad,W-pad*2,H-pad*2);
      /* display well */
      var dx=pad+14, dy=pad+12, dw=W-(pad+14)*2, dh=140;
      g.fillStyle = '#0a1410'; g.fillRect(dx-6,dy-6,dw+12,dh+12);
      g.fillStyle = '#12301f'; g.fillRect(dx,dy,dw,dh);
      /* readout rows, abstract rather than fake numerals */
      g.fillStyle = 'rgba(150,240,180,.85)';
      for(var r=0;r<5;r++){
        var y = dy+16+r*24;
        g.fillRect(dx+14, y, 46, 9);
        g.fillRect(dx+dw-14-(70+((r*37)%60)), y, 70+((r*37)%60), 9);
      }
      /* keypad */
      var kx=dx, ky=dy+dh+26, kw=(dw-3*10)/4, kh=34;
      for(var row=0;row<4;row++){
        for(var col=0;col<4;col++){
          var x = kx+col*(kw+10), y = ky+row*(kh+9);
          g.fillStyle = '#2b3237';
          g.fillRect(x,y,kw,kh);
          g.fillStyle = '#3a4247';
          g.fillRect(x,y,kw,3);
          g.fillStyle = 'rgba(220,228,230,.55)';
          g.fillRect(x+kw/2-9, y+kh/2-2, 18, 4);
        }
      }
      var map = new THREE.CanvasTexture(c);
      map.encoding = THREE.sRGBEncoding;

      /* emissive: only the display glows */
      var e = cnv(W,H), eg = e.getContext('2d');
      eg.fillStyle = '#000'; eg.fillRect(0,0,W,H);
      eg.fillStyle = '#1d5c34'; eg.fillRect(dx,dy,dw,dh);
      eg.fillStyle = 'rgba(170,255,200,.95)';
      for(var r2=0;r2<5;r2++){
        var y2 = dy+16+r2*24;
        eg.fillRect(dx+14, y2, 46, 9);
        eg.fillRect(dx+dw-14-(70+((r2*37)%60)), y2, 70+((r2*37)%60), 9);
      }
      var emis = new THREE.CanvasTexture(e);
      emis.encoding = THREE.sRGBEncoding;

      /* roughness: glass display smooth, keys matte */
      var rgh = cnv(W,H), rg = rgh.getContext('2d');
      rg.fillStyle = 'rgb(150,150,150)'; rg.fillRect(0,0,W,H);
      rg.fillStyle = 'rgb(24,24,24)'; rg.fillRect(dx-6,dy-6,dw+12,dh+12);
      var rmap = new THREE.CanvasTexture(rgh);

      return {map:map, emissive:emis, rough:rmap};
    }

    /* ================= environment =================
       metals show almost nothing but their surroundings, so a dark sky makes a
       metal tripod render black. This is a bright studio: light overhead and
       around, with the site's colours kept as tint rather than as the whole. */
    function envTexture(){
      var c = cnv(1024,512), g = c.getContext('2d');
      var sky = g.createLinearGradient(0,0,0,512);
      sky.addColorStop(0.00,'#ffffff');
      sky.addColorStop(0.30,'#dfeaef');
      sky.addColorStop(0.48,'#9db4bf');
      sky.addColorStop(0.52,'#4c6472');
      sky.addColorStop(1.00,'#2b3b45');
      g.fillStyle = sky; g.fillRect(0,0,1024,512);

      /* three softboxes, so highlights have shape and the model reads as solid */
      function box(x,y,w,h,a){
        var s1 = g.createRadialGradient(x+w/2,y+h/2,8,x+w/2,y+h/2,Math.max(w,h));
        s1.addColorStop(0,'rgba(255,255,255,'+a+')');
        s1.addColorStop(1,'rgba(255,255,255,0)');
        g.fillStyle = s1; g.fillRect(x-w, y-h, w*3, h*3);
        g.fillStyle = 'rgba(255,255,255,'+Math.min(1,a+0.15)+')';
        g.fillRect(x,y,w,h);
      }
      box(150, 40, 260, 130, 0.85);
      box(620, 70, 200, 110, 0.55);
      box(430, 250, 300, 60, 0.30);

      /* a whisper of the brand colours in the reflections */
      var au = g.createLinearGradient(0,150,0,300);
      au.addColorStop(0,'rgba(60,190,140,0)');
      au.addColorStop(0.5,'rgba(70,200,160,.20)');
      au.addColorStop(1,'rgba(40,170,175,0)');
      g.fillStyle = au; g.fillRect(430,150,420,150);

      var t = new THREE.CanvasTexture(c);
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.encoding = THREE.sRGBEncoding;
      return t;
    }
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var envMap = pmrem.fromEquirectangular(envTexture()).texture;
    scene.environment = envMap;

    /* ================= lights ================= */
    var key = new THREE.DirectionalLight(0xfff1dc, 2.1);
    key.position.set(-3.1, 5.0, 3.3);
    key.castShadow = true;
    key.shadow.mapSize.width = key.shadow.mapSize.height = 2048;
    key.shadow.camera.near = 1; key.shadow.camera.far = 16;
    key.shadow.camera.left = -2.4; key.shadow.camera.right = 2.4;
    key.shadow.camera.top = 2.6; key.shadow.camera.bottom = -2.6;
    key.shadow.bias = 0;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 4;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9fd0e2, 0.28);
    fill.position.set(2.4, 1.6, 2.2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0x6fe0c4, 0.55);
    rim.position.set(3.6, 1.0, -2.9);
    scene.add(rim);
    /* a headlight parented to the camera, so the model is lit from wherever
       we are looking regardless of environment or metalness */
    var headlight = new THREE.DirectionalLight(0xdfeaf0, 0.22);
    headlight.position.set(0, 0, 1);
    camera.add(headlight);
    scene.add(camera);
    scene.add(new THREE.HemisphereLight(0x9dc6d8, 0x101f28, 0.30));
    scene.add(new THREE.AmbientLight(0x6f93a4, 0.10));

    var ground = new THREE.Mesh(new THREE.PlaneGeometry(16,16), new THREE.ShadowMaterial({opacity:0.5}));
    ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    ground.renderOrder = -1;
    scene.add(ground);

    /* ================= materials ================= */
    function col(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }
    var face = faceMaps();
    var paintRough = roughMap(96, 26, 4);
    var plasticRough = roughMap(120, 30, 3);
    var metalRough = roughMap(64, 22, 5);
    var rubberRough = roughMap(228, 20, 6);
    var knurl = knurlMap(64);

    function phys(o){ return new THREE.MeshPhysicalMaterial(o); }
    var M = {
      green : phys({color:col(0x9BB990), roughness:0.38, metalness:0.05, roughnessMap:paintRough,
                    clearcoat:0.85, clearcoatRoughness:0.16, envMapIntensity:1.15}),
      greenD: phys({color:col(0x7E9E74), roughness:0.46, metalness:0.05, roughnessMap:paintRough,
                    clearcoat:0.6, clearcoatRoughness:0.28}),
      white : phys({color:col(0xEDEFEC), roughness:0.42, metalness:0.02, roughnessMap:plasticRough,
                    clearcoat:0.5, clearcoatRoughness:0.3, envMapIntensity:1.0}),
      warm  : phys({color:col(0xEDF1F1), roughness:0.52, metalness:0.02, roughnessMap:plasticRough, clearcoat:0.35}),
      yellow: phys({color:col(0xD4AC28), roughness:0.5, metalness:0.04, roughnessMap:paintRough,
                    clearcoat:0.4, clearcoatRoughness:0.34}),
      red   : phys({color:col(0xB01C2E), roughness:0.42, metalness:0.06, roughnessMap:paintRough,
                    clearcoat:0.6, clearcoatRoughness:0.24}),
      dark  : phys({color:col(0x262B2E), roughness:0.6, metalness:0.12, roughnessMap:plasticRough}),
      rubber: phys({color:col(0x14181A), roughness:0.95, metalness:0.02, roughnessMap:rubberRough}),
      knurled: phys({color:col(0x1B1F21), roughness:0.7, metalness:0.25,
                     normalMap:knurl, normalScale:new THREE.Vector2(0.9,0.9)}),
      alu   : phys({color:col(0xB6C0C4), roughness:0.34, metalness:1.0, roughnessMap:metalRough, envMapIntensity:1.35}),
      steel : phys({color:col(0xCBD3D6), roughness:0.19, metalness:1.0, roughnessMap:metalRough, envMapIntensity:1.6}),
      lens  : phys({color:col(0x101D28), roughness:0.03, metalness:0.2, clearcoat:1.0,
                    clearcoatRoughness:0.02, envMapIntensity:2.8}),
      panel : phys({map:face.map, roughnessMap:face.rough, roughness:1.0, metalness:0.05,
                    emissiveMap:face.emissive, emissive:col(0xffffff), emissiveIntensity:0.75}),
      glass : phys({color:col(0x9fb6bd), roughness:0.05, metalness:0.0, clearcoat:1.0,
                    transparent:true, opacity:0.5, envMapIntensity:2.0})
    };

    /* ================= the model ================= */
    var root = new THREE.Group();
    scene.add(root);

    var rig = null;                 /* the loaded instrument */
    var loaded = false;

    var fit = {dist: 5.6, y: 0.86, height: 1.62};
    var parts = {legs: [], instrument: null, hub: null};
    var LEG_OPEN = 0;                /* the splay the model was built with */
    var LEG_SHUT = 0.26;             /* legs drawn in, as carried */
    var SHUT_LIFT = 0.066;           /* a closed tripod stands this much taller */
    var fit = {dist: 5.6, y: 0.86, height: 1.62};

    new THREE.GLTFLoader().load('assets/station.glb', function(gltf){
      var model = gltf.scene;

      /* the geometry is baked centred on x/z with its feet on y = 0, so it
         needs no repositioning here. Any residual offset is corrected once. */
      model.updateMatrixWorld(true);
      var box = new THREE.Box3().setFromObject(model);
      var size = new THREE.Vector3(); box.getSize(size);
      var mid  = new THREE.Vector3(); box.getCenter(mid);
      var valid = isFinite(size.y) && size.y > 0.0001;
      var k = valid ? (1.62 / size.y) : 1;
      model.scale.set(k, k, k);
      model.position.set(valid ? -mid.x*k : 0, valid ? -box.min.y*k : 0, valid ? -mid.z*k : 0);

      /* the asset is built facing the opposite way to our sight line: turn it
         so the keypad faces the viewer rather than the eyepiece */
      model.rotation.y = Math.PI;

      /* the animated wrapper: rotation and settle live here, placement lives
         on the model inside it, so the two can never overwrite each other */
      rig = new THREE.Group();
      rig.add(model);

      /* ?rigyaw=<degrees> nudges the facing without a redeploy */
      var yawArg = (location.search.match(/[?&]rigyaw=(-?\d+(?:\.\d+)?)/)||[])[1];
      if(yawArg) model.rotation.y = parseFloat(yawArg) * Math.PI/180;

      /* the parts the animation drives */
      parts.legs.length = 0;
      model.traverse(function(o){
        if(!o.name) return;
        if(o.name.indexOf('leg_') === 0){
          var bearing = (o.userData && o.userData.bearing) || 0;
          var a = bearing * Math.PI/180;
          /* horizontal axis at right angles to the leg's bearing: rotating
             about it swings the leg out from vertical */
          parts.legs.push({node:o, axis:new THREE.Vector3(Math.sin(a), 0, -Math.cos(a))});
        }
        else if(o.name === 'instrument') parts.instrument = o;
        else if(o.name === 'hub') parts.hub = o;
      });

      var meshes = 0;
      model.traverse(function(o){
        if(!o.isMesh) return;
        meshes++;
        o.castShadow = true; o.receiveShadow = true;
        o.frustumCulled = false;
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        for(var i=0;i<mats.length;i++){
          var m = mats[i];
          if(!m) continue;
          m.side = THREE.DoubleSide;
          m.envMap = envMap;
          m.envMapIntensity = 0.85;
          /* the asset's own roughness and metalness maps do the work; the cap
             only stops a surface from becoming a perfect mirror */
          m.metalness = Math.min(m.metalness !== undefined ? m.metalness : 1, 0.85);
          if(m.map) m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          m.needsUpdate = true;
        }
        var srcMap = mats[0] ? mats[0].map : null;
        if(DEBUG){
          o.material = new THREE.MeshBasicMaterial({
            map: srcMap || null,
            color: srcMap ? 0xffffff : 0xff3366,
            side: THREE.DoubleSide, fog:false });
          o.castShadow = false;
        }
      });

      root.add(rig);

      /* re-measure after normalising and frame the camera from the result,
         so it sits correctly whatever the asset's units happen to be */
      rig.updateMatrixWorld(true);
      var box2 = new THREE.Box3().setFromObject(rig);
      var sz2 = new THREE.Vector3(); box2.getSize(sz2);
      var mid2 = new THREE.Vector3(); box2.getCenter(mid2);
      if(isFinite(sz2.y) && sz2.y > 0.0001){
        fit.height = sz2.y;
        fit.y = mid2.y;
        var half = Math.max(sz2.y, sz2.x, sz2.z) * 0.5;
        fit.dist = (half * 1.45) / Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
      }

      if(DEBUG){ renderer.toneMapping = THREE.NoToneMapping; renderer.toneMappingExposure = 1; }

      /* In debug, put the numbers on the page. Where the model actually lands
         on screen is the one fact that separates "not drawn" from "drawn
         somewhere we are not looking". */
      if(DEBUG){
        var panel = document.createElement('pre');
        panel.style.cssText = 'position:absolute;left:8px;top:8px;z-index:9;margin:0;'+
          'font:11px/1.45 ui-monospace,Menlo,monospace;color:#8ef0b4;background:rgba(0,0,0,.72);'+
          'padding:10px 12px;border:1px solid #2c6;white-space:pre;pointer-events:none;max-width:92%';
        stage.appendChild(panel);
        var marker = document.createElement('div');
        marker.style.cssText = 'position:absolute;border:2px solid #ff3366;z-index:8;pointer-events:none;display:none';
        stage.appendChild(marker);

        window.__rigReport = function(){
          rig.updateMatrixWorld(true);
          var bb = new THREE.Box3().setFromObject(rig);
          var pts = [], i, j, l;
          for(i=0;i<8;i++){
            pts.push(new THREE.Vector3(
              (i & 1) ? bb.max.x : bb.min.x,
              (i & 2) ? bb.max.y : bb.min.y,
              (i & 4) ? bb.max.z : bb.min.z));
          }
          var minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9,anyFront=false;
          for(i=0;i<8;i++){
            var v = pts[i].clone().project(camera);
            if(v.z > -1 && v.z < 1) anyFront = true;
            var px = (v.x*0.5+0.5)*W, py = (-v.y*0.5+0.5)*H;
            minx=Math.min(minx,px); maxx=Math.max(maxx,px);
            miny=Math.min(miny,py); maxy=Math.max(maxy,py);
          }
          var m0=null, mapped=0, meshCount=0;
          rig.traverse(function(o){
            if(!o.isMesh) return;
            meshCount++;
            var mm = Array.isArray(o.material) ? o.material[0] : o.material;
            if(!m0) m0 = mm;
            if(mm && mm.map) mapped++;
          });
          marker.style.display='block';
          marker.style.left = Math.round(minx)+'px';
          marker.style.top = Math.round(miny)+'px';
          marker.style.width = Math.max(1,Math.round(maxx-minx))+'px';
          marker.style.height = Math.max(1,Math.round(maxy-miny))+'px';
          var txt =
            'build   ' + document.documentElement.getAttribute('data-build') + '\n' +
            'canvas  ' + W + ' x ' + H + '  dpr ' + renderer.getPixelRatio().toFixed(2) + '\n' +
            'meshes  ' + meshCount + '   textured ' + mapped + '\n' +
            'matType ' + (m0 ? m0.type : 'none') + '  visible ' + (m0 ? m0.visible : '-') + '\n' +
            'scale   ' + rig.scale.x.toFixed(5) + '\n' +
            'worldY  ' + bb.min.y.toFixed(3) + ' .. ' + bb.max.y.toFixed(3) + '\n' +
            'worldX  ' + bb.min.x.toFixed(3) + ' .. ' + bb.max.x.toFixed(3) + '\n' +
            'camera  ' + camera.position.x.toFixed(2) + ', ' + camera.position.y.toFixed(2) + ', ' + camera.position.z.toFixed(2) + '\n' +
            'fit     dist ' + fit.dist.toFixed(2) + '  h ' + fit.height.toFixed(2) + '\n' +
            'screen  x ' + Math.round(minx) + '..' + Math.round(maxx) +
                    '  y ' + Math.round(miny) + '..' + Math.round(maxy) + '\n' +
            'inFront ' + anyFront;
          panel.textContent = txt;
          return txt;
        };
      }

      window.__rigInfo = {
        meshes: meshes, rawHeight: size.y, scale: k,
        height: fit.height, centreY: fit.y, dist: fit.dist,
        min: [box2.min.x, box2.min.y, box2.min.z],
        max: [box2.max.x, box2.max.y, box2.max.z]
      };

      loaded = true;
      lastS = -1;
      document.documentElement.setAttribute('data-rig-model','loaded');
      render();
    }, undefined, function(err){
      console.warn('model failed to load', err);
      document.documentElement.setAttribute('data-rig-why','glb-failed');
    });

    /* ================= animation ================= */
    var clamp = function(v,a,b){ return v<a?a:v>b?b:v; };
    var track = function(v,a,b){ return clamp((v-a)/(b-a),0,1); };
    var easeOut = function(v){ return 1-Math.pow(1-v,3); };
    var easeIO  = function(v){ return v<0.5 ? 4*v*v*v : 1-Math.pow(-2*v+2,3)/2; };

    var W=0,H=0,s=0,lastS=-1,visible=false;

    function resize(){
      W = stage.clientWidth; H = stage.clientHeight;
      if(!W || !H) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
      renderer.setSize(W,H,false);
      camera.aspect = W/H;
      camera.updateProjectionMatrix();
      lastS = -1;
    }

    /* quintic smoothstep: zero velocity AND zero acceleration at both ends,
       which is what stops one beat handing over to the next with a jolt */
    function smooth(v){ v = clamp(v,0,1); return v*v*v*(v*(v*6-15)+10); }

    var spin = 0;
    function apply(){
      /* three beats, in order, each finishing before the next begins */
      var slide = smooth(track(s, 0.00, 0.20));   /* carried in, legs closed */
      var fold  = smooth(track(s, 0.20, 0.52));   /* legs out, set on the ground */
      var zoom  = smooth(track(s, 0.50, 1.00));   /* in on the instrument */

      if(rig){
        for(var i=0;i<parts.legs.length;i++){
          var L = parts.legs[i];
          /* a small stagger between legs, each on its own smooth curve */
          var f = smooth(track(s, 0.30 + i*0.030, 0.60 + i*0.030));
          L.node.setRotationFromAxisAngle(L.axis, LEG_SHUT + (LEG_OPEN-LEG_SHUT)*f);
        }

        /* closed legs stand taller, so it lowers itself as they open */
        rig.position.y = (1-fold) * SHUT_LIFT;

        /* carried in slightly off level, trued up as it is set down */
        rig.rotation.z = (1-fold) * 0.045;
        rig.rotation.x = (1-fold) * 0.022;

        /* one continuous turn: a half turn as it slides in, a little more
           while the legs go out, then a final quarter turn that brings the
           display round to face the viewer. Each term is at rest where the
           next picks up, so it reads as a single movement. */
        /* the scroll drives the large moves; underneath, a slow constant turn
           so the instrument is never a still image */
        rig.rotation.y = 2.8616 + 3.1416*slide + 0.30*fold + 1.5708*zoom + spin;
      }

      /* slides in from the right as it appears */
      root.position.x = (1-slide) * 2.6;
      host.style.opacity = Math.min(1, slide*1.7).toFixed(3);

      var az   = -0.60 + 0.26*slide + 0.16*fold + 0.20*zoom;
      var el   = 0.23 - 0.10*zoom;
      /* the phone panel is wide and short, and the notes sit either side, so
         the rig is framed a little smaller and dead centre there */
      var room = camera.aspect < 0.75 ? 1.16 : (camera.aspect > 1.35 ? 0.98 : 1.02);
      /* the zoom runs from comfortably wide to just-fitting, so the feet are
         never cut off; fit.dist already carries a margin round the model */
      var wide = fit.dist * room * 1.26;
      /* three framings rather than one long push: wide while it lands,
         closer through orient, closest on observe */
      /* three shots, not one push: wide for the setup, medium-close through
         orient, and a close shot on observe where the head carries the frame
         and the legs are allowed to leave it */
      var mid = fit.dist*room*0.58, near = fit.dist*room*0.26;
      var dist = zoom < 0.5
        ? wide + (mid - wide)*(zoom/0.5)
        : mid + (near - mid)*((zoom-0.5)/0.5);
      /* barely raise the aim: lifting it is what pushed the feet out of frame */
      target.y = fit.y + fit.height*(0.02 + 0.34*zoom);   /* the aim settles on the head */
      camera.position.set(
        target.x + Math.sin(az)*Math.cos(el)*dist,
        target.y + Math.sin(el)*dist,
        target.z + Math.cos(az)*Math.cos(el)*dist
      );
      camera.lookAt(target);

      if(readout) readout.classList.toggle('live', s > 0.72);
      var live = s < 0.34 ? 0 : s < 0.62 ? 1 : 2;
      for(var k=0;k<beats.length;k++) beats[k].classList.toggle('live', k === live);
    }

    function progress(){ return window.__sectionProgress(sec); }
    function render(){
      apply();
      renderer.render(scene, camera);
      if(DEBUG && window.__rigReport && rig) window.__rigReport();
    }
    var last = 0;
    function loop(now){
      if(visible){
        /* a slow constant rotation, time-based so it is frame-rate independent */
        var dt = last ? Math.min((now-last)/1000, 0.05) : 0;
        last = now;
        if(!reduce) spin += dt * 0.055;
        s = progress();
        render();
      } else { last = 0; }
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', function(){ resize(); s = progress(); render(); });
    resize();

    if(reduce){
      s = 1; render();
      for(var k2=0;k2<beats.length;k2++) beats[k2].classList.add('live');
    } else {
      s = progress(); render();
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(es){
          es.forEach(function(e){ visible = e.isIntersecting; });
        },{threshold:0}).observe(sec);
      } else { visible = true; }
      loop();
    }
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
  btn.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Close' : 'Menu';
  });
  nav.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      btn.textContent = 'Menu';
    }
  });
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


/* ---- the wordmark is already the hero; the header only takes it over
        once the hero has scrolled away ---- */
(function(){
  var stage  = document.getElementById('top');
  var header = document.querySelector('header');
  if(!stage || !header) return;              /* inner pages keep the logo always */
  header.classList.add('hero-page');

  var badge = stage.querySelector('.badge-live, .stage-static');
  var isStatic = function(){ return !!(badge && badge.offsetWidth); };

  function past(){
    if(isStatic()){
      /* mobile: the badge itself has to clear the header */
      return badge.getBoundingClientRect().bottom <= header.offsetHeight;
    }
    /* desktop: the drawn wordmark is gone once the ranges have closed over it */
    var span = stage.offsetHeight - window.innerHeight;
    if(span <= 0) return true;
    var p = -stage.getBoundingClientRect().top / span;
    return p > 0.78;
  }

  var on = null, ticking = false;
  function update(){
    var v = past();
    if(v !== on){ on = v; header.classList.toggle('brand-on', v); }
    /* on a wide screen the links sit over the hero badge as it scrolls up, so
       the bar takes a backing as soon as the page moves */
    header.classList.toggle('scrolled', window.scrollY > 24);
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
  if(!wrap.offsetWidth) return;                 /* desktop: not shown */
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the frame's top rail sits at 0.111 of the badge and is open between
     0.496 and 0.798 — only blades under that opening may pass it */
  var RAIL_Y = 0.1111, GAP_L = 0.512, GAP_R = 0.782;

  var BLADES = [{"x": 0.06441, "w": 0.02278, "base": 0.65708, "tip": 0.21239}, {"x": 0.10448, "w": 0.02435, "base": 0.64233, "tip": 0.21313}, {"x": 0.14611, "w": 0.02435, "base": 0.62316, "tip": 0.28614}, {"x": 0.18814, "w": 0.02357, "base": 0.60398, "tip": 0.24779}, {"x": 0.22977, "w": 0.02357, "base": 0.60029, "tip": 0.34218}, {"x": 0.2718, "w": 0.02435, "base": 0.61578, "tip": 0.29572}, {"x": 0.31383, "w": 0.02357, "base": 0.64676, "tip": 0.31416}, {"x": 0.35467, "w": 0.02357, "base": 0.64971, "tip": 0.33112}, {"x": 0.3967, "w": 0.02435, "base": 0.66003, "tip": 0.26475}, {"x": 0.43833, "w": 0.02435, "base": 0.691, "tip": 0.20133}, {"x": 0.47997, "w": 0.02435, "base": 0.71018, "tip": 0.24853}, {"x": 0.5216, "w": 0.02435, "base": 0.71976, "tip": 0.05826}, {"x": 0.56324, "w": 0.02435, "base": 0.72714, "tip": 0.13053}, {"x": 0.60487, "w": 0.02435, "base": 0.73525, "tip": 0.08112}, {"x": 0.6465, "w": 0.02435, "base": 0.73378, "tip": 0.00074}, {"x": 0.68814, "w": 0.02435, "base": 0.73083, "tip": 0.0}, {"x": 0.72977, "w": 0.02435, "base": 0.72861, "tip": 0.0354}, {"x": 0.77141, "w": 0.02435, "base": 0.70796, "tip": 0.04351}, {"x": 0.81304, "w": 0.02435, "base": 0.71386, "tip": 0.18805}, {"x": 0.85507, "w": 0.02357, "base": 0.72861, "tip": 0.27139}, {"x": 0.89631, "w": 0.02435, "base": 0.7382, "tip": 0.33038}, {"x": 0.9348, "w": 0.02278, "base": 0.7441, "tip": 0.36726}];

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
      g.addColorStop(0,   '#071a24');
      g.addColorStop(0.20,'#050f17');
      g.addColorStop(0.62,'#061a25');
      g.addColorStop(1,   '#071a24');
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

  nightSky(document.querySelector('.nightsky'),  {rate:0.0045});
  nightSky(document.querySelector('.setup-sky'), {rate:0.0045, aurora:true});
})();

/* ---- hero choreography: the headline is measured into place a line at a
        time, and the technical readouts settle around it ---- */
(function(){
  var wide = window.matchMedia('(min-width:861px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var intro = document.querySelector('.intro');
  var stage = document.getElementById('top');
  if(!intro) return;

  /* wrap each rendered line of the headline so it can be masked separately */
  function splitLines(el){
    if(!el || el.dataset.split) return;
    var text = el.textContent.replace(/\s+/g,' ').trim();
    var html = el.innerHTML;
    /* keep the emphasis span: rebuild from words, preserving which are inside <em> */
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var words = [];
    (function walk(node, em){
      for(var i=0;i<node.childNodes.length;i++){
        var c = node.childNodes[i];
        if(c.nodeType === 3){
          c.nodeValue.split(/\s+/).forEach(function(w){ if(w) words.push({w:w, em:em}); });
        } else walk(c, em || c.tagName === 'EM');
      }
    })(tmp, false);

    el.innerHTML = '';
    var probes = words.map(function(o){
      var sp = document.createElement('span');
      sp.className = 'wd';
      sp.textContent = o.w + ' ';
      if(o.em) sp.setAttribute('data-em','');
      el.appendChild(sp);
      return sp;
    });

    /* group the probes by the line they landed on */
    var lines = [], last = null;
    probes.forEach(function(sp){
      var top = sp.offsetTop;
      if(last === null || Math.abs(top-last) > 4){ lines.push([]); last = top; }
      lines[lines.length-1].push(sp);
    });

    el.innerHTML = '';
    lines.forEach(function(group){
      var ln = document.createElement('span'); ln.className = 'ln';
      var inner = document.createElement('span');
      group.forEach(function(sp){
        if(sp.hasAttribute('data-em')){
          var em = document.createElement('em'); em.textContent = sp.textContent;
          inner.appendChild(em);
        } else inner.appendChild(document.createTextNode(sp.textContent));
      });
      ln.appendChild(inner); el.appendChild(ln);
    });
    el.dataset.split = '1';
    el.setAttribute('aria-label', text);
  }

  function setup(){
    if(!wide.matches || reduce) return;
    splitLines(intro.querySelector('h1'));
  }
  setup();
  window.addEventListener('resize', function(){
    var h1 = intro.querySelector('h1');
    if(h1 && h1.dataset.split && wide.matches){
      /* re-measure: line breaks move with the viewport */
      h1.innerHTML = h1.getAttribute('aria-label')
        .replace('shovel-holder to stakeholder.','<em>shovel-holder to stakeholder.</em>');
      delete h1.dataset.split;
      splitLines(h1);
      intro.classList.add('lines-in');
    }
  });

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ intro.classList.add('lines-in'); } });
    },{threshold:0.18}).observe(intro);
  } else intro.classList.add('lines-in');

  if(stage) requestAnimationFrame(function(){ stage.classList.add('stage-ready'); });

  /* the readouts track the pointer, the way a live instrument would */
  if(wide.matches && !reduce && window.matchMedia('(hover:hover)').matches){
    var hz = document.querySelector('[data-hz]'),
        lat = document.querySelector('[data-lat]'),
        elev = document.querySelector('[data-elev]');
    var pending = false;
    function dms(deg){
      var d = Math.floor(deg), m = Math.floor((deg-d)*60), sec = Math.floor((((deg-d)*60)-m)*60);
      return d + '\u00b0' + String(m).padStart(2,'0') + '\u2032' + String(sec).padStart(2,'0') + '\u2033';
    }
    window.addEventListener('pointermove', function(e){
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

/* ---- 04 · where we work -----------------------------------------------
   A survey drawing rather than a map: terrain read as contour lines, a
   traverse run between control points, and each station resolving as the
   line reaches it. Nothing here is a pin. */
(function(){
  var sec = document.getElementById('where');
  var cv  = sec && sec.querySelector('.survey-map');
  if(!sec || !cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var steps = [].slice.call(sec.querySelectorAll('.survey-steps li'));
  var out = {};
  sec.querySelectorAll('[data-sp]').forEach(function(el){ out[el.getAttribute('data-sp')] = el; });

  /* Real coordinates, and a real coastline to plot them against. The outlines
     below are heavily simplified — this is a survey drawing, not an atlas —
     but the geography underneath is genuine, so the positions mean something. */
  var STN = [
    {id:'AS-VAN', name:'Vancouver',     lat:49.28, lon:-123.12, elev:12,   method:'Layout \u00b7 machine control'},
    {id:'AS-PTA', name:'Port Alice',    lat:50.42, lon:-127.45, elev:8,    method:'LiDAR \u00b7 sonar merge'},
    {id:'AS-KSM', name:'KSM Mine',      lat:56.52, lon:-130.35, elev:1180, method:'Layout \u00b7 monitoring'},
    {id:'AS-BAF', name:'Baffin Island', lat:66.00, lon:-70.50,  elev:212,  method:'As-built \u00b7 30 km'}
  ];

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

  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    if(!W||!H) return;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function progress(){ return window.__sectionProgress(sec); }

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

  function setView(p){
    /* two stages, so the widening has a beat rather than one long drift */
    var v = p < 0.45
      ? lerpView(VIEW_NEAR, VIEW_MID, sm(p/0.45))
      : lerpView(VIEW_MID,  VIEW_FAR, sm((p-0.45)/0.55));
    view.n=v.n; view.s=v.s; view.w=v.w; view.e=v.e;

    /* On a wide screen the drawing keeps to the right of the notes. On a
       phone it has the whole panel, less the heading at the top and the
       readout along the foot. */
    var narrow = W <= 900;
    var pad = Math.min(W,H)*(narrow ? 0.05 : 0.08);
    var x0 = narrow ? pad : W*0.34;
    var top = narrow ? H*0.17 : pad;          /* clear of the heading */
    var bot = narrow ? H*0.13 : pad;          /* clear of the readout */
    frame.x = x0; frame.y = top;
    frame.w = (W - pad) - x0; frame.h = H - top - bot;
  }

  function poly(pts, close, alpha, width){
    ctx.beginPath();
    for(var i=0;i<pts.length;i++){
      var x = projX(pts[i][1], pts[i][0]), y = projY(pts[i][0]);
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    if(close) ctx.closePath();
    ctx.strokeStyle = 'rgba(140,206,208,'+alpha+')';
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
      ctx.strokeStyle = 'rgba(120,196,200,.075)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(frame.x,y); ctx.lineTo(frame.x+frame.w,y); ctx.stroke();
      ctx.fillStyle = 'rgba(140,200,205,.34)';
      ctx.fillText(la.toFixed(0)+'\u00b0N', frame.x+4, y-4);
    }
    var lonStep = (view.e-view.w) > 40 ? 20 : 10;
    for(var lo=Math.ceil(view.w/lonStep)*lonStep; lo<=view.e; lo+=lonStep){
      var x = projX(lo, (view.n+view.s)/2);
      ctx.strokeStyle = 'rgba(120,196,200,.055)';
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
    bg.addColorStop(0,'#071a24'); bg.addColorStop(0.5,'#061722'); bg.addColorStop(1,'#071a24');
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
      ctx.strokeStyle = 'rgba(120,196,200,.9)'; ctx.lineWidth = 0.8; ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* the traverse between control points */
    var legs = STN.length-1;
    var runT = Math.max(0, Math.min(1, (p-0.06)/0.86)) * legs;
    var done = Math.floor(runT), frac = runT-done;

    ctx.beginPath();
    var a0 = pt(0); ctx.moveTo(a0[0],a0[1]);
    for(var i2=0;i2<legs;i2++){
      var A = pt(i2), B = pt(i2+1);
      var f = i2<done ? 1 : (i2===done ? frac : 0);
      if(f<=0) break;
      ctx.lineTo(A[0]+(B[0]-A[0])*f, A[1]+(B[1]-A[1])*f);
    }
    ctx.strokeStyle = 'rgba(57,180,74,.85)';
    ctx.lineWidth = 1.4; ctx.setLineDash([7,5]); ctx.stroke(); ctx.setLineDash([]);

    for(var k=0;k<STN.length;k++){
      var P = pt(k);
      var arrive = Math.max(0, Math.min(1, (runT-(k-0.55))/0.55));
      if(arrive<=0) continue;
      var sz = 7 + 5*arrive;
      ctx.save();
      ctx.translate(P[0],P[1]);
      ctx.strokeStyle = 'rgba(120,240,170,'+(0.35+0.6*arrive).toFixed(2)+')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0,-sz); ctx.lineTo(sz*0.87, sz*0.5); ctx.lineTo(-sz*0.87, sz*0.5);
      ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,1.6,0,Math.PI*2);
      ctx.fillStyle='rgba(160,255,200,.95)'; ctx.fill();
      ctx.globalAlpha = 0.45*arrive;
      ctx.beginPath();
      ctx.moveTo(-sz*1.9,0); ctx.lineTo(-sz*1.15,0);
      ctx.moveTo(sz*1.15,0); ctx.lineTo(sz*1.9,0);
      ctx.moveTo(0,-sz*1.9); ctx.lineTo(0,-sz*1.35);
      ctx.stroke();
      ctx.restore();

      ctx.globalAlpha = arrive;
      ctx.font = '500 11px ui-monospace,Menlo,monospace';
      var lx = P[0]+sz*1.6, ly = P[1]-5;
      if(lx > frame.x+frame.w-130) lx = P[0]-sz*1.6-120;
      ctx.fillStyle = 'rgba(226,240,242,.92)';
      ctx.fillText(STN[k].name.toUpperCase(), lx, ly);
      ctx.fillStyle = 'rgba(140,200,205,.7)';
      ctx.fillText(STN[k].lat.toFixed(2)+'\u00b0N  '+Math.abs(STN[k].lon).toFixed(2)+'\u00b0W', lx, ly+13);
      ctx.globalAlpha = 1;
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
    ctx.fillStyle = 'rgba(140,200,205,.45)';
    ctx.fillText('VIEW  ' + view.s.toFixed(1) + '\u00b0N \u2013 ' + view.n.toFixed(1) + '\u00b0N',
                 frame.x, frame.y - 8);

    var cur = Math.max(0, Math.min(STN.length-1, Math.round(runT)));
    var st = STN[cur];
    if(out.id && out.id.textContent !== st.id){
      out.id.textContent = st.id;
      out.lat.textContent = st.lat.toFixed(2)+'\u00b0N';
      out.elev.textContent = st.elev+' m';
      out.method.textContent = st.method;
    }
    if(out.run) out.run.textContent = (runT/legs*4180).toFixed(0)+' km';
    for(var q2=0;q2<steps.length;q2++) steps[q2].classList.toggle('live', q2 === cur);
  }

  function loop(){
    if(live){ t += 0.016; p = progress(); draw(); }
    raf = live ? requestAnimationFrame(loop) : 0;
  }
  window.addEventListener('resize', function(){ resize(); p=progress(); draw(); });
  resize(); p=progress(); draw();
  if(reduce) return;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){ if(!raf){ live=true; raf=requestAnimationFrame(loop);} }
        else { live=false; }
      });
    },{threshold:0}).observe(sec);
  } else { live=true; loop(); }
})();

/* ---- 06 · reality capture ---------------------------------------------
   The same points throughout: scattered returns, then pulled onto their true
   positions, then joined into surfaces, then resolved to a clean deliverable.
   One dataset, four states, so the idea reads without a caption. */
(function(){
  var sec = document.getElementById('capture');
  var cv  = sec && sec.querySelector('.capture-canvas');
  if(!sec || !cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var legend = [].slice.call(sec.querySelectorAll('.capture-legend li'));
  var steps  = [].slice.call(sec.querySelectorAll('.capture-steps li'));
  var counter = sec.querySelector('[data-cap-n]');

  var W=0,H=0,dpr=1,p=0,t=0,raf=0,live=false,pts=null,edges=null;

  function rnd(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var v = Math.imul(seed ^ seed>>>15, 1 | seed);
    v = v + Math.imul(v ^ v>>>7, 61 | v) ^ v;
    return ((v ^ v>>>14) >>> 0) / 4294967296; }; }

  /* The subject is a bridge crossing a cut: the Baffin job in section. Points
     are generated on the surfaces themselves rather than scattered through a
     volume, so the cloud actually resolves into a structure you can read. */
  function ground(u){
    return 0.74
      - 0.15*Math.exp(-Math.pow((u-0.10)/0.20,2))
      - 0.12*Math.exp(-Math.pow((u-0.95)/0.18,2))
      + 0.10*Math.exp(-Math.pow((u-0.50)/0.16,2));   /* the cut, mid-span */
  }
  var DECK_Y = 0.44, PIER_U = [0.34, 0.66];

  function build(){
    var r = rnd(4242);
    var dense = W < 700 ? 0.55 : 1;
    pts = [];  edges = [];

    function emit(x, y, kind, keep){
      pts.push({
        tx:x, ty:y, kind:kind, keep:keep,
        rx: x + (r()-0.5)*0.17, ry: y + (r()-0.5)*0.15,
        jx: r()-0.5, jy: r()-0.5,
        a: 0.30 + r()*0.55, ph: r()*Math.PI*2
      });
      return pts.length-1;
    }

    /* ground, as a run of returns along the surface with a little thickness */
    var gN = Math.round(420*dense), gIdx = [];
    for(var i=0;i<gN;i++){
      var u = i/(gN-1);
      var y = ground(u) + (r()-0.5)*0.012;
      gIdx.push(emit(u, y, 'ground', r()));
      if(r() < 0.5) emit(u + (r()-0.5)*0.01, y + 0.012 + r()*0.05, 'ground', r()*0.4);
    }
    for(var g=0;g<gIdx.length-1;g++) edges.push([gIdx[g], gIdx[g+1]]);

    /* the deck: two faces and a run of edge returns */
    var dN = Math.round(300*dense), dTop=[], dBot=[];
    for(var j=0;j<dN;j++){
      var uu = 0.06 + (j/(dN-1))*0.88;
      dTop.push(emit(uu, DECK_Y + (r()-0.5)*0.006, 'deck', r()));
      dBot.push(emit(uu, DECK_Y + 0.030 + (r()-0.5)*0.006, 'deck', r()*0.5));
    }
    for(var d2=0;d2<dTop.length-1;d2++){
      edges.push([dTop[d2], dTop[d2+1]]);
      edges.push([dBot[d2], dBot[d2+1]]);
      if(d2 % 12 === 0) edges.push([dTop[d2], dBot[d2]]);
    }

    /* piers down to the bed */
    PIER_U.forEach(function(pu){
      var top = DECK_Y + 0.030, bot = ground(pu);
      var n = Math.round(90*dense), col=[];
      for(var k=0;k<n;k++){
        var f = k/(n-1);
        col.push(emit(pu + (r()-0.5)*0.014, top + (bot-top)*f, 'pier', r()));
      }
      for(var c=0;c<col.length-1;c++) edges.push([col[c], col[c+1]]);
    });

    /* scatter: vegetation and noise the scanner also picks up */
    var sN = Math.round(260*dense);
    for(var m=0;m<sN;m++){
      var su = r(), sy = ground(su) - r()*0.10;
      emit(su, sy, 'noise', r()*0.10);
    }
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    if(!W||!H) return;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    build();
  }

  function progress(){
    return window.matchMedia('(max-width:860px)').matches
      ? noteProgress(window.__pinProgress(sec, sec.querySelector('.capture-sticky')))
      : window.__sectionProgress(sec);
  }

  /* On a phone the four notes scroll past in equal quarters, and each one
     should leave the drawing in its own state: raw returns, registered cloud,
     surface mesh, deliverable. So scroll position is mapped onto the animation
     through knots at each note's midpoint, which makes every note bring a
     change instead of the stages bunching up between notes. */
  var KNOTS = [[0,0],[0.125,0.08],[0.375,0.38],[0.625,0.68],[0.875,0.97],[1,1]];
  function noteProgress(s){
    for(var i=1;i<KNOTS.length;i++){
      if(s <= KNOTS[i][0]){
        var a = KNOTS[i-1], b = KNOTS[i];
        return a[1] + (b[1]-a[1]) * (s-a[0]) / (b[0]-a[0]);
      }
    }
    return 1;
  }

  var sm = function(v){ v = v<0?0:v>1?1:v; return v*v*v*(v*(v*6-15)+10); };

  function draw(){
    if(!W||!H||!pts) return;
    ctx.clearRect(0,0,W,H);
    var bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#071a24'); bg.addColorStop(0.55,'#061722'); bg.addColorStop(1,'#071a24');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    /* four stages, overlapping only at their edges */
    var reg  = sm((p-0.10)/0.26);      /* returns pulled onto position */
    var mesh = sm((p-0.42)/0.24);      /* surfaces joined */
    var deliv= sm((p-0.70)/0.26);      /* resolved to line work */

    var pad = Math.min(W,H)*0.10;
    /* on a wide screen the drawing keeps to the right, so the notes on the
       left always have clear ground under them */
    var x0 = W > 900 ? W*0.40 : pad*0.6;
    var vw = (W - pad) - x0, vh = H - pad*2;
    function px(u,v){ return [x0 + u*vw, pad + v*vh]; }

    /* the scan sweep, only while the returns are still landing */
    if(reg < 1){
      var sx = pad + ((t*0.16)%1)*vw;
      var sg = ctx.createLinearGradient(sx-40,0,sx+40,0);
      sg.addColorStop(0,'rgba(90,220,160,0)');
      sg.addColorStop(0.5,'rgba(90,220,160,'+(0.14*(1-reg)).toFixed(3)+')');
      sg.addColorStop(1,'rgba(90,220,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(sx-40, pad, 80, vh);
    }

    /* mesh: drawn under the points, fading up as they connect */
    if(mesh > 0.01 && edges){
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(96,196,190,'+(0.30*mesh*(1-deliv*0.55)).toFixed(3)+')';
      ctx.beginPath();
      var step = deliv > 0.5 ? 2 : 1;
      for(var e=0;e<edges.length;e+=step){
        var A = pts[edges[e][0]], B = pts[edges[e][1]];
        var a1 = px(A.tx,A.ty), b1 = px(B.tx,B.ty);
        ctx.moveTo(a1[0],a1[1]); ctx.lineTo(b1[0],b1[1]);
      }
      ctx.stroke();
    }

    /* the points themselves */
    var shown = 0;
    for(var i=0;i<pts.length;i++){
      var P = pts[i];
      /* raw scatter drifts; registered points hold still */
      var driftX = reduce ? 0 : P.jx * 0.012 * Math.sin(t*0.7 + P.ph);
      var driftY = reduce ? 0 : P.jy * 0.010 * Math.cos(t*0.6 + P.ph);
      var u = P.rx + (P.tx - P.rx)*reg + driftX*(1-reg);
      var v = P.ry + (P.ty - P.ry)*reg + driftY*(1-reg);
      var q = px(u,v);

      /* once it becomes a deliverable, most points retire and the linework carries it */
      var fade = 1 - deliv*(P.keep > 0.14 ? 1 : 0.30);
      if(fade <= 0.02) continue;
      shown++;
      var a = P.a * (0.30 + 0.70*reg) * fade;
      var hue = P.kind==='deck' ? 172 : P.kind==='pier' ? 186 : P.kind==='noise' ? 120 : 150;
      ctx.fillStyle = 'hsla('+hue+',58%,'+(P.kind==='noise'?46:64)+'%,'+a.toFixed(3)+')';
      var r = (P.kind==='noise' ? 0.9 : 1.35) * (1 + 0.45*(1-reg));
      ctx.fillRect(q[0], q[1], r, r);
    }

    /* the deliverable: the deck and banks drawn as clean section lines */
    if(deliv > 0.01){
      ctx.strokeStyle = 'rgba(150,235,190,'+(0.85*deliv).toFixed(3)+')';
      ctx.lineWidth = 1.3;
      /* ground line */
      ctx.beginPath();
      for(var s2=0;s2<=140;s2++){
        var uu = s2/140, pp = px(uu, ground(uu));
        s2 ? ctx.lineTo(pp[0],pp[1]) : ctx.moveTo(pp[0],pp[1]);
      }
      ctx.stroke();
      /* deck and piers */
      ctx.beginPath();
      var dl = px(0.06, DECK_Y), dr = px(0.94, DECK_Y);
      var dl2 = px(0.06, DECK_Y+0.030), dr2 = px(0.94, DECK_Y+0.030);
      ctx.moveTo(dl[0],dl[1]);  ctx.lineTo(dr[0],dr[1]);
      ctx.moveTo(dl2[0],dl2[1]); ctx.lineTo(dr2[0],dr2[1]);
      PIER_U.forEach(function(uu){
        var top = px(uu, DECK_Y+0.030), bot = px(uu, ground(uu));
        ctx.moveTo(top[0],top[1]); ctx.lineTo(bot[0],bot[1]);
      });
      ctx.stroke();
      /* a dimension line, because that is what a deliverable carries */
      ctx.globalAlpha = deliv;
      var l = px(PIER_U[0],0.88), r2 = px(PIER_U[1],0.88);
      ctx.strokeStyle = 'rgba(140,200,205,.75)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(l[0],l[1]); ctx.lineTo(r2[0],r2[1]);
      ctx.moveTo(l[0],l[1]-5); ctx.lineTo(l[0],l[1]+5);
      ctx.moveTo(r2[0],r2[1]-5); ctx.lineTo(r2[0],r2[1]+5);
      ctx.stroke();
      ctx.font = '500 10px ui-monospace,Menlo,monospace';
      ctx.fillStyle = 'rgba(200,226,230,.9)';
      ctx.fillText('30.480 m', (l[0]+r2[0])/2 - 26, l[1]-9);
      ctx.globalAlpha = 1;
    }

    var stage = deliv>0.5 ? 3 : mesh>0.5 ? 2 : reg>0.5 ? 1 : 0;
    for(var g=0;g<legend.length;g++) legend[g].classList.toggle('on', g<=stage);
    for(var h2=0;h2<steps.length;h2++) steps[h2].classList.toggle('live', h2===stage);
    if(counter) counter.textContent = (shown*3210).toLocaleString();
  }

  function loop(){
    if(live){ t += 0.016; p = progress(); draw(); }
    raf = live ? requestAnimationFrame(loop) : 0;
  }
  window.addEventListener('resize', function(){ resize(); p=progress(); draw(); });
  resize(); p=progress(); draw();
  if(reduce) return;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){ if(!raf){ live=true; raf=requestAnimationFrame(loop);} }
        else live=false;
      });
    },{threshold:0}).observe(sec);
  } else { live=true; loop(); }
})();

/* ---- the section heading recedes once its first note is live, so the two
        never sit on top of each other ---- */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  [['#where','.survey-head'],['#capture','.capture-head']].forEach(function(pair){
    var sec = document.querySelector(pair[0]);
    var head = sec && sec.querySelector(pair[1]);
    if(!sec || !head) return;
    head.style.transition = 'opacity .55s ease, transform .55s cubic-bezier(.2,.8,.3,1)';
    var on = null, ticking = false;
    function update(){
      var p = pair[0]==='#capture' && window.matchMedia('(max-width:860px)').matches
        ? window.__pinProgress(sec, sec.querySelector('.capture-sticky'))
        : window.__sectionProgress(sec);
      var show = p < 0.14;
      if(show !== on){
        on = show;
        head.style.opacity = show ? '1' : '0';
        head.style.transform = show ? 'none' : 'translateY(-10px)';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }, {passive:true});
    update();
    if(reduce){ head.style.opacity='1'; head.style.transform='none'; }
  });
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
         el.classList.contains('advantage') || el.classList.contains('projects'))) return true;
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

/* ---- the instrument's own readings, resolving as the sequence advances.
        Values count into place rather than fading in, leader lines draw
        outward, and the markers lock on. ---- */
(function(){
  var sec = document.getElementById('setup');
  var ann = sec && sec.querySelector('.rig-ann');
  if(!sec || !ann) return;
  if(!window.matchMedia('(min-width:861px)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = [].slice.call(ann.querySelectorAll('.ra'));

  /* each value counts up to its true reading once, the first time it is shown */
  function resolve(el){
    var target = parseFloat(el.getAttribute('data-num'));
    if(isNaN(target) || el.dataset.done) return;
    el.dataset.done = '1';
    if(reduce){ el.textContent = target.toFixed(3) + ' m'; return; }
    var t0 = null, dur = 900;
    (function step(now){
      if(t0 === null) t0 = now;
      var f = Math.min(1, (now - t0)/dur);
      var e = 1 - Math.pow(1-f, 3);
      el.textContent = (target*e).toFixed(3) + ' m';
      if(f < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  var stage = -1, ticking = false;
  function update(){
    var p = window.__sectionProgress(sec);

    /* the annotations only belong once the rig is planted */
    var live = p > 0.16 && p < 0.99;
    ann.classList.toggle('on', live);

    var st = p < 0.34 ? 0 : p < 0.66 ? 1 : 2;
    if(st !== stage){
      stage = st;
      ann.classList.remove('s0','s1','s2');
      ann.classList.add('s' + st);
    }
    for(var i=0;i<items.length;i++){
      var want = live && parseInt(items[i].dataset.stage,10) <= st;
      if(want && !items[i].classList.contains('on')){
        items[i].classList.add('on');
        var v = items[i].querySelector('[data-num]');
        if(v) resolve(v);
      } else if(!want){
        items[i].classList.remove('on');
      }
    }
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, {passive:true});
  window.addEventListener('resize', update);
  update();
})();
