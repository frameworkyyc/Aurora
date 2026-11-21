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


