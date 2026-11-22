/* ------------------------------------------------------------------
   Construction & Engineering Surveys — the total station, in three stages.
   One instrument (assets/station.glb, original weathered textures) under
   studio lighting on a navy ground. A scroll-linked camera travels around it:
   01 Establish Control  (tripod, plumb line, levelling)
   02 Project Layout     (telescope, horizontal circle, line of sight, stakes)
   03 Verify & Document  (loop closes, display)
   then the instrument dissolves into points as Reality Capture begins.
   Phones, tablets and desktops all run the live scene when WebGL allows it;
   reduced motion, no WebGL, no JS, a slow device or a failed load show three
   still frames with the same text instead.
   ------------------------------------------------------------------ */
(function(){
  var sec = document.getElementById('construction-engineering');
  if(!sec) return;
  var html = document.documentElement;
  var pin = sec.querySelector('.st-pin');
  var canvas = sec.querySelector('.st-canvas');
  var labelsEl = sec.querySelector('.st-labels');
  var steps = [].slice.call(sec.querySelectorAll('.st-step'));
  var ticks = [].slice.call(sec.querySelectorAll('.st-rail i'));
  if(!pin || !canvas) return;

  var qs = location.search;
  var stillQ = qs.match(/[?&]seqstill=([0-9.]+)/);
  var still = stillQ ? parseFloat(stillQ[1]) : null;
  var perfOff = /[?&]seqperf=off/.test(qs);

  var dead = false;
  function giveUp(why){
    dead = true; html.classList.remove('st-live'); sec.classList.remove('st--live','st--ready');
    if(why && window.console) console.info('static total-station frames in use:', why);
  }
  if(still !== null){ html.classList.add('seq-still','st-live'); }
  if(!html.classList.contains('st-live')) return;   /* the head script decided: stills */
  sec.classList.add('st--live');

  var started = false;
  function load(src, ok, bad){
    var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s);
  }
  function start(){
    if(started) return; started = true;
    load('assets/vendor/three.min.js', function(){
      load('assets/vendor/GLTFLoader.js', function(){
        try{ build(); }catch(e){ giveUp(e && e.message); }
      }, function(){ giveUp('loader'); });
    }, function(){ giveUp('three'); });
  }
  if(still !== null || !('IntersectionObserver' in window)) start();
  else new IntersectionObserver(function(es, o){ if(es[0].isIntersecting){ start(); o.disconnect(); } },
                                {rootMargin:'1000px 0px'}).observe(sec);

  function build(){
    var T = window.THREE;
    var dprNow = window.devicePixelRatio || 1;
    var touch = window.matchMedia('(pointer:coarse)').matches;
    var maxDpr = touch ? 1.75 : 2;

    var renderer = new T.WebGLRenderer({canvas:canvas, antialias:dprNow < 2, alpha:true, powerPreference:'high-performance'});
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;
    canvas.addEventListener('webglcontextlost', function(e){ e.preventDefault(); giveUp('context lost'); }, false);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(30, 1, 0.05, 60);

    /* ---------- studio light: a generated environment for the metal, plus three lamps ---------- */
    try{
      var ec = document.createElement('canvas'); ec.width = 1024; ec.height = 512;
      var g = ec.getContext('2d');
      var bg = g.createLinearGradient(0,0,0,512);
      bg.addColorStop(0,'#3a4f5a'); bg.addColorStop(.5,'#1d3340'); bg.addColorStop(1,'#0a171d');
      g.fillStyle = bg; g.fillRect(0,0,1024,512);
      function box(x,y,w,h,c,a){
        var r = g.createRadialGradient(x,y,0,x,y,Math.max(w,h));
        r.addColorStop(0,'rgba('+c+','+a+')'); r.addColorStop(.55,'rgba('+c+','+(a*.5)+')'); r.addColorStop(1,'rgba('+c+',0)');
        g.save(); g.translate(x,y); g.scale(w/Math.max(w,h), h/Math.max(w,h)); g.translate(-x,-y);
        g.fillStyle = r; g.fillRect(x-Math.max(w,h), y-Math.max(w,h), Math.max(w,h)*2, Math.max(w,h)*2); g.restore();
      }
      box(250,120,150,90,'255,242,224',1);      /* warm key softbox */
      box(780,170,60,170,'200,226,238',.8);    /* cool strip */
      box(520,40,200,40,'255,255,255',.85);     /* overhead */
      box(980,300,40,120,'150,215,200',.35);    /* faint green edge */
      var et = new T.CanvasTexture(ec); et.encoding = T.sRGBEncoding; et.mapping = T.EquirectangularReflectionMapping;
      var pm = new T.PMREMGenerator(renderer);
      scene.environment = pm.fromEquirectangular(et).texture;
      pm.dispose(); et.dispose();
    }catch(e){ /* the lamps below still light it */ }

    scene.add(new T.HemisphereLight(0xb4c8d4, 0x0b1d27, 0.3));
    var key = new T.DirectionalLight(0xffe6c4, 1.9); key.position.set(-2.6, 4.2, 3.2); scene.add(key);
    var rim = new T.DirectionalLight(0x9ccfe0, 1.0);  rim.position.set(3.2, 2.6, -3.4); scene.add(rim);
    var fill = new T.DirectionalLight(0xbcd6e4, 0.32); fill.position.set(2.2, 1.2, 3.0); scene.add(fill);

    /* ---------- ground: a soft navy pool of light and a contact shadow, nothing else ---------- */
    function radial(stops, size){
      var c = document.createElement('canvas'); c.width = c.height = size||256; var x = c.getContext('2d');
      var r = x.createRadialGradient(c.width/2,c.height/2,0,c.width/2,c.height/2,c.width/2);
      stops.forEach(function(s){ r.addColorStop(s[0], s[1]); });
      x.fillStyle = r; x.fillRect(0,0,c.width,c.height); return new T.CanvasTexture(c);
    }
    var disc = new T.Mesh(new T.PlaneGeometry(11,11), new T.MeshBasicMaterial({
      map:radial([[0,'rgba(20,86,116,.92)'],[.4,'rgba(11,60,84,.6)'],[1,'rgba(5,54,76,0)']]), transparent:true, depthWrite:false, toneMapped:false}));
    disc.rotation.x = -Math.PI/2; disc.position.y = -0.002; scene.add(disc);
    var shadow = new T.Mesh(new T.PlaneGeometry(2.4,2.4), new T.MeshBasicMaterial({
      map:radial([[0,'rgba(0,8,14,.62)'],[.55,'rgba(0,8,14,.28)'],[1,'rgba(0,8,14,0)']]), transparent:true, depthWrite:false, toneMapped:false}));
    shadow.rotation.x = -Math.PI/2; shadow.position.y = 0.001; scene.add(shadow);

    var GREEN = 0x3bb657, CYAN = 0x8fd3e8;
    function basic(color, op){ return new T.MeshBasicMaterial({color:color, transparent:true, opacity:op==null?1:op, depthWrite:false, toneMapped:false, side:T.DoubleSide}); }

    var rings = new T.Group(); scene.add(rings);
    [0.55, 1.1, 1.75].forEach(function(r){
      var m = new T.Mesh(new T.RingGeometry(r, r+0.004, 128), basic(CYAN, 0)); m.rotation.x = -Math.PI/2; m.position.y = 0.003; rings.add(m);
    });

    var rig = new T.Group(); scene.add(rig);              /* the instrument, on the tripod axis */
    var yawG = new T.Group(); rig.add(yawG);
    var overlays = new T.Group(); scene.add(overlays);     /* hairline graphics, in world space */

    var meshes = [], sharedMat = null, modelReady = false;
    var geom = {};

    /* ---------- hairline graphics ---------- */
    var plumb, marker, levelRing, hcircle, beam, beamMat, index, stakes = [], loop = [], pts, ptsMat;
    var STAKES = [{th:0,L:3.0},{th:-34,L:4.6},{th:30,L:3.8}];
    var objY = 1.5, baseY = 1.306, hubY = 1.285;

    function ribbon(ax,az,bx,bz,w,color,op){
      var gg = new T.PlaneGeometry(1,1); gg.rotateX(-Math.PI/2); gg.translate(.5,0,0);
      var m = new T.Mesh(gg, basic(color, op)); m.position.set(ax,0.006,az); m.rotation.y = -Math.atan2(bz-az,bx-ax);
      m.userData = {L:Math.hypot(bx-ax,bz-az), w:w, op:op}; m.scale.set(.001,1,w); overlays.add(m); return m;
    }

    function tickTexture(){
      var c = document.createElement('canvas'); c.width = c.height = 512; var x = c.getContext('2d');
      x.translate(256,256); x.strokeStyle = 'rgba(220,240,246,1)'; x.lineCap = 'butt';
      for(var i=0;i<72;i++){
        var big = i%6===0, a = i*Math.PI/36; x.lineWidth = big?3:1.5;
        x.beginPath(); x.moveTo(Math.cos(a)*(big?226:236), Math.sin(a)*(big?226:236)); x.lineTo(Math.cos(a)*250, Math.sin(a)*250); x.stroke();
      }
      x.lineWidth = 2; x.beginPath(); x.arc(0,0,250,0,Math.PI*2); x.stroke();
      return new T.CanvasTexture(c);
    }

    /* ---------- the instrument ---------- */
    new T.GLTFLoader().load('assets/station.glb', function(gltf){
      var root = gltf.scene; root.updateMatrixWorld(true);
      var inst = null, hub = null;
      root.traverse(function(o){ if(o.isMesh){ meshes.push(o); if(o.name === 'instrument') inst = o; if(o.name === 'hub') hub = o; } });
      if(!inst || !hub){ giveUp('model parts'); return; }
      var hb = new T.Box3().setFromObject(hub), ib = new T.Box3().setFromObject(inst);
      var ax = (hb.min.x+hb.max.x)/2, az = (hb.min.z+hb.max.z)/2;
      root.position.set(-ax, 0, -az); root.updateMatrixWorld(true);
      rig.add(root);
      var cx = (ib.min.x+ib.max.x)/2 - ax, cz = (ib.min.z+ib.max.z)/2 - az;
      yawG.position.set(cx, 0, cz);
      yawG.attach(inst);
      baseY = ib.min.y; objY = baseY + (ib.max.y-ib.min.y)*0.62; hubY = (hb.min.y+hb.max.y)/2;
      geom.front = ib.max.x - (ib.min.x+ib.max.x)/2; geom.cx = cx; geom.cz = cz;

      sharedMat = inst.material;
      var aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      meshes.forEach(function(m){
        var mt = m.material; mt.envMapIntensity = 1.0; mt.side = T.FrontSide; mt.transparent = true; mt.opacity = 0;
        ['map','metalnessMap','normalMap','aoMap'].forEach(function(k){ if(mt[k]) mt[k].anisotropy = aniso; });
        m.frustumCulled = false;
      });

      /* plumb line, ground marker, level ring */
      var pg = new T.CylinderGeometry(.0035,.0035,1,6); pg.translate(0,-.5,0);
      plumb = new T.Mesh(pg, basic(GREEN,.9)); plumb.position.set(0,baseY,0); plumb.scale.y = .001; overlays.add(plumb);
      marker = new T.Group();
      var mr = new T.Mesh(new T.RingGeometry(.07,.085,40), basic(GREEN,.95)); mr.rotation.x = -Math.PI/2; marker.add(mr);
      [0,Math.PI/2].forEach(function(a){ var bar = new T.Mesh(new T.PlaneGeometry(.2,.008), basic(GREEN,.95)); bar.rotation.x = -Math.PI/2; bar.rotation.z = a; marker.add(bar); });
      marker.position.y = .005; marker.scale.setScalar(.001); overlays.add(marker);
      levelRing = new T.Mesh(new T.RingGeometry(.165,.171,64), basic(CYAN,0)); levelRing.rotation.x = -Math.PI/2; levelRing.position.y = hubY-.02; overlays.add(levelRing);

      /* horizontal circle around the instrument's base, with an index that turns with the instrument */
      hcircle = new T.Mesh(new T.PlaneGeometry(.5,.5), new T.MeshBasicMaterial({map:tickTexture(), transparent:true, opacity:0, depthWrite:false, toneMapped:false, side:T.DoubleSide}));
      hcircle.rotation.x = -Math.PI/2; hcircle.position.set(cx, baseY+.012, cz); overlays.add(hcircle);
      var tri = new T.Shape(); tri.moveTo(0,0); tri.lineTo(-.012,.024); tri.lineTo(.012,.024); tri.lineTo(0,0);
      /* the index sits on the circle's edge, on the telescope side, and turns with the instrument */
      index = new T.Mesh(new T.ShapeGeometry(tri), basic(GREEN,0)); index.rotation.x = -Math.PI/2; index.rotation.z = -Math.PI/2;
      yawG.add(index); index.position.set(.25, baseY+.013, 0);

      /* line of sight along the telescope */
      beamMat = new T.ShaderMaterial({
        transparent:true, depthWrite:false, uniforms:{uOp:{value:0}, uCol:{value:new T.Color(GREEN)}},
        vertexShader:'varying float vU; void main(){ vU = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:'uniform float uOp; uniform vec3 uCol; varying float vU; void main(){ float a = (1.0 - smoothstep(.35,1.0,vU)) * uOp; gl_FragColor = vec4(uCol, a); }'
      });
      var bgm = new T.BoxGeometry(1,.0045,.0045); bgm.translate(.5,0,0);
      beam = new T.Mesh(bgm, beamMat); beam.position.set(geom.front, objY, 0); beam.scale.x = .001; yawG.add(beam);

      /* layout stakes on the ground, and the loop that closes through them */
      STAKES.forEach(function(s){
        var th = s.th*Math.PI/180, dx = Math.cos(th)*s.L, dz = -Math.sin(th)*s.L;
        var g1 = new T.Group(); g1.position.set(dx, 0, dz);
        var post = new T.Mesh(new T.CylinderGeometry(.014,.014,.42,8), basic(GREEN,1)); post.position.y = .21; g1.add(post);
        var cap = new T.Mesh(new T.SphereGeometry(.03,10,8), basic(0xffffff,1)); cap.position.y = .43; g1.add(cap);
        var ring = new T.Mesh(new T.RingGeometry(.1,.115,32), basic(GREEN,.9)); ring.rotation.x = -Math.PI/2; ring.position.y = .006; g1.add(ring);
        g1.scale.setScalar(.001); overlays.add(g1); stakes.push({g:g1, x:dx, z:dz});
      });
      loop.push(ribbon(stakes[0].x,stakes[0].z, stakes[1].x,stakes[1].z, .04, GREEN,.8));
      loop.push(ribbon(stakes[1].x,stakes[1].z, stakes[2].x,stakes[2].z, .04, GREEN,.8));
      loop.push(ribbon(stakes[2].x,stakes[2].z, 0,0, .04, GREEN,.8));

      /* the points the instrument dissolves into: its own vertices, thinned out */
      (function(){
        var list = [], v = new T.Vector3();
        meshes.forEach(function(m){
          m.updateWorldMatrix(true,false);
          var p = m.geometry.attributes.position, step = touch ? 2 : 1;
          for(var i=0;i<p.count;i+=step){ v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld); list.push(v.x,v.y,v.z); }
        });
        var n = list.length/3, pos = new Float32Array(n*3), dir = new Float32Array(n*3), col = new Float32Array(n*3);
        var cs = [new T.Color(CYAN), new T.Color(GREEN), new T.Color(0xffffff)];
        for(var i=0;i<n;i++){
          pos[i*3] = list[i*3]+(Math.random()-.5)*.01; pos[i*3+1] = list[i*3+1]+(Math.random()-.5)*.01; pos[i*3+2] = list[i*3+2]+(Math.random()-.5)*.01;
          var a = Math.random()*Math.PI*2, b = Math.acos(2*Math.random()-1), r = .25+Math.random()*1.1;
          dir[i*3] = Math.sin(b)*Math.cos(a)*r; dir[i*3+1] = Math.cos(b)*r*.8; dir[i*3+2] = Math.sin(b)*Math.sin(a)*r;
          var c = cs[Math.random()<.18?2:(Math.random()<.5?0:1)]; col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
        }
        var pgm = new T.BufferGeometry();
        pgm.setAttribute('position', new T.BufferAttribute(pos,3)); pgm.setAttribute('aDir', new T.BufferAttribute(dir,3)); pgm.setAttribute('color', new T.BufferAttribute(col,3));
        ptsMat = new T.ShaderMaterial({
          transparent:true, depthWrite:false,
          uniforms:{uExp:{value:0}, uOp:{value:0}, uSize:{value:.028}, uPx:{value:1}},
          vertexShader:'attribute vec3 aDir; attribute vec3 color; uniform float uExp, uSize, uPx; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position + aDir*uExp, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.5, uSize * uPx * 900.0 / -mv.z); }',
          fragmentShader:'uniform float uOp; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - .5; float a = smoothstep(.5,.2,length(d)) * uOp; gl_FragColor = vec4(vC, a); }'
        });
        pts = new T.Points(pgm, ptsMat); pts.visible = false; pts.frustumCulled = false; scene.add(pts);
      })();

      buildLabels();
      modelReady = true;
      size();
      if(still === null && !perfOff && !benchmark()){ giveUp('benchmark'); return; }
      if(still !== null){ cur = target = Math.max(0,Math.min(1,still)); frame(cur); sec.classList.add('st--ready'); window.__seqReady = true; return; }
      dirty = true; kick();
    }, undefined, function(){ giveUp('model'); });

    /* ---------- minimal labels, projected from the scene ---------- */
    var labels = [];
    function label(html, x,y,z, dir, a,b){
      var el = document.createElement('div'); el.className = 'stl stl--'+dir; el.innerHTML = '<i></i><span>'+html+'</span>'; labelsEl.appendChild(el);
      labels.push({el:el, v:new T.Vector3(x,y,z), a:a, b:b});
    }
    function buildLabels(){
      label('<b>CP-01</b>', 0, .02, 0, 'e', .12,.30);
      label('<b>3.412 m</b>', stakes[0].x, .45, stakes[0].z, 'e', .44,.60);
      label('<b>HZ 128°44′12″</b>', 0.0, baseY+.02, 0, 'w', .00,.00);
      label('<b>Closure Δ 2 mm</b>', stakes[2].x, .45, stakes[2].z, 'e', .70,.80);
    }

    /* ---------- camera: orbit parameters on a monotone curve ---------- */
    var K = [ /* p, azimuth°, elevation°, distance, target height, target x */
      [0.00,  58,  6, 4.7, .88, 0],
      [0.07,  50,  7, 4.3, .90, 0],
      [0.17,  22, 16, 2.5, 1.10, 0],
      [0.28,  68, 24, 1.45, 1.33, 0],
      [0.34,  66, 24, 1.42, 1.34, 0],
      [0.40,  42,  8, 1.08, 1.49, 0],
      [0.42,  42,  8, 1.08, 1.49, 0],
      [0.48,   8, 10, 1.10, 1.48, 0],
      [0.55,  74, 10, 1.35, 1.40, 0],
      [0.61, 150, 16, 3.2, 1.00, .5],
      [0.68, 235, 32, 6.4, .45, 1.7],
      [0.76,  94,  3, 1.00, 1.38, 0],
      [0.86,  92,  4, 0.98, 1.37, 0],
      [0.91,  58,  9, 3.3, 1.00, 0],
      [1.00,  42, 22, 6.2, 1.00, 0]
    ];
    function curve(ch){
      var n = K.length, x = K.map(function(k){return k[0]}), y = K.map(function(k){return k[ch]});
      var d = [], m = [];
      for(var i=0;i<n-1;i++) m.push((y[i+1]-y[i])/(x[i+1]-x[i]));
      d[0] = m[0]; d[n-1] = m[n-2];
      for(i=1;i<n-1;i++) d[i] = (m[i-1]*m[i] <= 0) ? 0 : 2/(1/m[i-1]+1/m[i]);
      return function(p){
        var i = 0; while(i < n-2 && p > x[i+1]) i++;
        var h = x[i+1]-x[i], t = Math.max(0,Math.min(1,(p-x[i])/h)), t2 = t*t, t3 = t2*t;
        return (2*t3-3*t2+1)*y[i] + (t3-2*t2+t)*h*d[i] + (-2*t3+3*t2)*y[i+1] + (t3-t2)*h*d[i+1];
      };
    }
    var cAz = curve(1), cEl = curve(2), cD = curve(3), cTy = curve(4), cTx = curve(5);

    /* instrument bearing and line-of-sight length by progress */
    var TH = [ /* p, bearing°, sight length (m) */
      [0.00,  0, 0], [0.34, 0, 0], [0.40, 0, 3.0], [0.43, 0, 3.0], [0.47, -34, 4.6], [0.50, -34, 4.6],
      [0.54, 30, 3.8], [0.60, 30, 3.8], [0.63, 30, 0], [0.74, 0, 0], [1.00, 0, 0]
    ];
    function sm(x){ return x*x*(3-2*x); }
    function seg(p,a,b){ return sm(Math.max(0,Math.min(1,(p-a)/(b-a)))); }
    function bearing(p){
      var i = 0; while(i < TH.length-2 && p > TH[i+1][0]) i++;
      var a = TH[i], b = TH[i+1], u = sm(Math.max(0,Math.min(1,(p-a[0])/(b[0]-a[0]))));
      return [a[1]+(b[1]-a[1])*u, a[2]+(b[2]-a[2])*u];
    }

    /* ---------- state for a given progress ---------- */
    function apply(p){
      if(!modelReady) return;
      var fade = seg(p,0,.05), dis = seg(p,.90,.955);
      var solid = fade*(1-dis);
      meshes.forEach(function(m){ m.material.opacity = solid; m.visible = solid > .004; });
      disc.material.opacity = (1-seg(p,.92,.99))*(.55+.45*fade); shadow.material.opacity = solid;
      rings.children.forEach(function(r,i){ r.material.opacity = .22*seg(p,.03+i*.015,.14+i*.015)*(1-seg(p,.34,.42)); });

      plumb.scale.y = Math.max(.001, baseY*seg(p,.08,.2)); plumb.material.opacity = .9*(1-seg(p,.35,.42)*.7)*(1-dis);
      marker.scale.setScalar(Math.max(.001, seg(p,.10,.18))); marker.children.forEach(function(c){ c.material.opacity = .95*(1-seg(p,.35,.42)*.6)*(1-dis); });
      levelRing.material.opacity = .85*seg(p,.15,.22)*(1-seg(p,.29,.33));
      levelRing.material.color.setHex(0x8fd3e8).lerp(new T.Color(GREEN), seg(p,.2,.27));
      yawG.rotation.z = (1-seg(p,.12,.27))*0.016*Math.sin(p*60);   /* a small levelling settle */
      yawG.rotation.x = (1-seg(p,.12,.27))*0.012;

      var b = bearing(p), th = b[0]*Math.PI/180;
      yawG.rotation.y = th;
      var hOp = seg(p,.33,.38)*(1-seg(p,.76,.82));
      hcircle.material.opacity = .75*hOp*(1-dis); index.material.opacity = hOp*(1-dis);
      beam.scale.x = Math.max(.001, b[1]); beamMat.uniforms.uOp.value = b[1] > .02 ? .9*(1-dis) : 0;

      stakes.forEach(function(s,i){ var u = seg(p,.40+i*.075,.44+i*.075); s.g.scale.setScalar(Math.max(.001,u)*(1-dis)); s.g.visible = u > 0 && dis < .98; });
      loop.forEach(function(r,i){ var u = seg(p,.66+i*.025,.71+i*.025); r.scale.x = Math.max(.001, r.userData.L*u); r.material.opacity = r.userData.op*(1-dis); });

      pts.visible = p > .9; ptsMat.uniforms.uOp.value = seg(p,.915,.95)*(1-seg(p,.97,1)*.55)*.95; ptsMat.uniforms.uExp.value = seg(p,.92,1)*1.0;
    }

    /* ---------- size and frame ---------- */
    var W = 0, H = 0, shiftX = 0, shiftY = 0, dirty = true, cur = 0, target = 0, visible = false, raf = 0;
    var dpr = Math.min(dprNow, maxDpr);
    function size(){
      W = pin.clientWidth; H = pin.clientHeight; if(!W || !H) return;
      renderer.setPixelRatio(dpr); renderer.setSize(W,H,false);
      camera.aspect = W/H; camera.updateProjectionMatrix();
      var a = W/H;
      shiftX = a > 1.25 ? -0.13 : 0;                 /* instrument sits right of the text column */
      shiftY = a <= 1.25 ? Math.min(.09, (1.25-a)*.12) : 0;   /* ...or above the text on tall screens */
      if(ptsMat) ptsMat.uniforms.uPx.value = dpr * (H/900);
      dirty = true;
    }
    var _v = new T.Vector3();
    function frame(p){
      apply(p);
      var a = W/H, d0 = cD(p), fFull = Math.max(1, Math.min(2.6, .88/a));
      var f = 1 + (fFull-1)*(.5+.5*Math.max(0,Math.min(1,(d0-1.4)/2.6)));
      var az = cAz(p)*Math.PI/180, el = cEl(p)*Math.PI/180, d = d0*f, ty = cTy(p), tx = cTx(p);
      camera.position.set(tx+Math.sin(az)*Math.cos(el)*d, ty+Math.sin(el)*d, Math.cos(az)*Math.cos(el)*d);
      camera.lookAt(tx, ty, 0);
      if(shiftX || shiftY) camera.setViewOffset(W,H, shiftX*W, shiftY*H, W,H); else camera.clearViewOffset();
      camera.updateMatrixWorld();
      renderer.render(scene, camera);

      labels.forEach(function(L){
        var al = Math.min(seg(p,L.a-.015,L.a+.02), 1-seg(p,L.b-.02,L.b+.015));
        if(L.b <= L.a || al <= .02){ if(L.on){ L.el.style.opacity = '0'; L.on = false; } return; }
        _v.copy(L.v).project(camera);
        var x = (_v.x*.5+.5)*W, y = (-_v.y*.5+.5)*H;
        var out = _v.z > 1 || x < 20 || x > W-20 || y < 90 || y > H-20;
        L.el.style.opacity = out ? '0' : String(al*.95);
        L.el.style.transform = 'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
        L.on = !out;
      });

      var s = p < .31 ? 0 : (p < .645 ? 1 : 2);
      steps.forEach(function(el,i){ el.classList.toggle('on', i === s); });
      var lp = [seg(p,.03,.31), seg(p,.31,.645), seg(p,.645,.9)];
      ticks.forEach(function(el,i){ el.style.transform = 'scaleX('+lp[i].toFixed(3)+')'; });
    }

    /* ---------- a quick benchmark while the section is still far below the screen ---------- */
    function benchmark(){
      try{
        var gl = renderer.getContext(), px = new Uint8Array(4), pts = [.08,.3,.45,.62,.7,.8,.93];
        function run(){
          frame(.2); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);      /* warm-up: shaders, textures */
          var t0 = performance.now();
          pts.forEach(function(q){ frame(q); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); });
          return (performance.now()-t0)/pts.length;
        }
        var ms = run();
        if(ms > 38 && dpr > 1){ dpr = 1; size(); ms = run(); }
        cur = target = 0;
        return ms <= 60;
      }catch(e){ return true; }
    }

    /* ---------- scroll driver, with a frame-time watchdog ---------- */
    var slow = 0, seen = 0, last = 0, lowered = false;
    function loop2(now){
      raf = 0;
      if(dead || !visible || document.hidden || !modelReady) return;
      var span = sec.offsetHeight - pin.offsetHeight, r = sec.getBoundingClientRect();
      target = span > 0 ? Math.max(0,Math.min(1,-r.top/span)) : 0;
      var dd = target-cur;
      if(Math.abs(dd) > .0004){ cur += dd*.17; dirty = true; } else if(cur !== target){ cur = target; dirty = true; }
      if(dirty){
        dirty = false;
        var t0 = performance.now(); frame(cur);
        if(!sec.classList.contains('st--ready')) sec.classList.add('st--ready');
        if(!perfOff){
          if(last && now-last < 120){ seen++; if(now-last > 42) slow++; }
          last = now;
          if(seen >= 36){
            if(slow/seen > .55 && !lowered && dpr > 1){ lowered = true; dpr = 1; size(); }
            seen = 0; slow = 0;
          }
        }
      } else last = 0;
      raf = requestAnimationFrame(loop2);
    }
    function kick(){ if(!raf && visible) raf = requestAnimationFrame(loop2); }

    window.addEventListener('resize', function(){ size(); kick(); });
    if(still !== null) return;
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible){ dirty = true; kick(); } },{rootMargin:'160px 0px'}).observe(sec);
    window.addEventListener('scroll', kick, {passive:true});
    document.addEventListener('visibilitychange', kick);
    setTimeout(function(){ if(!modelReady && still === null) giveUp('timeout'); }, 20000);
  }
})();
