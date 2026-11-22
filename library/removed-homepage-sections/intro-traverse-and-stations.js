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

