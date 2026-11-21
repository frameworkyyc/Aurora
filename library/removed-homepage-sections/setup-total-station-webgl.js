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

