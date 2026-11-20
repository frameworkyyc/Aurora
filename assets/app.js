/* Aurora Surveys: script for the public holding page.
   Only what the hero needs: the phone badge and the wide-screen badge, the
   night sky, the headline entrance, the readouts, the progress thread and the
   header logo. */

window.__AURORA_BLADES = [{"x": 0.06441, "w": 0.02278, "base": 0.65708, "tip": 0.21239}, {"x": 0.10448, "w": 0.02435, "base": 0.64233, "tip": 0.21313}, {"x": 0.14611, "w": 0.02435, "base": 0.62316, "tip": 0.28614}, {"x": 0.18814, "w": 0.02357, "base": 0.60398, "tip": 0.24779}, {"x": 0.22977, "w": 0.02357, "base": 0.60029, "tip": 0.34218}, {"x": 0.2718, "w": 0.02435, "base": 0.61578, "tip": 0.29572}, {"x": 0.31383, "w": 0.02357, "base": 0.64676, "tip": 0.31416}, {"x": 0.35467, "w": 0.02357, "base": 0.64971, "tip": 0.33112}, {"x": 0.3967, "w": 0.02435, "base": 0.66003, "tip": 0.26475}, {"x": 0.43833, "w": 0.02435, "base": 0.691, "tip": 0.20133}, {"x": 0.47997, "w": 0.02435, "base": 0.71018, "tip": 0.24853}, {"x": 0.5216, "w": 0.02435, "base": 0.71976, "tip": 0.05826}, {"x": 0.56324, "w": 0.02435, "base": 0.72714, "tip": 0.13053}, {"x": 0.60487, "w": 0.02435, "base": 0.73525, "tip": 0.08112}, {"x": 0.6465, "w": 0.02435, "base": 0.73378, "tip": 0.00074}, {"x": 0.68814, "w": 0.02435, "base": 0.73083, "tip": 0.0}, {"x": 0.72977, "w": 0.02435, "base": 0.72861, "tip": 0.0354}, {"x": 0.77141, "w": 0.02435, "base": 0.70796, "tip": 0.04351}, {"x": 0.81304, "w": 0.02435, "base": 0.71386, "tip": 0.18805}, {"x": 0.85507, "w": 0.02357, "base": 0.72861, "tip": 0.27139}, {"x": 0.89631, "w": 0.02435, "base": 0.7382, "tip": 0.33038}, {"x": 0.9348, "w": 0.02278, "base": 0.7441, "tip": 0.36726}];

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
        .replace('under construction.','<em>under construction.</em>');
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
