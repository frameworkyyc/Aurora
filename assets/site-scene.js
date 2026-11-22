/* ------------------------------------------------------------------
   One site, three stages — Services page.
   A single, code-generated construction site (illustrative) that a scroll-
   linked camera flies through: 01 Establish Control, 02 Project Layout,
   03 Verify & Document, then dissolves into the Reality Capture section.
   three.js is vendored (assets/vendor/three.min.js) and only fetched when the
   section is about to be seen on a screen that can run it. Everything else
   (phones, reduced motion, no WebGL, no JS) gets the three still frames.
   ------------------------------------------------------------------ */
(function(){
  var sec = document.getElementById('construction-engineering');
  if(!sec) return;
  var pin = sec.querySelector('.sq-pin');
  var canvas = sec.querySelector('.sq-canvas');
  var labelsEl = sec.querySelector('.sq-labels');
  var steps = [].slice.call(sec.querySelectorAll('.sq-step'));
  var rail = [].slice.call(sec.querySelectorAll('.sq-rail li'));
  if(!pin || !canvas) return;

  var q = location.search.match(/[?&]seqstill=([0-9.]+)/);
  var still = q ? parseFloat(q[1]) : null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(pointer:coarse)').matches;

  function webglOK(){
    try{ var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch(e){ return false; }
  }
  var wide = function(){ return window.innerWidth >= 700; };
  if(still === null && (reduce || !wide() || !webglOK())) return;      /* stills only */
  if(still !== null){ document.documentElement.classList.add('seq-still'); }
  sec.classList.add('sq--live');

  var started = false;
  function start(){
    if(started) return; started = true;
    var s = document.createElement('script');
    s.src = 'assets/vendor/three.min.js';
    s.onload = function(){ try{ build(); }catch(e){ fail(e); } };
    s.onerror = function(){ fail(); };
    document.head.appendChild(s);
  }
  function fail(e){ sec.classList.remove('sq--live'); if(e && window.console) console.warn('site scene unavailable', e); }

  if(still !== null || !('IntersectionObserver' in window)){ start(); }
  else {
    new IntersectionObserver(function(es, o){
      if(es[0].isIntersecting){ start(); o.disconnect(); }
    }, {rootMargin:'900px 0px'}).observe(sec);
  }

  function build(){
    var T = window.THREE;
    var G = 0.15;                                  /* finished pad level */
    var COLS = [-18,-9,0,9,18], ROWS = [-12,-4,4,12];
    var CYAN = 0x8fd3e8, GREEN = 0x3bb657;

    var renderer = new T.WebGLRenderer({canvas:canvas, antialias:!touch, alpha:true, powerPreference:'high-performance'});
    var maxDpr = touch ? 1.5 : 2;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(30, 1, 1, 600);

    /* ---------- light ---------- */
    scene.add(new T.HemisphereLight(0x9bbad0, 0x16262f, 0.62));
    var sun = new T.DirectionalLight(0xffe9cf, 0.78);
    sun.position.set(-46, 62, 34);
    sun.castShadow = true;
    var ss = touch ? 1024 : 2048;
    sun.shadow.mapSize.set(ss, ss);
    var sc = sun.shadow.camera; sc.left=-62; sc.right=62; sc.top=50; sc.bottom=-50; sc.near=10; sc.far=170;
    sun.shadow.bias = -0.0006; sun.shadow.radius = 2.2;
    scene.add(sun);
    var fill = new T.DirectionalLight(0x7fb4d6, 0.35); fill.position.set(40,25,-30); scene.add(fill);

    /* ---------- textures made in code (nothing to download) ---------- */
    function noiseCanvas(size, base, spread, speck, seed){
      var c = document.createElement('canvas'); c.width = c.height = size;
      var g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0,0,size,size);
      var r = seed||1; function rnd(){ r = (r*16807) % 2147483647; return r/2147483647; }
      for(var i=0;i<size*size/9;i++){
        var v = Math.floor(rnd()*spread);
        g.fillStyle = 'rgba('+(speck[0]+v)+','+(speck[1]+v)+','+(speck[2]+v)+','+(0.18+rnd()*0.3)+')';
        var s = 1 + rnd()*2.4; g.fillRect(rnd()*size, rnd()*size, s, s);
      }
      return c;
    }
    var gravelCv = noiseCanvas(256,'#6e7378',60,[90,96,100],7);
    var gravelTex = new T.CanvasTexture(gravelCv);
    gravelTex.wrapS = gravelTex.wrapT = T.RepeatWrapping; gravelTex.repeat.set(26,18);
    gravelTex.anisotropy = 4;

    var groundCv = (function(){
      var S = 1024, c = document.createElement('canvas'); c.width=c.height=S; var g = c.getContext('2d');
      var base = noiseCanvas(512,'#34444e',34,[44,56,62],3);
      g.drawImage(base,0,0,S,S);
      /* broad tonal variation so the ground is not a flat sheet */
      for(var i=0;i<46;i++){
        var x=Math.random()*S,y=Math.random()*S,r=60+Math.random()*160;
        var gr=g.createRadialGradient(x,y,0,x,y,r); var d=Math.random()<.5;
        gr.addColorStop(0, d?'rgba(10,22,30,.28)':'rgba(120,134,142,.16)'); gr.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2);
      }
      /* fade to nothing at the edge so the site sits in the section's navy */
      g.globalCompositeOperation='destination-in';
      var rg=g.createRadialGradient(S/2,S/2,S*.18,S/2,S/2,S/2);
      rg.addColorStop(0,'rgba(0,0,0,1)'); rg.addColorStop(.55,'rgba(0,0,0,.9)'); rg.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=rg; g.fillRect(0,0,S,S);
      return c;
    })();
    var groundTex = new T.CanvasTexture(groundCv);

    /* ---------- materials ---------- */
    var fadeMats = [];
    function mat(color, rough, extra){
      var m = new T.MeshStandardMaterial(Object.assign({color:color, roughness:rough==null?.9:rough, metalness:0}, extra||{}));
      fadeMats.push(m); return m;
    }
    var mGround = new T.MeshStandardMaterial({map:groundTex, transparent:true, roughness:1, metalness:0, depthWrite:false});
    var mPad = mat(0xffffff, 1, {map:gravelTex});
    var mRoad = mat(0x3d474d, 1);
    var mConcrete = mat(0x9ea4a7, .95);
    var mConcreteDk = mat(0x868d91, .95);
    var mSteel = mat(0x78828a, .6, {metalness:.35});
    var mWall = mat(0x8e9aa3, .9);
    var mRoof = mat(0x5c6a74, .8);
    var mYellow = mat(0xc4962a, .7);
    var mDark = mat(0x23292d, .8);
    var mTrailer = mat(0xcfd4d6, .8);
    var mPile = mat(0x6a6f72, 1);
    var mWood = mat(0xb0894a, .8);

    function add(parent, geo, m, x,y,z, sh){
      var o = new T.Mesh(geo, m); o.position.set(x,y,z);
      if(sh !== false){ o.castShadow = true; o.receiveShadow = true; }
      parent.add(o); return o;
    }
    var box = function(w,h,d){ return new T.BoxGeometry(w,h,d); };

    /* ---------- ground, pad, haul road ---------- */
    var ground = new T.Mesh(new T.PlaneGeometry(340,340), mGround);
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

    var padW = 62, padD = 46;
    var pad = add(scene, box(padW, G, padD), mPad, 0, G/2, 0); pad.castShadow = false;
    var road = add(scene, box(12, .06, 70), mRoad, 44, .04, 30); road.rotation.y = -0.5; road.castShadow=false;

    /* ---------- existing building (context) ---------- */
    var bld = new T.Group(); bld.position.set(-52, 0, -36); scene.add(bld);
    add(bld, box(26,8,15), mWall, 0,4,0);
    add(bld, box(26.6,.5,15.6), mRoof, 0,8.25,0);
    for(var wi=0;wi<5;wi++) add(bld, box(2.6,1.2,.15), mDark, -9+wi*4.5, 5.2, 7.6, false);
    add(bld, box(3.4,3.6,.2), mDark, 8,1.8,7.6, false);

    /* ---------- site clutter for scale: trailers, stockpiles, fence, lights, excavator ---------- */
    [[36,-24],[36,-29.5],[42.5,-26.5]].forEach(function(p,i){
      var t = add(scene, box(9.5,3,3.2), mTrailer, p[0], 1.5+0.05, p[1]); t.rotation.y = i===2?Math.PI/2:0;
      add(t, box(9.6,.15,3.3), mConcreteDk, 0,1.5,0);
    });
    function pile(x,z,r,h,seed){
      var g = new T.ConeGeometry(r,h,22,4); var pos = g.attributes.position; var s = seed;
      for(var i=0;i<pos.count;i++){ s = (s*16807)%2147483647; var n=(s/2147483647-.5)*.18;
        pos.setX(i,pos.getX(i)*(1+n)); pos.setZ(i,pos.getZ(i)*(1+n)); }
      g.computeVertexNormals();
      var m = add(scene, g, mPile, x, h/2, z); return m;
    }
    pile(-38,26,7,4.2,11); pile(-30,31,5.5,3.2,23); pile(30,-36,6,3.6,5);

    /* perimeter fence: posts + two rails as lines */
    (function(){
      var fx = padW/2+3, fz = padD/2+3, pts = [], posts = new T.Group();
      var pg = new T.CylinderGeometry(.05,.05,2,6);
      function seg(ax,az,bx,bz){
        var L = Math.hypot(bx-ax,bz-az), n = Math.round(L/4);
        for(var i=0;i<=n;i++){ var px=ax+(bx-ax)*i/n, pz=az+(bz-az)*i/n;
          var p = new T.Mesh(pg, mSteel); p.position.set(px,1,pz); posts.add(p); }
        [0.5,1.8].forEach(function(h){ pts.push(ax,h,az,bx,h,bz); });
      }
      seg(-fx,-fz,fx,-fz); seg(fx,-fz,fx,fz); seg(fx,fz,-fx,fz); seg(-fx,fz,-fx,-fz);
      scene.add(posts);
      var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(pts,3));
      scene.add(new T.LineSegments(lg, new T.LineBasicMaterial({color:0x8a949b, transparent:true, opacity:.55})));
    })();
    [[-30,-26],[30,26]].forEach(function(p){
      var pole = add(scene, new T.CylinderGeometry(.12,.16,12,8), mSteel, p[0],6,p[1]);
      add(scene, box(1.4,.35,.6), mDark, p[0],12.1,p[1]);
    });

    /* a tracked excavator, modelled with real proportions (~2.9 m cab, 6 m boom) */
    var exc = new T.Group(); exc.position.set(-25, G, -17); exc.rotation.y = 0.9; scene.add(exc);
    add(exc, box(1.0,.8,4.0), mDark, -1.2,.4,0); add(exc, box(1.0,.8,4.0), mDark, 1.2,.4,0);
    var upper = new T.Group(); upper.position.y = .95; exc.add(upper);
    add(upper, box(2.7,1.1,3.2), mYellow, 0,.55,0);
    add(upper, box(1.5,1.6,1.7), mYellow, .45,1.55,-.5);
    add(upper, box(1.6,.7,1.2), mDark, 0,.45,-1.7);
    var boom = add(upper, box(.5,.6,4.2), mYellow, 0,1.6,2.8); boom.rotation.x = .42; boom.position.y = 2.3;
    var stick = add(upper, box(.4,.45,3.0), mYellow, 0,2.2,5.3); stick.rotation.x = -.65;
    var bucket = add(upper, box(.9,.7,.9), mDark, 0,1.1,6.4); bucket.rotation.x = .3;

    /* ---------- survey network: control monuments, ribbons ---------- */
    var cps = [
      {id:'CP-01', x:-33, z:-20, e:'512 340', n:'5 480 120'},
      {id:'CP-02', x: 33, z:-20, e:'512 412', n:'5 480 118'},
      {id:'CP-03', x: 34, z: 21, e:'512 414', n:'5 480 062'},
      {id:'CP-04', x:-34, z: 21, e:'512 338', n:'5 480 064'},
      {id:'CP-05', x:  0, z:-24, e:'512 376', n:'5 480 124'}
    ];
    var monuments = [];
    cps.forEach(function(c, i){
      var g = new T.Group(); g.position.set(c.x, G, c.z); scene.add(g);
      add(g, new T.CylinderGeometry(.26,.32,.22,14), mConcrete, 0,.11,0);
      var cap = new T.Mesh(new T.CircleGeometry(.1,14), new T.MeshBasicMaterial({color:0xd8b24a})); cap.rotation.x=-Math.PI/2; cap.position.y=.225; g.add(cap);
      var ring = new T.Mesh(new T.RingGeometry(.55,.72,32), new T.MeshBasicMaterial({color:GREEN, transparent:true, opacity:.95, side:T.DoubleSide}));
      ring.rotation.x=-Math.PI/2; ring.position.y=.06; g.add(ring);
      var pole = new T.Mesh(new T.CylinderGeometry(.03,.03,3.4,6), new T.MeshBasicMaterial({color:GREEN}));
      pole.position.y = 1.9; g.add(pole);
      var flag = new T.Mesh(new T.PlaneGeometry(.55,.36), new T.MeshBasicMaterial({color:GREEN, side:T.DoubleSide}));
      flag.position.set(.3,3.3,0); g.add(flag);
      g.scale.setScalar(.001); monuments.push({g:g, c:c, i:i});
    });

    /* total station on a tripod at CP-04 — shown in use, at true scale */
    (function(){
      var g = new T.Group(); g.position.set(-31.2, G, 19.4); scene.add(g);
      var legM = new T.MeshStandardMaterial({color:0xa88334, roughness:.7});
      for(var i=0;i<3;i++){
        var a = i*Math.PI*2/3+.4, leg = new T.Mesh(new T.CylinderGeometry(.022,.026,1.65,6), legM);
        leg.position.set(Math.cos(a)*.42, .82, Math.sin(a)*.42); leg.rotation.z = Math.cos(a)*.26; leg.rotation.x = -Math.sin(a)*.26; leg.castShadow=true; g.add(leg);
      }
      var head = new T.Mesh(new T.CylinderGeometry(.11,.11,.07,14), new T.MeshStandardMaterial({color:0x2a3338})); head.position.y=1.62; g.add(head);
      var body = new T.Mesh(new T.BoxGeometry(.2,.3,.17), new T.MeshStandardMaterial({color:0xd9dde0, roughness:.5})); body.position.y=1.82; body.castShadow=true; g.add(body);
      var scope = new T.Mesh(new T.CylinderGeometry(.04,.04,.26,10), new T.MeshStandardMaterial({color:0x2a3338})); scope.rotation.x=Math.PI/2; scope.position.set(0,1.9,.14); g.add(scope);
      g.rotation.y = .5;
    })();

    function ribbon(ax,az,bx,bz,w,color,op,y){
      var geo = new T.PlaneGeometry(1,1); geo.rotateX(-Math.PI/2); geo.translate(.5,0,0);
      var m = new T.Mesh(geo, new T.MeshBasicMaterial({color:color, transparent:true, opacity:op, depthWrite:false}));
      var L = Math.hypot(bx-ax,bz-az);
      m.position.set(ax,y||G+.07,az); m.rotation.y = -Math.atan2(bz-az,bx-ax);
      m.userData = {L:L, w:w, op:op}; m.scale.set(.001,1,w); m.renderOrder = 2; scene.add(m); return m;
    }
    var net = [[0,1],[1,2],[2,3],[3,0],[4,0],[4,1],[0,2],[1,3]].map(function(e){
      var a = cps[e[0]], b = cps[e[1]]; return ribbon(a.x,a.z,b.x,b.z, e[1]-e[0]===2||e[0]===0&&e[1]===2?.12:.16, GREEN, e[0]===4?.55:.85);
    });

    /* ---------- project layout: gridlines, dimensions, offsets, footing outlines ---------- */
    var gridMs = [];
    COLS.forEach(function(x,i){ gridMs.push(ribbon(x,-17,x,17,.1,CYAN,.55)); });
    ROWS.forEach(function(z,i){ gridMs.push(ribbon(-23,z,23,z,.1,CYAN,.55)); });
    var dim1 = ribbon(-18,-16.5,-9,-16.5,.12,0xffffff,.8);                 /* 9 000 */
    var dim2 = ribbon(-22.5,-4,-22.5,4,.12,0xffffff,.8);                   /* 8 000 */
    var off1 = ribbon(-34,-4,-18.8,-4,.1,0xffffff,.7);                     /* offset from control to line */
    var dimMs = [dim1,dim2,off1];

    var outG = new T.BufferGeometry(), op = [];
    COLS.forEach(function(x){ ROWS.forEach(function(z){
      var h=1.3, y=G+.04;
      op.push(x-h,y,z-h, x+h,y,z-h,  x+h,y,z-h, x+h,y,z+h,  x+h,y,z+h, x-h,y,z+h,  x-h,y,z+h, x-h,y,z-h);
    }); });
    outG.setAttribute('position', new T.Float32BufferAttribute(op,3));
    var outline = new T.LineSegments(outG, new T.LineBasicMaterial({color:0xffffff, transparent:true, opacity:.85}));
    scene.add(outline);

    /* stakes with elevation flags */
    var stakes = [];
    [[-24,-9],[24,-9],[24,9]].forEach(function(p,i){
      var g = new T.Group(); g.position.set(p[0],G,p[1]); scene.add(g);
      add(g, box(.05,1.1,.05), mWood, 0,.55,0, false);
      var f = new T.Mesh(new T.PlaneGeometry(.38,.22), new T.MeshBasicMaterial({color:0xff7a3d, side:T.DoubleSide})); f.position.set(.22,1.0,0); g.add(f);
      g.scale.setScalar(.001); stakes.push(g);
    });

    /* ---------- foundations ---------- */
    var pads = [], peds = [], bolts = [];
    COLS.forEach(function(x,ci){ ROWS.forEach(function(z,ri){
      var g = new T.Group(); g.position.set(x,G,z); scene.add(g);
      var p = add(g, box(2.6,.8,2.6), mConcrete, 0,.4,0); p.scale.y = .001; p.position.y = 0;
      var d = add(g, box(.62,1.5,.62), mConcreteDk, 0,.8+.75,0); d.scale.y = .001; d.position.y = .8;
      var a = [];
      [[-.18,-.18],[.18,-.18],[.18,.18],[-.18,.18]].forEach(function(o){
        var b = new T.Mesh(new T.CylinderGeometry(.018,.018,.28,6), new T.MeshStandardMaterial({color:0x9aa3a8, metalness:.5, roughness:.4}));
        b.position.set(o[0],2.45,o[1]); b.visible=false; g.add(b); a.push(b);
      });
      pads.push({m:p, i:ci*ROWS.length+ri, x:x, z:z}); peds.push({m:d, y0:.8, a:a});
    }); });
    var slab = add(scene, box(18,.22,8), mConcrete, 13.5, G+.11, 8); slab.scale.y=.001; slab.position.y=G;
    var slabPad = slab;

    /* as-built points on pedestal tops (green), monitoring marker on one pad */
    var abPts = [];
    var abSel = [[0,0],[1,0],[2,1],[3,2],[4,3],[1,3],[3,0],[0,3]];
    var abMat = new T.MeshBasicMaterial({color:GREEN});
    abSel.forEach(function(s){
      var m = new T.Mesh(new T.SphereGeometry(.13,10,8), abMat);
      m.position.set(COLS[s[0]]+.22, G+2.33, ROWS[s[1]]+.22); m.visible = false; scene.add(m); abPts.push(m);
    });
    var monRing = new T.Mesh(new T.RingGeometry(.5,.62,28), new T.MeshBasicMaterial({color:CYAN, side:T.DoubleSide, transparent:true, opacity:.9}));
    monRing.rotation.x=-Math.PI/2; monRing.position.set(COLS[2]+1.9, G+.82, ROWS[1]+1.9); monRing.visible=false; scene.add(monRing);

    /* ---------- points for the hand-off into Reality Capture ---------- */
    var cloud = (function(){
      var N = touch ? 7000 : 12000, pos = new Float32Array(N*3), col = new Float32Array(N*3);
      var cA = new T.Color(CYAN), cB = new T.Color(GREEN), cC = new T.Color(0xffffff);
      for(var i=0;i<N;i++){
        var x,y,z, r = Math.random();
        if(r<.55){ x=(Math.random()-.5)*padW; z=(Math.random()-.5)*padD; y=G+Math.random()*.08; }
        else if(r<.9){ var c = COLS[(Math.random()*5)|0], rr = ROWS[(Math.random()*4)|0];
          var top = Math.random()<.5; x=c+(Math.random()-.5)*(top?2.6:.62); z=rr+(Math.random()-.5)*(top?2.6:.62); y=G+(top?.8:.8+Math.random()*1.5); }
        else { x=-52+(Math.random()-.5)*26; z=-36+(Math.random()-.5)*15; y=Math.random()*8; }
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
        var cc = Math.random()<.2?cC:(Math.random()<.5?cA:cB); col[i*3]=cc.r; col[i*3+1]=cc.g; col[i*3+2]=cc.b;
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos,3)); g.setAttribute('color', new T.BufferAttribute(col,3));
      var m = new T.PointsMaterial({size:.34, vertexColors:true, transparent:true, opacity:0, depthWrite:false, sizeAttenuation:true});
      var p = new T.Points(g, m); p.visible = false; scene.add(p); return p;
    })();

    /* ---------- overlay labels (real HTML, projected from the scene) ---------- */
    var labels = [];
    function label(html, x,y,z, dir, a,b, cls){
      var el = document.createElement('div'); el.className = 'sl sl--'+dir+(cls?' '+cls:'');
      el.innerHTML = '<i></i><span>'+html+'</span>'; labelsEl.appendChild(el);
      labels.push({el:el, v:new T.Vector3(x,y,z), a:a, b:b});
    }
    function bubble(t, x,z, a,b){ label(t, x,G+.1,z, 'bub', a,b, 'sl--bub'); }
    cps.slice(0,4).forEach(function(c){
      label('<b>'+c.id+'</b><em>E '+c.e+' · N '+c.n+'</em>', c.x, G+3.4, c.z, c.x<0?'w':'e', .12,.31);
    });
    label('<b>Machine control network</b>', -25, G+3.6, -17, 'e', .2,.31);
    ['A','B','C','D','E'].forEach(function(t,i){ bubble(t, COLS[i], -18.4, .36,.62); });
    ['1','2','3','4'].forEach(function(t,i){ bubble(t, -24.8, ROWS[i], .36,.62); });
    label('<b>9 000</b>', -13.5, G+.2, -16.5, 'n', .43,.62);
    label('<b>8 000</b>', -22.5, G+.2, 0, 'w', .43,.62);
    label('<b>Offset 15 200</b>', -26, G+.2, -4, 'n', .45,.62);
    label('<b>FFL 100.000</b>', 24, G+1.2, -9, 'e', .5,.64);
    abSel.slice(0,8).forEach(function(s,i){
      if(i===1||i===3||i===5) return;
      var d = ['+2 mm','−1 mm','+3 mm','0 mm','−2 mm'][i%5];
      label('<b>'+d+'</b>', COLS[s[0]]+.22, G+2.45, ROWS[s[1]]+.22, i%2?'w':'e', .74,.9);
    });
    label('<b>Monitoring point</b><em>repeat observations</em>', COLS[2]+1.9, G+.9, ROWS[1]+1.9, 'e', .8,.9);

    /* ---------- camera path (position + target), one value of progress drives everything ---------- */
    var K = [
      {p:0.00, c:[ 64, 60, 112], t:[ 2, 0, 0]},
      {p:0.28, c:[ 30, 41, 78], t:[ 0, 0, -3]},
      {p:0.36, c:[-12, 50, 34], t:[ 0, 0, 0]},
      {p:0.62, c:[-30, 17, 36], t:[ 0, 0.5, 0]},
      {p:0.72, c:[ 33, 7.5, 31], t:[ 0, 1.0, 2]},
      {p:0.86, c:[ 38, 9, 14], t:[ 0, 1.2, 0]},
      {p:1.00, c:[ 14, 84, 40], t:[ 0, 0, 0]}
    ];
    var _c = new T.Vector3(), _t = new T.Vector3();
    function sm(x){ return x*x*(3-2*x); }
    function cam(p){
      var i=0; while(i<K.length-2 && p>K[i+1].p) i++;
      var a=K[i], b=K[i+1], u = sm(Math.max(0,Math.min(1,(p-a.p)/(b.p-a.p))));
      _c.set(a.c[0]+(b.c[0]-a.c[0])*u, a.c[1]+(b.c[1]-a.c[1])*u, a.c[2]+(b.c[2]-a.c[2])*u);
      _t.set(a.t[0]+(b.t[0]-a.t[0])*u, a.t[1]+(b.t[1]-a.t[1])*u, a.t[2]+(b.t[2]-a.t[2])*u);
    }

    function seg(p,a,b){ return sm(Math.max(0,Math.min(1,(p-a)/(b-a)))); }
    var shadowDirty = true, fadeOn = false;

    function apply(p){
      /* stage 1 */
      monuments.forEach(function(m){ var u = seg(p, .02+m.i*.028, .08+m.i*.028); m.g.scale.setScalar(Math.max(.001,u)); });
      net.forEach(function(r,i){ var u = seg(p,.1+i*.012,.22+i*.012); r.scale.x = Math.max(.001,r.userData.L*u); });
      /* stage 2 */
      var gf = 1 - .55*seg(p,.68,.8);
      gridMs.forEach(function(r,i){ var u = seg(p,.31+i*.008,.4+i*.008); r.scale.x = Math.max(.001,r.userData.L*u); r.material.opacity = r.userData.op*gf; });
      dimMs.forEach(function(r,i){ var u = seg(p,.42+i*.01,.5+i*.01); r.scale.x = Math.max(.001,r.userData.L*u); r.material.opacity = r.userData.op*(1-seg(p,.66,.76)); });
      outline.visible = p>.44; outline.geometry.setDrawRange(0, Math.floor(seg(p,.44,.52)*op.length/3/2)*2); outline.material.opacity = .85*(1-seg(p,.58,.66));
      stakes.forEach(function(g,i){ g.scale.setScalar(Math.max(.001,seg(p,.5+i*.02,.56+i*.02))); });
      pads.forEach(function(o){ var u = seg(p,.5+o.i*.004,.58+o.i*.004); o.m.scale.y = Math.max(.001,u); o.m.position.y = .4*u; o.m.visible = u>0; });
      /* stage 3 */
      peds.forEach(function(o,i){ var u = seg(p,.6+i*.003,.68+i*.003); o.m.visible = u>0; o.m.scale.y = Math.max(.001,u); o.m.position.y = .8+.75*u; o.a.forEach(function(b){ b.visible = u>.98; }); });
      var su = seg(p,.62,.7); slab.visible = su>0; slab.scale.y = Math.max(.001,su); slab.position.y = G+.11*su;
      abPts.forEach(function(m,i){ var u = seg(p,.7+i*.012,.76+i*.012); m.visible = u>0; m.scale.setScalar(Math.max(.001,u)); });
      monRing.visible = p>.8; monRing.scale.setScalar(.3+.7*seg(p,.8,.86));
      /* hand-off: solids fall away into points */
      var f = seg(p,.9,.99), want = f>0;
      if(want !== fadeOn){ fadeOn = want; fadeMats.forEach(function(m){ m.transparent = want; m.needsUpdate = true; }); }
      if(want){ fadeMats.forEach(function(m){ m.opacity = 1 - f; }); }
      mGround.opacity = 1 - f;
      cloud.visible = p>.86; cloud.material.opacity = seg(p,.88,.98)*.9;
      shadowDirty = true;
    }

    /* ---------- sizing ---------- */
    var W=0,H=0;
    function size(){
      W = pin.clientWidth; H = pin.clientHeight; if(!W||!H) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, maxDpr));
      renderer.setSize(W,H,false);
      camera.aspect = W/H;
      var a = W/H;
      camera.fov = 30 * Math.max(1, Math.pow(1.45/a, .7));
      camera.updateProjectionMatrix();
      shift = a>1.35 ? -0.07 : 0;
      dirty = true;
    }
    var shift = 0, dirty = true;

    function frame(p){
      apply(p);
      cam(p);
      camera.position.copy(_c); camera.lookAt(_t);
      if(shift){ camera.setViewOffset(W,H, shift*W, 0, W,H); } else camera.clearViewOffset();
      camera.updateMatrixWorld();
      if(shadowDirty){ renderer.shadowMap.needsUpdate = true; shadowDirty = false; }
      renderer.render(scene, camera);
      /* labels */
      var v = new T.Vector3();
      labels.forEach(function(L){
        var al = Math.min(seg(p,L.a-.02,L.a+.02), 1-seg(p,L.b-.02,L.b+.02));
        if(al <= .01){ if(L.on){ L.el.style.opacity='0'; L.on=false; } return; }
        v.copy(L.v).project(camera);
        var x = (v.x*.5+.5)*W, y = (-v.y*.5+.5)*H;
        var out = v.z>1 || x<-20 || x>W+20 || y<80 || y>H-8;
        L.el.style.opacity = out ? '0' : String(al);
        L.el.style.transform = 'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
        L.on = !out;
      });
      /* captions and rail */
      var s = p<.31?0:(p<.64?1:2);
      steps.forEach(function(el,i){ el.classList.toggle('on', i===s); });
      rail.forEach(function(el,i){ el.classList.toggle('on', i===s); el.classList.toggle('done', i<s); });
    }

    /* ---------- scroll driver ---------- */
    var cur = 0, target = 0, visible = false, raf = 0;
    function read(){
      var span = sec.offsetHeight - pin.offsetHeight;
      var r = sec.getBoundingClientRect();
      target = span>0 ? Math.max(0,Math.min(1,-r.top/span)) : 0;
    }
    function loop(){
      raf = 0;
      if(!visible || document.hidden) return;
      read();
      var d = target-cur;
      if(Math.abs(d) > .0004){ cur += d*.16; dirty = true; } else if(cur !== target){ cur = target; dirty = true; }
      if(dirty){ dirty = false; frame(cur); }
      raf = requestAnimationFrame(loop);
    }
    function kick(){ if(!raf && visible) raf = requestAnimationFrame(loop); }

    size();
    window.addEventListener('resize', function(){ size(); kick(); });
    sec.classList.add('sq--ready');

    if(still !== null){
      cur = target = Math.max(0,Math.min(1,still)); size(); frame(cur);
      window.__seqReady = true; return;
    }
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible){ dirty = true; kick(); } },{rootMargin:'200px 0px'}).observe(sec);
    window.addEventListener('scroll', kick, {passive:true});
    document.addEventListener('visibilitychange', kick);
  }
})();
