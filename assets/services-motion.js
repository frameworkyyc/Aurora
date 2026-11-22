/* ===== preserved from library/removed-homepage-sections/capture-visualization.js (Reality Capture point cloud) ===== */
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
    bg.addColorStop(0,'#05364c'); bg.addColorStop(0.55,'#032e41'); bg.addColorStop(1,'#05364c');
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
      ctx.strokeStyle = 'rgba(143,193,211,'+(0.30*mesh*(1-deliv*0.55)).toFixed(3)+')';
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
      ctx.strokeStyle = 'rgba(143,193,211,.75)'; ctx.lineWidth = 1;
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
  [['#capture','.capture-head']].forEach(function(pair){
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

