/* ------------------------------------------------------------------
   Industries rail: a row of photographs, one open at a time.
   Mouse: hover opens a card. Touch and pen: a tap anywhere on a card, photograph included, opens it and a tap on
   another card switches. A tap outside the rail closes it. Keyboard: focus or Enter/Space opens, arrows move.

   Three paths, each simple, and none of them touches a link:
   1. pointerup (touch/pen only): opens the card at the moment the finger lifts. The browser itself reports a
      scroll as pointercancel, so no distance or time thresholds are needed (strict ones dropped real taps).
   2. click: mouse, keyboard and browsers without pointer events. Opening is idempotent, so a tap that also
      produces a click does the same thing twice, harmlessly.
   3. pointerenter (mouse only, hover-capable wide screens): hover opens.
   Links inside a card are never intercepted: the browser navigates them natively, once.
   Nothing here reacts to touch by changing the page before the tap ends, and no other script on the page
   changes content on a touch pointermove, which is what makes iOS Safari withhold a click.
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
      if(k.classList.contains('is-open') !== on) k.classList.toggle('is-open', on);
      var t = k.querySelector('.ind-tab');
      var v = on ? 'true' : 'false';
      if(t && t.getAttribute('aria-expanded') !== v) t.setAttribute('aria-expanded', v);
    });
  }
  var inLink = function(t){ return !!(t && t.closest && t.closest('.ind-body a')); };

  cards.forEach(function(c, i){
    var tab = c.querySelector('.ind-tab');
    if(tab){
      tab.addEventListener('focus', function(){ open(c); });
      tab.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if(!d) return;
        e.preventDefault();
        cards[(i + d + cards.length) % cards.length].querySelector('.ind-tab').focus();
      });
    }
    c.addEventListener('click', function(e){ if(!inLink(e.target)) open(c); });
    if(hasPointer){
      c.addEventListener('pointerup', function(e){ if(e.pointerType !== 'mouse' && !inLink(e.target)) open(c); });
      c.addEventListener('pointerenter', function(e){ if(e.pointerType === 'mouse' && hoverOK.matches) open(c); });
    }
  });

  /* a tap outside the rail closes the open card (touch and pen); a scroll is a pointercancel and never gets here */
  if(hasPointer){
    var down = null;
    document.addEventListener('pointerdown', function(e){ down = (e.pointerType !== 'mouse' && !rail.contains(e.target)) ? e.pointerId : null; }, true);
    document.addEventListener('pointerup', function(e){
      if(down === e.pointerId && !rail.contains(e.target)) open(null);
      down = null;
    }, true);
    document.addEventListener('pointercancel', function(){ down = null; }, true);
  }
})();
