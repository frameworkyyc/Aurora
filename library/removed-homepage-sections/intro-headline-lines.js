  /* wrap each rendered line of the headline so it can be masked separately */
  function splitLines(el){
    if(!el || el.dataset.split) return;
    var text = el.textContent.replace(/\s+/g,' ').trim();
    var html = el.innerHTML;
    /* keep the emphasis span: rebuild from words, preserving which are inside <em> */
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var words = [];
    (function walk(node, em){
      for(var i=0;i<node.childNodes.length;i++){
        var c = node.childNodes[i];
        if(c.nodeType === 3){
          c.nodeValue.split(/\s+/).forEach(function(w){ if(w) words.push({w:w, em:em}); });
        } else walk(c, em || c.tagName === 'EM');
      }
    })(tmp, false);

    el.innerHTML = '';
    var probes = words.map(function(o){
      var sp = document.createElement('span');
      sp.className = 'wd';
      sp.textContent = o.w + ' ';
      if(o.em) sp.setAttribute('data-em','');
      el.appendChild(sp);
      return sp;
    });

    /* group the probes by the line they landed on */
    var lines = [], last = null;
    probes.forEach(function(sp){
      var top = sp.offsetTop;
      if(last === null || Math.abs(top-last) > 4){ lines.push([]); last = top; }
      lines[lines.length-1].push(sp);
    });

    el.innerHTML = '';
    lines.forEach(function(group){
      var ln = document.createElement('span'); ln.className = 'ln';
      var inner = document.createElement('span');
      group.forEach(function(sp){
        if(sp.hasAttribute('data-em')){
          var em = document.createElement('em'); em.textContent = sp.textContent;
          inner.appendChild(em);
        } else inner.appendChild(document.createTextNode(sp.textContent));
      });
      ln.appendChild(inner); el.appendChild(ln);
    });
    el.dataset.split = '1';
    el.setAttribute('aria-label', text);
  }

  function setup(){
    if(!wide.matches || reduce) return;
    splitLines(intro.querySelector('h2'));
  }
  setup();
  window.addEventListener('resize', function(){
    var h1 = intro.querySelector('h2');
    if(h1 && h1.dataset.split && wide.matches){
      /* re-measure: line breaks move with the viewport */
      h1.innerHTML = h1.getAttribute('aria-label')
        .replace('shovel-holder to stakeholder.','<em>shovel-holder to stakeholder.</em>');
      delete h1.dataset.split;
      splitLines(h1);
      intro.classList.add('lines-in');
    }
  });

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ intro.classList.add('lines-in'); } });
    },{threshold:0.18}).observe(intro);
  } else intro.classList.add('lines-in');

