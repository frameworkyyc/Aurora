/* ------------------------------------------------------------------
   Services — "Where Aurora works": the latitude traverse.
   A horizontal axis (south at the left, north at the right) with one marker per
   project location. A run sweeps along it as the section enters view and lights
   each marker it passes. Hover, focus or tap a marker for a small project preview.
   The data lives in the visible lists (#saProjects li[data-*]) so the page reads
   fully without JavaScript; this only adds the graphic.
   Reuses the original traverse's approach (library/removed-homepage-sections/
   intro-traverse-and-stations.js): latitude positioning and a sweeping run.
   Marker positions follow latitude, then are eased apart so nothing overlaps;
   the small ticks on the axis keep the true latitude positions.
   ------------------------------------------------------------------ */
(function(){
  var host = document.getElementById('saTraverse');
  var src = document.getElementById('saProjects');
  if(!host || !src) return;
  var items = [].slice.call(src.querySelectorAll('li[data-place]'));
  if(!items.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  var data = items.map(function(li){
    var d = li.dataset;
    return {place:d.place, pos:parseFloat(d.pos), lat:d.lat||'', loc:d.loc, title:d.title, desc:d.desc||'', img:d.img||'', href:d.href||''};
  }).sort(function(a,b){ return a.pos - b.pos; });

  var LAT_MIN = 48.4, LAT_MAX = 66.9;
  var u = function(lat){ return (lat - LAT_MIN)/(LAT_MAX - LAT_MIN); };

  host.hidden = false;
  host.innerHTML =
    '<p class="sat-label">Where we work &middot; Vancouver to Baffin Island</p>' +
    '<div class="sat-axis" id="satAxis">' +
      '<span class="sat-line"></span><span class="sat-run"></span><span class="sat-dot"></span><span class="sat-ticks"></span>' +
    '</div>' +
    '<div class="sat-pop" id="satPop" role="region" aria-live="polite" aria-label="Project preview" hidden></div>';
  var axis = host.querySelector('.sat-axis');
  var run = host.querySelector('.sat-run');
  var dot = host.querySelector('.sat-dot');
  var ticks = host.querySelector('.sat-ticks');
  var pop = host.querySelector('#satPop');

  var markers = data.map(function(p, i){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sat-m sat-m--' + (i%2 ? 'b' : 'a');
    b.style.setProperty('--i', i);
    b.setAttribute('aria-haspopup', 'true');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'satPop');
    b.setAttribute('aria-label', p.place + ': ' + p.title + '. Show project preview');
    b.innerHTML = '<i class="d"></i><span class="lab"><b>' + p.place + '</b>' + (p.lat ? p.lat + '&deg;N' : '') + '</span>';
    axis.appendChild(b);
    var t = document.createElement('span'); t.className = 'sat-tick'; ticks.appendChild(t);
    return {el:b, tick:t, p:p, x:0, frac:0};
  });

  /* ---- layout: latitude first, then eased apart so dots and labels never collide ---- */
  var W = 0;
  function layout(){
    W = axis.clientWidth; if(!W) return;
    var phone = W < 520;
    var padE = phone ? 16 : 34;
    var sep = phone ? Math.min(34, (W - padE*2)/(markers.length)) : Math.min(120, Math.max(86, (W - padE*2)/(markers.length+0.3)));
    var xs = markers.map(function(m){ return padE + u(m.p.pos)*(W - padE*2); });
    for(var i=1;i<xs.length;i++) if(xs[i]-xs[i-1] < sep) xs[i] = xs[i-1] + sep;
    var last = W - padE;
    if(xs[xs.length-1] > last){ xs[xs.length-1] = last; for(i=xs.length-2;i>=0;i--) if(xs[i+1]-xs[i] < sep) xs[i] = xs[i+1] - sep; }
    markers.forEach(function(m, k){
      m.x = xs[k]; m.frac = xs[k]/W;
      m.el.style.left = xs[k].toFixed(1) + 'px';
      m.tick.style.left = (padE + u(m.p.pos)*(W - padE*2)).toFixed(1) + 'px';
    });
    host.classList.toggle('sat--phone', phone);
    if(openIdx > -1) place(openIdx);
  }

  /* ---- the preview ---- */
  var openIdx = -1, closeT = 0;
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fill(p){
    var names = p.title.indexOf(' / ') > -1 ? p.title.split(' / ') : null;
    pop.innerHTML =
      (p.img ? '<img src="' + esc(p.img) + '" alt="" width="760" height="428" loading="lazy">' : '') +
      '<div class="sat-pop-b">' +
        '<p class="sat-pop-loc">' + esc(p.loc) + '</p>' +
        (names ? '<h3>North Coast projects</h3><ul>' + names.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>'
               : '<h3>' + esc(p.title) + '</h3>') +
        (p.desc ? '<p class="sat-pop-d">' + esc(p.desc) + '</p>' : '') +
        (p.href ? '<a class="sat-pop-a" href="' + esc(p.href) + '">Project details <i aria-hidden="true">&rarr;</i></a>' : '') +
      '</div>';
  }
  function place(i){
    var m = markers[i];
    var phone = host.classList.contains('sat--phone');
    var w = Math.min(340, host.clientWidth);
    var left = Math.max(0, Math.min(host.clientWidth - w, m.x - w/2));
    if(phone){ pop.style.left = ''; pop.style.width = ''; pop.style.top = ''; pop.style.setProperty('--arrow', m.x + 'px'); }
    else {
      pop.style.left = left + 'px'; pop.style.width = w + 'px';
      pop.style.setProperty('--arrow', (m.x - left) + 'px');
      /* opens upward from the axis, over the text above it, so the page below never moves */
      pop.classList.remove('is-down');
      pop.style.top = (axis.offsetTop + 66 - pop.offsetHeight) + 'px';
      /* not enough room above (under the fixed header)? open downward instead */
      if(pop.getBoundingClientRect().top < 86){ pop.classList.add('is-down'); pop.style.top = (axis.offsetTop + 112) + 'px'; }
    }
  }
  function show(i){
    clearTimeout(closeT);
    if(openIdx === i) return;
    if(openIdx > -1){ markers[openIdx].el.classList.remove('is-open'); markers[openIdx].el.setAttribute('aria-expanded','false'); }
    openIdx = i; fill(markers[i].p); pop.hidden = false; place(i);
    var im = pop.querySelector('img'); if(im && !im.complete) im.addEventListener('load', function(){ if(openIdx === i) place(i); });
    markers[i].el.classList.add('is-open'); markers[i].el.setAttribute('aria-expanded','true');
  }
  function hide(){
    clearTimeout(closeT);
    if(openIdx > -1){ markers[openIdx].el.classList.remove('is-open'); markers[openIdx].el.setAttribute('aria-expanded','false'); }
    openIdx = -1; pop.hidden = true;
  }
  function later(){ clearTimeout(closeT); closeT = setTimeout(hide, 240); }

  markers.forEach(function(m, i){
    m.el.addEventListener('click', function(e){ e.stopPropagation(); openIdx === i ? hide() : show(i); });
    if(canHover){
      m.el.addEventListener('mouseenter', function(){ show(i); });
      m.el.addEventListener('mouseleave', later);
    }
    m.el.addEventListener('focus', function(){ if(m.el.matches(':focus-visible')) show(i); });   /* keyboard focus only; taps open via click */
  });
  pop.addEventListener('mouseenter', function(){ clearTimeout(closeT); });
  pop.addEventListener('mouseleave', function(){ if(canHover) later(); });
  document.addEventListener('click', function(e){ if(openIdx > -1 && !host.contains(e.target)) hide(); });
  host.addEventListener('click', function(e){ if(openIdx > -1 && !e.target.closest('.sat-m') && !e.target.closest('.sat-pop')) hide(); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && openIdx > -1){ var el = markers[openIdx].el; hide(); el.focus(); }
  });

  /* ---- the run: sweeps south to north, lighting each marker it reaches ---- */
  var PERIOD = 11000, raf = 0, live = false, t0 = 0;
  var clamp = function(v,a,b){ return v < a ? a : v > b ? b : v; };
  function paint(travel, fade){
    var runW = (travel*100).toFixed(2) + '%';
    run.style.width = runW; run.style.opacity = fade.toFixed(3);
    dot.style.left = runW; dot.style.opacity = (fade*0.95).toFixed(3);
    for(var i=0;i<markers.length;i++){
      var d = travel - markers[i].frac;
      if(d >= 0 && fade > 0.12) markers[i].el.classList.add('passed');   /* lit markers stay lit */
      markers[i].el.classList.toggle('hit', Math.abs(d) < 0.014 && fade > 0.12);
    }
  }
  function step(now){
    if(!live){ raf = 0; return; }
    var u2 = ((now - t0) % PERIOD)/PERIOD;
    var travel = clamp(u2/0.62, 0, 1);
    var fade = Math.min(1, u2/0.04) * (1 - clamp((u2-0.7)/0.3, 0, 1));
    if(u2 > 0.7){ travel = 1; }
    paint(travel, fade);
    /* after the first sweep the markers stay lit; the line rests */
    raf = requestAnimationFrame(step);
  }
  function startRun(){ if(reduce || raf) return; live = true; t0 = performance.now(); raf = requestAnimationFrame(step); }
  function stopRun(){ live = false; }

  layout();
  if('ResizeObserver' in window) new ResizeObserver(layout).observe(axis); else window.addEventListener('resize', layout);

  if(reduce){
    host.classList.add('in');
    run.style.width = '100%'; run.style.opacity = '.55';
    markers.forEach(function(m){ m.el.classList.add('passed'); });
  } else if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){ host.classList.add('in'); startRun(); } else stopRun();
      });
    }, {threshold:0.35}).observe(axis);
  } else { host.classList.add('in'); startRun(); }
})();
