/* ------------------------------------------------------------------
   Services hero: the original station.glb, turning slowly on its tripod.
   The static render in the page (assets/hero/*.webp) is the fallback and the
   first paint; this swaps it for a live model once three.js has loaded.
   - Slow 360° turn about the tripod axis (the tripod stays upright)
   - Optional drag / swipe to turn it by hand; it carries on turning afterwards
   - Reduced motion: no automatic turning and no render loop (dragging still works)
   - No WebGL, a failed load, a low-memory device or slow frames: the render stays
   ------------------------------------------------------------------ */
(function(){
  var fig = document.querySelector('.svc-hero-fig');
  var stage = fig && fig.querySelector('.svc-hero-stage');
  var canvas = stage && stage.querySelector('canvas');
  if(!canvas) return;
  if(navigator.deviceMemory && navigator.deviceMemory < 2) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(pointer:coarse)').matches;

  function webglOK(){
    try{ var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch(e){ return false; }
  }
  if(!webglOK()) return;

  var dead = false;
  function giveUp(){ dead = true; fig.classList.remove('is-live'); }

  function load(src, ok, bad){
    var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s);
  }
  function go(){
    load('assets/vendor/three.min.js', function(){
      load('assets/vendor/GLTFLoader.js', function(){ try{ build(); }catch(e){ giveUp(); } }, giveUp);
    }, giveUp);
  }
  function schedule(){ (window.requestIdleCallback || function(f){ setTimeout(f, 250); })(go, {timeout:1800}); }
  if(document.readyState === 'complete') schedule(); else window.addEventListener('load', schedule);

  function build(){
    var T = window.THREE;
    var dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.75 : 2);
    var renderer = new T.WebGLRenderer({canvas:canvas, antialias:(window.devicePixelRatio||1) < 2, alpha:true, powerPreference:'high-performance'});
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    canvas.addEventListener('webglcontextlost', function(e){ e.preventDefault(); giveUp(); }, false);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(28, 8/7, 0.05, 30);

    /* the same studio light the static render was made with */
    try{
      var ec = document.createElement('canvas'); ec.width = 1024; ec.height = 512;
      var g = ec.getContext('2d');
      var bg = g.createLinearGradient(0,0,0,512);
      bg.addColorStop(0,'#3a4f5a'); bg.addColorStop(.5,'#1d3340'); bg.addColorStop(1,'#0a171d');
      g.fillStyle = bg; g.fillRect(0,0,1024,512);
      var box = function(x,y,w,h,col,a){
        var m = Math.max(w,h), r = g.createRadialGradient(x,y,0,x,y,m);
        r.addColorStop(0,'rgba('+col+','+a+')'); r.addColorStop(.55,'rgba('+col+','+(a*.5)+')'); r.addColorStop(1,'rgba('+col+',0)');
        g.save(); g.translate(x,y); g.scale(w/m,h/m); g.translate(-x,-y); g.fillStyle = r; g.fillRect(x-m,y-m,m*2,m*2); g.restore();
      };
      box(250,120,150,90,'255,242,224',1); box(780,170,60,170,'200,226,238',.8); box(520,40,200,40,'255,255,255',.85); box(980,300,40,120,'150,215,200',.35);
      var et = new T.CanvasTexture(ec); et.encoding = T.sRGBEncoding; et.mapping = T.EquirectangularReflectionMapping;
      var pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(et).texture; pm.dispose(); et.dispose();
    }catch(e){}
    scene.add(new T.HemisphereLight(0xb4c8d4, 0x0b1d27, 0.3));
    var key = new T.DirectionalLight(0xffe6c4, 1.9); key.position.set(-2.6, 4.2, 3.2); scene.add(key);
    var rim = new T.DirectionalLight(0x9ccfe0, 1.0); rim.position.set(3.2, 2.6, -3.4); scene.add(rim);
    var fill = new T.DirectionalLight(0xbcd6e4, 0.32); fill.position.set(2.2, 1.2, 3.0); scene.add(fill);

    var spinner = new T.Group(); scene.add(spinner);      /* turns about the vertical axis; nothing else moves */
    var BASE = -52 * Math.PI/180;                        /* the three-quarter pose of the static render */
    var yaw = 0, vel = 0, auto = !reduce;
    var SPEED = (Math.PI*2)/52;                          /* one turn in 52 seconds */
    var W = 0, H = 0, visible = false, raf = 0, last = 0, ready = false, dragging = false, resumeAt = 0, dirty = true;
    var seen = 0, sum = 0, lowered = false, perfOff = /[?&]seqperf=off/.test(location.search);

    new T.GLTFLoader().load('assets/station.glb', function(gltf){
      var root = gltf.scene; root.updateMatrixWorld(true);
      var hub = null; root.traverse(function(o){
        if(o.isMesh){
          o.frustumCulled = false;
          if(o.name === 'hub') hub = o;
          var m = o.material; m.envMapIntensity = 1.0;
          ['map','metalnessMap','normalMap','aoMap'].forEach(function(k){ if(m[k]) m[k].anisotropy = 8; });
        }
      });
      if(!hub){ giveUp(); return; }
      var hb = new T.Box3().setFromObject(hub);
      root.position.set(-(hb.min.x+hb.max.x)/2, 0, -(hb.min.z+hb.max.z)/2);
      spinner.add(root);
      ready = true;
      size(); draw();
      fig.classList.add('is-live');
      if(auto) kick();
    }, undefined, giveUp);

    function size(){
      W = stage.clientWidth; H = stage.clientHeight; if(!W || !H) return;
      renderer.setPixelRatio(dpr); renderer.setSize(W,H,false);
      camera.aspect = W/H; camera.updateProjectionMatrix();
      var el = 9*Math.PI/180, d = 1.05, ty = 1.4;
      camera.position.set(0, ty+Math.sin(el)*d, Math.cos(el)*d); camera.lookAt(0, ty, 0);
      dirty = true;
    }
    function draw(){ spinner.rotation.y = BASE + yaw; renderer.render(scene, camera); dirty = false; }

    function loop(now){
      raf = 0;
      if(dead || !visible || document.hidden || !ready) return;
      var dt = last ? Math.min(.08, (now-last)/1000) : 0; last = now;
      if(!dragging){
        if(Math.abs(vel) > .0004){ yaw += vel*dt*60; vel *= Math.pow(.92, dt*60); dirty = true; }
        else if(auto && now > resumeAt){ yaw += SPEED*dt; dirty = true; }
      }
      if(dirty){
        draw();
        /* if frames are slow, cheapen once, then keep the static render instead */
        if(dt > 0){ seen++; sum += dt; }
        if(seen === 90 && !perfOff){
          if(sum/seen > .04){ if(!lowered && dpr > 1){ lowered = true; dpr = 1; size(); } else { giveUp(); return; } }
          seen = 0; sum = 0;
        }
      }
      var moving = !reduce || dragging || Math.abs(vel) > .0004;
      if(moving) raf = requestAnimationFrame(loop); else last = 0;
    }
    function kick(){ if(!raf && visible && ready && !dead) raf = requestAnimationFrame(loop); }

    /* drag / swipe to turn it by hand (vertical page scrolling is left alone) */
    var px = 0, pid = null;
    canvas.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; pid = e.pointerId; px = e.clientX; vel = 0; canvas.classList.add('is-drag');
      try{ canvas.setPointerCapture(pid); }catch(x){}
      kick();
    });
    canvas.addEventListener('pointermove', function(e){
      if(!dragging || e.pointerId !== pid) return;
      var dx = e.clientX - px; px = e.clientX;
      var d = dx * 0.009; yaw += d; vel = d*0.9; dirty = true; kick();
      if(reduce || !raf) draw();
    });
    function end(e){
      if(!dragging || (e && e.pointerId !== pid)) return;
      dragging = false; canvas.classList.remove('is-drag');
      resumeAt = performance.now() + 1600; kick();
    }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);

    if('ResizeObserver' in window) new ResizeObserver(function(){ if(ready){ size(); draw(); } }).observe(stage);
    else window.addEventListener('resize', function(){ if(ready){ size(); draw(); } });
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible){ last = 0; dirty = true; kick(); } }, {rootMargin:'80px'}).observe(stage);
    document.addEventListener('visibilitychange', function(){ last = 0; kick(); });
  }
})();
