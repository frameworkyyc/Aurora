/* ------------------------------------------------------------------
   Aurora loading screen and page transitions.

   Three arrival modes, chosen by the tiny inline script in each page's <head> (so the Denim Blue cover is on
   screen before the first paint, with no flash of the page underneath):
     aur-full   first page of a visit (about 2 s): the Aurora pattern forms in the centre of the screen, line by
                line from the bottom upward, with a restrained glow developing alongside; then the logo fades in,
                the finished composition holds, and everything dissolves into the page. Any tap, click or key
                press skips it. Nothing ever moves across the screen: the pattern is centred and stationary.
     aur-short  arriving from another Aurora page, or any later direct load in the same visit (about 0.65 s):
                the same bottom-to-top formation, shortened, without the logo
     aur-fade   the same, for prefers-reduced-motion: a plain fade
   Back/forward and reload get no cover at all. The page is never waiting on the animation: it is built and
   interactive underneath, and a CSS-only failsafe lifts the cover after 3.5 s even if this script never runs.

   Leaving: a click on an ordinary internal page link covers the screen for 0.2 s and then goes to the link.
   Nothing is intercepted that the browser would treat specially (modifier keys, new tabs, downloads, hash-only
   links, other origins, files), and the cover is withdrawn if the page comes back from the back/forward cache or
   the navigation has not happened after 2.5 s.

   The artwork is the pattern on page 12 of the Aurora Brand Standards Guide, pixel for pixel. It is cut into its
   115 individual lines (assets/aurora-blades.webp is a sprite sheet of them; BLADES below lists where each one
   sits in the pattern and in the sheet). Each line is drawn on one small canvas, from its base upward, in its
   original position and colours. A line leans a hair as it forms and settles upright, so the finished pattern is
   exactly the official artwork. Everything else (glow, logo, dissolve) is CSS opacity.
   ------------------------------------------------------------------ */
