/* ------------------------------------------------------------------
   Industries rail: a row of photographs, one open at a time.
   Mouse (and trackpad): hover opens a card. Touch and pen: a tap anywhere on a card, photograph included,
   opens it; tapping another card switches; a tap outside the rail closes it. Keyboard: focus or Enter/Space
   opens, arrow keys move.

   Why taps are handled on pointerup and not on click:
   iOS/iPadOS Safari turns a tap into pointer events, then compatibility mouse events (mouseover, mousemove,
   mousedown, mouseup) and only then a click. WebKit withholds that click, and treats the tap as a hover, when
   anything the page runs in response to those events changes what is on screen, and the iPad reports
   hover:hover even without a trackpad. A card that opens only on click therefore needs a second tap on
   a real iPad, even though desktop emulation never shows it. Pointer events arrive before, and independently of,
   that click, so the tap is recognised on pointerup; the click handler stays for mouse, keyboard and old browsers.
   A separate script on purpose: an error elsewhere on the page can no longer stop the rail working.
   ------------------------------------------------------------------ */
(function(){
  var rail = document.querySelector('.ind-rail');
  if(!rail) return;
  var cards = [].slice.call(rail.querySelectorAll('.ind-card'));
  if(!cards.length) return;
  var hoverOK = window.matchMedia('(hover:hover) and (min-width:861px)');
  var hasPointer = 'PointerEvent' in window;

  function open(c){
    cards.forEach(function(k){
      var on = k === c;
      k.classList.toggle('is-open', on);
      var t = k.querySelector('.ind-tab'); if(t) t.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }
  function closeAll(){ open(null); }
  var isLink = function(t){ return !!(t && t.closest && t.closest('.ind-body a')); };
  var MOVE = 12, MAX_MS = 800;
  var press = null;                      /* the touch/pen press in progress: where, when, on which card */
  /* a link in an open card: if the browser withholds its click (the same hover heuristic), follow it ourselves */
  function followLater(a){
    var got = false;
    var mark = function(){ got = true; };
    a.addEventListener('click', mark, {once:true});
    setTimeout(function(){ a.removeEventListener('click', mark); if(!got && a.href) window.location.href = a.href; }, 380);
  }

  cards.forEach(function(c, i){
    var tab = c.querySelector('.ind-tab');
    if(tab){
      tab.addEventListener('focus', function(){ open(c); });
      tab.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if(!d) return;
        e.preventDefault();
        var n = cards[(i + d + cards.length) % cards.length];
        n.querySelector('.ind-tab').focus();
      });
    }
    /* click: mouse, keyboard (Enter/Space on the button) and any browser without pointer events */
    c.addEventListener('click', function(e){ if(!isLink(e.target)) open(c); });

    if(hasPointer){
      c.addEventListener('pointerenter', function(e){ if(e.pointerType === 'mouse' && hoverOK.matches) open(c); });
      c.addEventListener('pointerdown', function(e){
        if(e.pointerType === 'mouse') return;
        press = {id:e.pointerId, x:e.clientX, y:e.clientY, t:Date.now(), card:c};
      });
      c.addEventListener('pointerup', function(e){
        if(e.pointerType === 'mouse' || !press || press.id !== e.pointerId || press.card !== c) return;
        var tap = Math.hypot(e.clientX - press.x, e.clientY - press.y) <= MOVE && Date.now() - press.t <= MAX_MS;
        press = null;
        if(tap && isLink(e.target)){ followLater(e.target.closest('.ind-body a')); return; }
        if(tap) open(c);                              /* one tap, no second tap, whatever Safari does with the click */
      });
      c.addEventListener('pointercancel', function(){ press = null; });   /* it became a scroll */
    } else {
      var ts = null;
      c.addEventListener('touchstart', function(e){ var t = e.touches[0]; ts = {x:t.clientX, y:t.clientY, t:Date.now()}; }, {passive:true});
      c.addEventListener('touchend', function(e){
        var t = e.changedTouches[0];
        if(ts && Math.hypot(t.clientX - ts.x, t.clientY - ts.y) <= MOVE && Date.now() - ts.t <= MAX_MS && !isLink(e.target)) open(c);
        ts = null;
      }, {passive:true});
    }
  });

  /* a tap outside the rail closes the open card (touch and pen only; a mouse leaves the card as it was) */
  var outside = null;
  if(hasPointer){
    document.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'mouse' || rail.contains(e.target)){ outside = null; return; }
      outside = {id:e.pointerId, x:e.clientX, y:e.clientY, t:Date.now()};
    }, true);
    document.addEventListener('pointerup', function(e){
      if(!outside || outside.id !== e.pointerId) return;
      var tap = Math.hypot(e.clientX - outside.x, e.clientY - outside.y) <= MOVE && Date.now() - outside.t <= MAX_MS;
      outside = null;
      if(tap && !rail.contains(e.target)) closeAll();
    }, true);
    document.addEventListener('pointercancel', function(){ outside = null; }, true);
  }
})();
