/* ------------------------------------------------------------------
   Aurora loading screen and page transitions.

   Three arrival modes, chosen by the tiny inline script in each page's <head> (so the Denim Blue cover is on
   screen before the first paint, with no flash of the page underneath):
     aur-full   first page of a visit: the Aurora pattern flows left to right, the logo resolves, the pattern
                sweeps away (about 1.75 s, any tap, key press or click skips it)
     aur-short  arriving from another Aurora page, or any later direct load in the same visit (about 0.55 s)
     aur-fade   the same, for prefers-reduced-motion: a plain fade
   Back/forward and reload get no cover at all. The page is never waiting on the animation: it is built and
   interactive underneath, and a CSS-only failsafe lifts the cover after 3.5 s even if this script never runs.

   Leaving: a click on an ordinary internal page link covers the screen for 0.2 s and then goes to the link.
   Nothing is intercepted that the browser would treat specially (modifier keys, new tabs, downloads, hash-only
   links, other origins, files), and the cover is withdrawn if the page comes back from the back/forward cache or
   the navigation has not happened after 2.5 s.

   The artwork is the pattern on page 12 of the Aurora Brand Standards Guide, unaltered (assets/aurora-pattern.webp,
   cut from the guide's own image), and the official logo. Only transform and opacity animate.
   ------------------------------------------------------------------ */
(function(){
  var d = document.documentElement;
  var veil = document.querySelector('.aur-veil');
  if(!veil) return;

  var MODES = ['aur-full', 'aur-short', 'aur-fade'];
  var mode = MODES.filter(function(c){ return d.classList.contains(c); })[0] || '';
  var TOTAL = {'aur-full':1750, 'aur-short':560, 'aur-fade':300};
  var revealed = false, finished = false, timers = [];

  function later(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; }
  function reveal(){ if(revealed) return; revealed = true; try{ window.dispatchEvent(new Event('aur:reveal')); }catch(e){} }
  function clear(){
    finished = true;
    timers.forEach(clearTimeout); timers = [];
    d.classList.remove('aur-full', 'aur-short', 'aur-fade', 'aur-run', 'aur-skip', 'aur-out');
    veil.textContent = '';
    reveal();
  }

  /* ---- arrival ---- */
  function start(){
    if(finished) return;
    d.classList.add('aur-run');
    later(reveal, Math.round(TOTAL[mode] * 0.62));
    later(clear, TOTAL[mode] + 60);
  }
  if(mode){
    if(mode === 'aur-fade'){ start(); }
    else{
      var p = document.createElement('img');
      p.className = 'aur-pat'; p.alt = ''; p.decoding = 'async'; p.src = 'assets/aurora-pattern.webp';
      veil.appendChild(p);
      if(mode === 'aur-full'){
        var l = document.createElement('img');
        l.className = 'aur-logo'; l.alt = ''; l.decoding = 'async'; l.src = 'assets/logo-white-green.png';
        veil.appendChild(l);
      }
      /* wait for the artwork to be ready so it never pops in, but never longer than 0.35 s */
      var go = function(){ if(!go.done){ go.done = true; start(); } };
      later(go, 350);
      if(p.decode){ p.decode().then(go, go); } else { p.onload = go; p.onerror = go; }
    }
    /* any tap, click or key press ends the full introduction at once */
    if(mode === 'aur-full'){
      var skip = function(){
        if(finished) return;
        d.classList.add('aur-skip');
        reveal();
        later(clear, 220);
      };
      veil.addEventListener('pointerdown', skip, {once:true});
      window.addEventListener('keydown', skip, {once:true});
    }
  }

  /* ---- leaving ---- */
  var leaving = false;
  function isPage(u){
    if(u.protocol !== location.protocol || u.host !== location.host) return false;
    var ext = /\.([a-z0-9]+)$/i.exec(u.pathname);
    if(ext && !/^html?$/i.test(ext[1])) return false;                           /* pdf, images, downloads */
    if(u.pathname === location.pathname && u.search === location.search) return false;   /* same page or hash jump */
    return true;
  }
  document.addEventListener('click', function(e){
    if(e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || leaving) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if(!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u; try{ u = new URL(a.href, location.href); }catch(x){ return; }
    if(!isPage(u)) return;
    e.preventDefault();
    leaving = true;
    d.classList.add('aur-out');
    setTimeout(function(){ location.assign(u.href); }, 200);
    /* if the navigation never happens (offline, blocked), give the page back */
    setTimeout(function(){ leaving = false; d.classList.remove('aur-out'); }, 2500);
  });

  /* back/forward cache restores the page exactly as it was left, cover and all */
  window.addEventListener('pageshow', function(e){
    if(e.persisted){ leaving = false; clear(); }
  });
})();
