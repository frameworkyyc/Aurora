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
      halo.addColorStop(0,'rgba(59,182,87,.22)'); halo.addColorStop(1,'rgba(31,131,167,0)');
      ctx.strokeStyle=halo; ctx.lineWidth=7;
      ctx.beginPath(); ctx.moveTo(a1[0],a1[1]); ctx.lineTo(a2[0],a2[1]); ctx.stroke();
      var lg=ctx.createLinearGradient(a1[0],a1[1],a2[0],a2[1]);
      lg.addColorStop(0,'rgba(130,240,160,.95)'); lg.addColorStop(0.35,'rgba(59,182,87,.7)');
      lg.addColorStop(1,'rgba(31,131,167,0)');
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
    ctx.strokeStyle = 'rgba(59,182,87,.85)';
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
      ctx.fillStyle = 'rgba(143,193,211,.7)';
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
    ctx.fillStyle = 'rgba(143,193,211,.45)';
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