(function(){
  var d = document.documentElement;
  var veil = document.querySelector('.aur-veil');
  if(!veil) return;

  /* [x, y, width, height, sheet x, sheet y] for each line, lowest first; pattern is 818 x 960 */
  var BLADES = [[0,857,5,103,787,2],[8,813,7,127,702,2],[18,824,6,96,820,2],[29,812,6,96,830,2],[39,790,5,108,753,2],[48,808,5,82,953,2],[58,797,6,87,897,2],[67,796,8,83,941,2],[77,795,6,81,962,2],[88,797,5,75,38,453],[106,800,6,70,125,453],[97,802,8,68,184,453],[116,805,6,60,293,453],[126,801,6,62,260,453],[136,805,5,56,327,453],[146,805,5,55,346,453],[156,812,5,44,377,453],[163,803,7,50,366,453],[174,808,7,42,410,453],[185,808,5,35,421,453],[195,810,5,25,430,453],[202,738,7,87,907,2],[190,707,8,93,863,2],[176,704,7,91,875,2],[163,696,6,96,840,2],[149,706,7,85,918,2],[122,700,7,90,886,2],[136,710,8,80,972,2],[109,714,6,73,58,453],[94,709,8,77,14,453],[82,728,6,56,336,453],[66,716,10,66,208,453],[55,729,7,51,355,453],[41,731,7,44,386,453],[27,612,11,156,504,2],[50,588,7,132,665,2],[583,640,8,71,102,453],[563,640,7,71,114,453],[542,644,8,67,196,453],[603,652,9,59,314,453],[502,640,8,70,135,453],[522,633,8,76,26,453],[624,648,8,61,281,453],[481,632,7,75,47,453],[69,552,10,154,532,2],[645,646,7,60,303,453],[460,638,8,66,222,453],[440,631,8,70,147,453],[665,658,9,43,397,453],[419,626,7,73,68,453],[90,544,8,154,546,2],[397,629,9,69,171,453],[377,623,8,73,79,453],[358,628,8,65,234,453],[337,630,7,62,270,453],[110,515,9,176,436,2],[681,537,10,152,569,2],[317,616,7,72,91,453],[296,618,8,70,159,453],[132,533,7,154,558,2],[275,602,8,84,929,2],[253,606,10,80,984,2],[152,510,8,174,449,2],[172,487,9,196,396,2],[193,505,9,178,423,2],[234,588,9,95,850,2],[214,579,7,103,796,2],[661,488,9,156,519,2],[640,451,10,186,409,2],[618,470,11,162,489,2],[597,459,11,171,461,2],[576,480,9,146,597,2],[556,460,9,164,476,2],[534,473,10,149,583,2],[514,488,9,133,639,2],[492,474,9,146,610,2],[472,489,8,130,690,2],[450,476,12,140,623,2],[429,493,10,122,727,2],[409,481,9,133,652,2],[387,485,10,127,713,2],[365,478,10,131,676,2],[346,490,8,117,741,2],[325,499,8,104,775,2],[303,493,9,107,762,2],[282,499,9,97,807,2],[262,512,8,78,2,453],[241,517,10,64,246,453],[221,330,11,236,381,2],[242,224,11,280,336,2],[265,230,11,261,366,2],[288,178,12,305,291,2],[311,182,10,293,322,2],[333,206,11,265,351,2],[355,166,11,302,307,2],[378,105,10,359,180,2],[401,129,10,332,220,2],[424,68,10,390,74,2],[446,85,10,371,118,2],[469,19,11,435,16,2],[492,41,11,411,31,2],[515,50,9,399,46,2],[537,0,10,447,2,2],[560,45,11,399,59,2],[580,53,12,387,88,2],[604,73,11,364,132,2],[627,105,12,327,234,2],[649,69,12,360,164,2],[673,41,10,380,104,2],[696,78,9,336,194,2],[718,85,10,321,250,2],[739,31,13,363,147,2],[764,45,9,335,207,2],[786,44,10,319,277,2],[809,14,9,321,264,2]];
  var PW = 818, PH = 960;

  var MODES = ['aur-full', 'aur-short', 'aur-fade'];
  var mode = MODES.filter(function(c){ return d.classList.contains(c); })[0] || '';
  var TOTAL = {'aur-full':2000, 'aur-short':650, 'aur-fade':300};
  var FORM  = {'aur-full':1.05, 'aur-short':0.4};      /* seconds for the pattern to finish forming */
  var revealed = false, finished = false, timers = [], raf = 0, pat = null;

  function later(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; }
  function reveal(){ if(revealed) return; revealed = true; try{ window.dispatchEvent(new Event('aur:reveal')); }catch(e){} }
  function clear(){
    finished = true;
    timers.forEach(clearTimeout); timers = [];
    if(raf) cancelAnimationFrame(raf); raf = 0;
    d.classList.remove('aur-full', 'aur-short', 'aur-fade', 'aur-run', 'aur-skip', 'aur-out');
    veil.textContent = '';
    reveal();
  }


  /* ---- the pattern, formed line by line from the bottom up ---- */
  function formPattern(form){
    var cv = pat.cv, sheet = pat.sheet, N = BLADES.length;
    var box = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.max(2, Math.round(box.width * dpr)); cv.height = Math.max(2, Math.round(box.height * dpr));
    var ctx = cv.getContext && cv.getContext('2d');
    if(!ctx) return;
    var sc = cv.width / PW;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    var DUR = form * 0.44, SPREAD = form * 0.58, t0 = performance.now();
    var start = new Array(N);
    for(var i = 0; i < N; i++){
      var b = BLADES[i];
      /* lowest line first; the front of the formation is wavy, not a flat edge, and neighbours overlap in time */
      start[i] = SPREAD * (i / (N - 1)) + form * 0.03 * Math.sin((b[0] + b[2] / 2) / PW * 9.4 + i * 0.09);
    }
    function frame(now){
      raf = 0;
      if(finished) return;
      var t = (now - t0) / 1000, done = true;
      ctx.clearRect(0, 0, cv.width, cv.height);
      if(sheet.complete && sheet.naturalWidth){
        for(var i = 0; i < N; i++){
          var g = (t - start[i]) / DUR;
          if(g <= 0){ done = false; continue; }
          if(g > 1) g = 1; else done = false;
          var b = BLADES[i], e = 1 - Math.pow(1 - g, 3);
          var rows = Math.max(1, Math.round(b[3] * e)), lead = g < 1 ? Math.min(rows, Math.max(3, Math.round(b[3] * 0.1))) : 0;
          var lean = 0.035 * (1 - e) * Math.sin(g * 3.4 + b[0] * 0.013);     /* a hair of flow, gone when the line is formed */
          ctx.save();
          ctx.translate(b[0] * sc, (b[1] + b[3]) * sc);
          if(lean) ctx.transform(1, 0, lean, 1, 0, 0);
          ctx.globalAlpha = Math.min(1, g * 4);
          if(rows > lead) ctx.drawImage(sheet, b[4], b[5] + b[3] - (rows - lead), b[2], rows - lead, 0, -(rows - lead) * sc, b[2] * sc, (rows - lead) * sc);
          if(lead){
            ctx.globalAlpha *= 0.45;                      /* the growing tip is a little softer than the line below it */
            ctx.drawImage(sheet, b[4], b[5] + b[3] - rows, b[2], lead, 0, -rows * sc, b[2] * sc, lead * sc);
          }
          ctx.restore();
        }
      } else done = false;
      if(!done || t < form + 0.05) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  /* ---- arrival ---- */
  function start(){
    if(finished) return;
    d.classList.add('aur-run');
    if(pat) formPattern(FORM[mode]);
    later(reveal, Math.round(TOTAL[mode] * 0.8));
    later(clear, TOTAL[mode] + 60);
  }
  if(mode){
    if(mode === 'aur-fade'){ start(); }
    else{
      var cv = document.createElement('canvas');
      cv.className = 'aur-pat'; cv.setAttribute('aria-hidden', 'true');
      veil.appendChild(cv);
      var sheet = new Image();
      sheet.decoding = 'async'; sheet.src = 'assets/aurora-blades.webp';
      pat = {cv:cv, sheet:sheet};
      if(mode === 'aur-full'){
        var l = document.createElement('img');
        l.className = 'aur-logo'; l.alt = ''; l.decoding = 'async'; l.src = 'assets/logo-white-green.png';
        veil.appendChild(l);
      }
      /* wait for the artwork to be ready so it never pops in, but never longer than 0.35 s */
      var go = function(){ if(!go.done){ go.done = true; start(); } };
      later(go, 350);
      if(sheet.decode){ sheet.decode().then(go, go); } else { sheet.onload = go; sheet.onerror = go; }
    }
    /* any tap, click or key press ends the full introduction at once */
    if(mode === 'aur-full'){
      var skip = function(){
        if(finished) return;
        d.classList.add('aur-skip');
        reveal();
        later(clear, 220);
      };
      veil.addEventListener('pointerdown', skip, {once:true});
      window.addEventListener('keydown', skip, {once:true});
    }
  }

  /* ---- leaving ---- */
  var leaving = false;
  function isPage(u){
    if(u.protocol !== location.protocol || u.host !== location.host) return false;
    var ext = /\.([a-z0-9]+)$/i.exec(u.pathname);
    if(ext && !/^html?$/i.test(ext[1])) return false;                           /* pdf, images, downloads */
    if(u.pathname === location.pathname && u.search === location.search) return false;   /* same page or hash jump */
    return true;
  }
  document.addEventListener('click', function(e){
    if(e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || leaving) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if(!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u; try{ u = new URL(a.href, location.href); }catch(x){ return; }
    if(!isPage(u)) return;
    e.preventDefault();
    leaving = true;
    d.classList.add('aur-out');
    setTimeout(function(){ location.assign(u.href); }, 200);
    /* if the navigation never happens (offline, blocked), give the page back */
    setTimeout(function(){ leaving = false; d.classList.remove('aur-out'); }, 2500);
  });

  /* back/forward cache restores the page exactly as it was left, cover and all */
  window.addEventListener('pageshow', function(e){
    if(e.persisted){ leaving = false; clear(); }
  });
})();
