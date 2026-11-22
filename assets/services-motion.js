/* ===== preserved from library/removed-homepage-sections/setup-rig2d-fallback.js ===== */
/* ---- fallback renderer: canvas 2d, used when WebGL or the three.js CDN is unavailable ---- */
window.__rig2D = function(){
  var sec = document.getElementById('setup');
  var cv  = document.getElementById('rig');
  if(!sec || !cv) return;
  if(!cv.offsetWidth || !cv.offsetHeight) return;
  var ctx = cv.getContext('2d');
  var readout = document.getElementById('readout');
  var beats = [].slice.call(sec.querySelectorAll('.beat'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canFilter = (function(){ try{ ctx.filter='blur(1px)'; var ok = ctx.filter!=='none'; ctx.filter='none'; return ok; }catch(e){ return false; } })();

  var W=0,H=0,dpr=1,s=0,lastS=-1,visible=false;

  /* film grain, generated once */
  var grain = document.createElement('canvas'); grain.width=grain.height=128;
  (function(){
    var g=grain.getContext('2d'), im=g.createImageData(128,128), d=im.data;
    for(var i=0;i<d.length;i+=4){
      var v=128+(Math.random()-0.5)*46;
      d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
    }
    g.putImageData(im,0,0);
  })();

  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    lastS = -1;
  }

  var clamp = function(v,a,b){ return v<a?a:v>b?b:v; };
  var track = function(v,a,b){ return clamp((v-a)/(b-a),0,1); };
  var easeOut = function(v){ return 1-Math.pow(1-v,3); };
  var easeIO  = function(v){ return v<0.5 ? 4*v*v*v : 1-Math.pow(-2*v+2,3)/2; };

  /* ---------- transforms ---------- */
  function T(x,y,z){ return function(p){ return [p[0]+x,p[1]+y,p[2]+z]; }; }
  function S3(x,y,z){ return function(p){ return [p[0]*x,p[1]*y,p[2]*z]; }; }
  function RX(a){ var c=Math.cos(a),n=Math.sin(a); return function(p){ return [p[0], p[1]*c-p[2]*n, p[1]*n+p[2]*c]; }; }
  function RY(a){ var c=Math.cos(a),n=Math.sin(a); return function(p){ return [p[0]*c+p[2]*n, p[1], -p[0]*n+p[2]*c]; }; }
  function RZ(a){ var c=Math.cos(a),n=Math.sin(a); return function(p){ return [p[0]*c-p[1]*n, p[0]*n+p[1]*c, p[2]]; }; }
  function ch(){ var f=arguments; return function(p){ for(var i=0;i<f.length;i++) p=f[i](p); return p; }; }
  var ID = function(p){ return p; };
  function unit(v){ var m=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1; return [v[0]/m,v[1]/m,v[2]/m]; }
  function dirOf(M,d){ var o=M([0,0,0]), q=M(d); return unit([q[0]-o[0],q[1]-o[1],q[2]-o[2]]); }

  /* ---------- camera ---------- */
  var cam = {ry:-0.62, rx:-0.15, dist:6.3, f:3.0, look:1.02, ox:0, oy:0, scale:1};
  var VIEW=[0,0,1], EYE=[0,0,-1];
  function setView(){
    var cy=Math.cos(cam.ry), sy=Math.sin(cam.ry), cx=Math.cos(cam.rx), sx=Math.sin(cam.rx);
    VIEW = [ sy*cx, -sx, -cy*cx ];
    EYE  = [-VIEW[0],-VIEW[1],-VIEW[2]];
  }
  function project(v){
    var x=v[0], y=v[1]-cam.look, z=v[2];
    var c=Math.cos(cam.ry), n=Math.sin(cam.ry);
    var X = x*c + z*n, Z = -x*n + z*c;
    var c2=Math.cos(cam.rx), n2=Math.sin(cam.rx);
    var Y = y*c2 - Z*n2, Z2 = y*n2 + Z*c2;
    var zc = Z2 + cam.dist;
    var k = cam.f/Math.max(0.2,zc) * cam.scale;
    return [cam.ox + X*k, cam.oy - Y*k, zc];
  }

  /* ---------- lighting ---------- */
  var KEY  = unit([-0.55, 0.80, 0.62]);
  var FILL = unit([ 0.70, 0.15,-0.45]);

  /* [specular, shininess, fresnel, metalness] */
  var MAT = {
    plastic:[0.30, 26, 0.16, 0.10],
    paint  :[0.45, 40, 0.14, 0.16],
    metal  :[0.80, 64, 0.26, 0.85],
    rubber :[0.05,  8, 0.07, 0.02],
    glass  :[1.00, 96, 0.50, 0.60]
  };

  var CACHE={};
  function rgbOf(h){ return CACHE[h] || (CACHE[h] = [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]); }

  /* two-band environment: cool sky above, dark ground below */
  var ENV_SKY=[118,143,152], ENV_GND=[10,20,26];

  function litColour(n, hex, mat){
    var base = rgbOf(hex), m = mat || MAT.plastic;
    var d1 = Math.max(0, n[0]*KEY[0]+n[1]*KEY[1]+n[2]*KEY[2]);
    var d2 = Math.max(0, n[0]*FILL[0]+n[1]*FILL[1]+n[2]*FILL[2]);
    var ndv = Math.max(0, n[0]*EYE[0]+n[1]*EYE[1]+n[2]*EYE[2]);
    var hv = unit([KEY[0]+EYE[0], KEY[1]+EYE[1], KEY[2]+EYE[2]]);
    var sp = Math.pow(Math.max(0, n[0]*hv[0]+n[1]*hv[1]+n[2]*hv[2]), m[1]) * m[0];
    var fres = Math.pow(1-ndv, 3) * m[2];
    /* reflected eye vector, sampled against the two-band environment */
    var rd = 2*ndv;
    var ry = rd*n[1] - EYE[1];
    var envMix = clamp(ry*0.5+0.5, 0, 1);
    var er = ENV_GND[0]+(ENV_SKY[0]-ENV_GND[0])*envMix;
    var eg = ENV_GND[1]+(ENV_SKY[1]-ENV_GND[1])*envMix;
    var eb = ENV_GND[2]+(ENV_SKY[2]-ENV_GND[2])*envMix;
    var mt = m[3];
    var amb = 0.30;
    var r = base[0]*(amb + 0.72*d1 + 0.16*d2)*(1-0.40*mt) + er*0.52*mt + 250*sp + 118*fres;
    var g = base[1]*(amb + 0.72*d1 + 0.24*d2)*(1-0.40*mt) + eg*0.52*mt + 250*sp + 146*fres;
    var b = base[2]*(amb + 0.72*d1 + 0.31*d2)*(1-0.40*mt) + eb*0.52*mt + 244*sp + 160*fres;
    return 'rgb('+(r<0?0:r>255?255:r|0)+','+(g<0?0:g>255?255:g|0)+','+(b<0?0:b>255?255:b|0)+')';
  }

  /* ---------- geometry buffer ---------- */
  var faces=[], shadow=[], castOn=true;
  function shadowPoint(p){
    var t = p[1]/KEY[1];
    return project([p[0]-KEY[0]*t, 0.002, p[2]-KEY[2]*t]);
  }
  function poly(pts, hex, mat, nA, nB){
    var a=pts[0], b=pts[1], c=pts[2];
    var e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    var nx=e1[1]*e2[2]-e1[2]*e2[1], ny=e1[2]*e2[0]-e1[0]*e2[2], nz=e1[0]*e2[1]-e1[1]*e2[0];
    var m=Math.sqrt(nx*nx+ny*ny+nz*nz); if(!m) return;
    var n=[nx/m,ny/m,nz/m];
    if(castOn){
      var sh=[]; for(var q=0;q<pts.length;q++) sh.push(shadowPoint(pts[q]));
      shadow.push(sh);
    }
    if(n[0]*VIEW[0]+n[1]*VIEW[1]+n[2]*VIEW[2] > -0.02) return;
    var sp=[], z=0;
    for(var i=0;i<pts.length;i++){ var p2=project(pts[i]); sp.push(p2); z+=p2[2]; }
    var f={p:sp, z:z/pts.length};
    if(nA && nB){
      f.g=[ (sp[0][0]+sp[1][0])/2, (sp[0][1]+sp[1][1])/2,
            (sp[2][0]+sp[3][0])/2, (sp[2][1]+sp[3][1])/2,
            litColour(nA,hex,mat), litColour(nB,hex,mat) ];
    } else {
      f.c = litColour(n,hex,mat);
    }
    faces.push(f);
  }
  function box(w,h,d,hex,M,mat){
    var x=w/2,y=h/2,z=d/2;
    var v=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]].map(M);
    poly([v[4],v[5],v[6],v[7]],hex,mat); poly([v[1],v[0],v[3],v[2]],hex,mat);
    poly([v[5],v[1],v[2],v[6]],hex,mat); poly([v[0],v[4],v[7],v[3]],hex,mat);
    poly([v[3],v[7],v[6],v[2]],hex,mat); poly([v[0],v[1],v[5],v[4]],hex,mat);
  }
  /* cylinder along local Y, smooth-shaded across each strip */
  function cyl(r1,r2,h,seg,hex,M,mat,caps){
    var bot=[], top=[], dir=[];
    for(var i=0;i<seg;i++){
      var t=i/seg*Math.PI*2, cs=Math.cos(t), sn=Math.sin(t);
      bot.push(M([r1*cs,-h/2,r1*sn]));
      top.push(M([r2*cs, h/2,r2*sn]));
      dir.push(dirOf(M,[cs,0,sn]));
    }
    for(var k=0;k<seg;k++){
      var j=(k+1)%seg;
      poly([bot[k],top[k],top[j],bot[j]], hex, mat, dir[k], dir[j]);
    }
    if(caps!==false){ poly(top.slice().reverse(),hex,mat); poly(bot,hex,mat); }
  }
  function cylZ(r1,r2,len,seg,hex,M,mat,caps){ cyl(r1,r2,len,seg,hex,ch(RX(Math.PI/2),M),mat,caps); }
  function disc(r,seg,hex,M,mat){
    var a=[]; for(var i=0;i<seg;i++){ var t=i/seg*Math.PI*2; a.push(M([r*Math.cos(t),0,r*Math.sin(t)])); }
    poly(a.reverse(),hex,mat);
  }

  /* ---------- palette ---------- */
  var YEL='#D9B12A', YEL_D='#93741A', RED='#B81E30', DARK='#23282B', BLACK='#15191B',
      WHITE='#EDEFEC', WARM='#EEF1F1', GREEN='#9BB990', GREEN_D='#7E9E74',
      LENS='#1E7FB0', STEEL='#B6C0C4', ALU='#A9B4B8', SCREEN='#16301F';

  function build(){
    faces.length=0; shadow.length=0;

    var enter  = easeOut(track(s,0.00,0.16));
    var spread = easeIO (track(s,0.10,0.38));
    var drop   = easeIO (track(s,0.32,0.54));
    var swing  = easeIO (track(s,0.48,0.76));
    var tilt   = easeIO (track(s,0.54,0.82));

    cam.ry = -0.74 + 0.30*easeIO(track(s,0,1));
    var push = easeIO(track(s,0.34,0.80));
    cam.look = 1.02 + 0.62*push;
    cam.dist = 6.3 - 3.0*push;
    cam.rx = -0.15 + 0.05*push;
    setView();

    var legLen=1.46, ang=(5+18*spread)*Math.PI/180;
    var hubY = legLen*Math.cos(ang);

    /* ---- tripod ---- */
    castOn = true;
    for(var i=0;i<3;i++){
      var yaw=i*Math.PI*2/3+0.42;
      var L=function(t){ return ch(t, RZ(-ang), RY(yaw), T(0,hubY,0)); };

      box(0.135,0.085,0.115, DARK, L(T(0,-0.055,0)), MAT.rubber);
      cyl(0.019,0.019,0.165,10, STEEL, L(ch(RZ(Math.PI/2), T(0,-0.055,0))), MAT.metal);
      cyl(0.026,0.026,0.014,6, STEEL, L(ch(RZ(Math.PI/2), T(0.085,-0.055,0))), MAT.metal);

      box(0.030,0.80,0.084, YEL, L(T(-0.047,-0.50,0)), MAT.paint);
      box(0.030,0.80,0.084, YEL, L(T( 0.047,-0.50,0)), MAT.paint);
      box(0.031,0.80,0.012, YEL_D, L(T(-0.047,-0.50,0.044)), MAT.paint);
      box(0.031,0.80,0.012, YEL_D, L(T( 0.047,-0.50,0.044)), MAT.paint);

      box(0.150,0.088,0.104, BLACK, L(T(0,-0.905,0)), MAT.rubber);
      cyl(0.015,0.015,0.135,8, STEEL, L(ch(RZ(Math.PI/2), T(0,-0.905,0.022))), MAT.metal);
      cyl(0.031,0.031,0.024,12, DARK, L(ch(RZ(Math.PI/2), T(0.084,-0.905,0.022))), MAT.metal);

      box(0.056,0.62,0.062, ALU, L(T(0,-1.20,0)), MAT.metal);
      box(0.015,0.62,0.064, STEEL, L(T(0,-1.20,0.001)), MAT.metal);
      box(0.072,0.078,0.072, BLACK, L(T(0,-1.475,0)), MAT.rubber);
      cyl(0.020,0.004,0.078,8, STEEL, L(T(0,-1.548,0)), MAT.metal);
      box(0.108,0.017,0.078, DARK, L(T(0,-1.442,0.058)), MAT.rubber);
    }

    /* ---- tripod head ---- */
    cyl(0.238,0.228,0.058,3, RED, ch(RY(0.42), T(0,hubY+0.029,0)), MAT.paint);
    cyl(0.150,0.150,0.032,18, RED, T(0,hubY+0.070,0), MAT.paint);
    cyl(0.029,0.029,0.165,12, STEEL, T(0,hubY-0.058,0), MAT.metal);
    cyl(0.052,0.052,0.032,14, DARK, T(0,hubY-0.150,0), MAT.metal);

    var out={enter:enter, hubY:hubY, drop:drop, tilt:tilt, swing:swing, lens:null};
    if(drop < 0.002){ return out; }

    /* ---- tribrach ---- */
    var dy=(1-drop)*0.85, bY=hubY+0.10+dy;
    cyl(0.126,0.108,0.086,16, DARK, T(0,bY,0), MAT.plastic);
    cyl(0.133,0.133,0.013,16, BLACK, T(0,bY-0.049,0), MAT.rubber);
    for(var j=0;j<3;j++){
      var a2=j*Math.PI*2/3+0.9;
      var F=function(t){ return ch(t, RY(a2), T(0,bY,0)); };
      cyl(0.013,0.013,0.072,10, STEEL, F(T(0.100,-0.030,0)), MAT.metal);
      cyl(0.031,0.031,0.026,14, DARK, F(T(0.100,-0.074,0)), MAT.plastic);
    }
    cyl(0.025,0.025,0.015,12, WARM, T(0.086,bY+0.049,0.046), MAT.glass);

    cyl(0.109,0.100,0.072,18, WHITE, T(0,bY+0.079,0), MAT.plastic);
    cyl(0.113,0.113,0.011,18, ALU,   T(0,bY+0.046,0), MAT.metal);

    /* ---- alidade: wide housing, arms carrying the trunnion ---- */
    var yaw2=(-58+155*swing)*Math.PI/180;
    var A=function(t){ return ch(t, RY(yaw2), T(0,bY+0.108,0)); };

    cyl(0.128,0.134,0.050,20, DARK, A(T(0,0.025,0)), MAT.plastic);          /* standing axis plate */
    box(0.368,0.316,0.252, GREEN, A(T(0,0.202,0)), MAT.paint);
    box(0.352,0.030,0.238, GREEN_D, A(T(0,0.058,0)), MAT.paint);

    for(var sd=-1; sd<=1; sd+=2){
      box(0.098,0.306,0.228, GREEN, A(T(sd*0.135,0.500,0)), MAT.paint);
      cyl(0.050,0.050,0.028,18, GREEN_D, A(ch(RZ(Math.PI/2), T(sd*0.186,0.500,0))), MAT.paint);
    }
    box(0.286,0.286,0.052, GREEN, A(T(0,0.492,-0.086)), MAT.paint);          /* rear panel */

    cyl(0.038,0.032,0.054,18, DARK, A(ch(RZ(Math.PI/2), T(-0.200,0.430,0.02))), MAT.plastic);
    cyl(0.032,0.028,0.042,18, DARK, A(ch(RZ(Math.PI/2), T( 0.200,0.240,0.02))), MAT.plastic);

    /* handle: a flat bar arch */
    for(var hs=0; hs<11; hs++){
      var tm=((hs+0.5)/11)*Math.PI;
      var hx=-Math.cos(tm)*0.136, hy=0.648+Math.sin(tm)*0.136;
      box(0.046,0.040,0.064, GREEN, A(ch(RZ(-(tm-Math.PI/2)), T(hx,hy,0))), MAT.paint);
    }
    for(var hd=-1; hd<=1; hd+=2)
      box(0.058,0.052,0.064, GREEN, A(T(hd*0.136,0.622,0)), MAT.paint);

    /* the big angled control face */
    var CF=function(t){ return A(ch(t, RX(0.46), RY(Math.PI), T(0,0.196,-0.150))); };
    box(0.300,0.190,0.026, DARK, CF(ID), MAT.plastic);
    box(0.282,0.172,0.006, DARK, CF(T(0,0,0.016)), MAT.plastic);
    box(0.250,0.070,0.004, SCREEN, CF(T(0,0.045,0.020)), MAT.glass);
    for(var ky=0;ky<3;ky++) for(var kx=0;kx<5;kx++)
      box(0.036,0.018,0.005, '#C6CDCF', CF(T(-0.096+kx*0.048,-0.028-ky*0.030,0.020)), MAT.plastic);
    for(var cs=-1; cs<=1; cs+=2)
      box(0.020,0.190,0.030, WHITE, CF(T(cs*0.150,0,-0.004)), MAT.plastic);

    /* ---- telescope: short, thick, recessed between the arms ---- */
    var pit=(22-25*tilt)*Math.PI/180;
    var TE=function(t){ return A(ch(t, RX(pit), T(0,0.500,0))); };
    box(0.168,0.166,0.236, WHITE, TE(ID), MAT.plastic);
    box(0.176,0.040,0.070, GREEN_D, TE(T(0,-0.078,-0.020)), MAT.paint);
    cylZ(0.088,0.088,0.052,26, DARK, TE(T(0,0,0.128)), MAT.plastic, false);
    disc(0.066,26, LENS, TE(ch(RX(-Math.PI/2), T(0,0,0.152))), MAT.glass);
    cylZ(0.052,0.052,0.056,20, DARK, TE(T(0,0,-0.130)), MAT.plastic, false);
    cylZ(0.057,0.057,0.032,20, DARK, TE(T(0,0,-0.152)), MAT.rubber, false);
    box(0.058,0.040,0.022, DARK, TE(T(0,0.078,0.108)), MAT.plastic);
    box(0.030,0.058,0.030, DARK, TE(T(0,0.098,0.010)), MAT.plastic);
    for(var td=-1; td<=1; td+=2)
      cyl(0.042,0.042,0.026,18, GREEN_D, TE(ch(RZ(Math.PI/2), T(td*0.086,0,0))), MAT.paint);

    /* ---- antenna ---- */
    cyl(0.011,0.011,0.24,10, ALU, A(ch(RZ(-0.08), T(-0.150,0.590,-0.128))), MAT.metal);
    cyl(0.017,0.013,0.040,10, BLACK, A(ch(RZ(-0.08), T(-0.150,0.720,-0.128))), MAT.rubber);


    /* where the objective sits on screen, for the glint */
    out.lens = project(TE(T(0,0,0.152))([0,0,0]));
    out.lensN = dirOf(TE(ID),[0,0,1]);
    return out;
  }

  /* ---------- render ---------- */
  function draw(){
    ctx.clearRect(0,0,W,H);
    var narrow = W<620;
    cam.scale = Math.min(H*(narrow?0.56:0.62), W*1.45);
    cam.ox = W*(narrow?0.50:0.52);
    cam.oy = H*0.56;

    var st = build();
    var enter = st.enter;
    if(enter <= 0.001) return;

    ctx.save();
    ctx.globalAlpha = enter;
    ctx.translate((1-enter)*W*0.42, 0);

    /* ambient occlusion pool on the ground */
    var gy = cam.oy + cam.scale*0.50;
    var ao = ctx.createRadialGradient(cam.ox, gy, 2, cam.ox, gy, cam.scale*0.46);
    ao.addColorStop(0,'rgba(3,12,17,.55)'); ao.addColorStop(0.5,'rgba(3,12,17,.24)'); ao.addColorStop(1,'rgba(3,12,17,0)');
    ctx.fillStyle = ao;
    ctx.beginPath(); ctx.ellipse(cam.ox, gy, cam.scale*0.46, cam.scale*0.14, 0, 0, Math.PI*2); ctx.fill();

    /* cast shadow: one union fill, blurred once */
    if(shadow.length){
      ctx.save();
      if(canFilter) ctx.filter = 'blur('+(cam.scale*0.018).toFixed(1)+'px)';
      ctx.globalAlpha = enter*0.42;
      ctx.fillStyle = 'rgba(2,10,15,1)';
      ctx.beginPath();
      for(var i2=0;i2<shadow.length;i2++){
        var sp2=shadow[i2];
        ctx.moveTo(sp2[0][0], sp2[0][1]);
        for(var j2=1;j2<sp2.length;j2++) ctx.lineTo(sp2[j2][0], sp2[j2][1]);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }

    /* the instrument */
    faces.sort(function(a,b){ return b.z-a.z; });
    for(var i=0;i<faces.length;i++){
      var f=faces[i], pt=f.p, style;
      if(f.g){
        var lg2 = ctx.createLinearGradient(f.g[0],f.g[1],f.g[2],f.g[3]);
        lg2.addColorStop(0,f.g[4]); lg2.addColorStop(1,f.g[5]);
        style = lg2;
      } else style = f.c;
      ctx.fillStyle = style; ctx.strokeStyle = style; ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(pt[0][0], pt[0][1]);
      for(var j=1;j<pt.length;j++) ctx.lineTo(pt[j][0], pt[j][1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    /* line of sight */
    var beam = track(s,0.72,0.94);
    if(beam>0 && st.drop>0.9){
      var pit=(22-25*st.tilt)*Math.PI/180;
      var yaw2=(-58+155*st.swing)*Math.PI/180;
      var bY=st.hubY+0.10;
      var mk=function(d){ return ch(T(0,0,d), RX(pit), T(0,0.470,0), RY(yaw2), T(0,bY+0.114,0))([0,0,0]); };
      var a1=project(mk(0.26)), a2=project(mk(0.30+7.5*beam));
      var halo=ctx.createLinearGradient(a1[0],a1[1],a2[0],a2[1]);
      halo.addColorStop(0,'rgba(59,182,87,.22)'); halo.addColorStop(1,'rgba(31,131,167,0)');
      ctx.strokeStyle=halo; ctx.lineWidth=7;
      ctx.beginPath(); ctx.moveTo(a1[0],a1[1]); ctx.lineTo(a2[0],a2[1]); ctx.stroke();
      var lg=ctx.createLinearGradient(a1[0],a1[1],a2[0],a2[1]);
      lg.addColorStop(0,'rgba(130,240,160,.95)'); lg.addColorStop(0.35,'rgba(59,182,87,.7)');
      lg.addColorStop(1,'rgba(31,131,167,0)');
      ctx.strokeStyle=lg; ctx.lineWidth=2.2;
      ctx.beginPath(); ctx.moveTo(a1[0],a1[1]); ctx.lineTo(a2[0],a2[1]); ctx.stroke();
    }

    /* glint on the objective when it turns toward the light */
    if(st.lens && st.lensN){
      var toKey = st.lensN[0]*KEY[0]+st.lensN[1]*KEY[1]+st.lensN[2]*KEY[2];
      var toEye = st.lensN[0]*EYE[0]+st.lensN[1]*EYE[1]+st.lensN[2]*EYE[2];
      var gl = Math.max(0, toEye)*0.55 + Math.max(0, toKey)*0.45;
      if(gl > 0.15){
        var rr = cam.scale*0.075*gl;
        var fl = ctx.createRadialGradient(st.lens[0],st.lens[1],0,st.lens[0],st.lens[1],rr);
        fl.addColorStop(0,'rgba(215,245,255,'+(0.55*gl).toFixed(2)+')');
        fl.addColorStop(0.4,'rgba(120,200,235,'+(0.20*gl).toFixed(2)+')');
        fl.addColorStop(1,'rgba(90,180,220,0)');
        ctx.fillStyle=fl;
        ctx.beginPath(); ctx.arc(st.lens[0],st.lens[1],rr,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();

    /* bloom + grain, applied only where the frame is already painted */
    if(canFilter){
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=0.12; ctx.filter='blur(8px)';
      ctx.drawImage(cv,0,0,W,H);
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation='source-atop';
    ctx.globalAlpha=0.055;
    var pat=ctx.createPattern(grain,'repeat');
    ctx.fillStyle=pat; ctx.fillRect(0,0,W,H);
    ctx.restore();

    if(readout) readout.classList.toggle('live', s>0.80);
    var live = s<0.34 ? 0 : s<0.62 ? 1 : 2;
    for(var k=0;k<beats.length;k++) beats[k].classList.toggle('live', k===live);
  }

  function progress(){ return window.__sectionProgress(sec); }
  function frame(){
    if(visible){
      s = progress();
      if(Math.abs(s-lastS) > 0.0004){ lastS=s; draw(); }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', function(){ resize(); s=progress(); draw(); });
  resize();

  if(reduce){
    s=1; draw();
    for(var k2=0;k2<beats.length;k2++) beats[k2].classList.add('live');
  } else {
    s=progress(); draw();
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){ visible=e.isIntersecting; });
      },{threshold:0}).observe(sec);
    } else { visible=true; }
    frame();
  }
};


/* ===== preserved from library/removed-homepage-sections/setup-total-station-webgl.js ===== */
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


/* ===== preserved from library/removed-homepage-sections/setup-instrument-readings.js ===== */
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



/* ===== preserved from library/removed-homepage-sections/capture-visualization.js ===== */
/* ---- 06 · reality capture ---------------------------------------------
   The same points throughout: scattered returns, then pulled onto their true
   positions, then joined into surfaces, then resolved to a clean deliverable.
   One dataset, four states, so the idea reads without a caption. */
(function(){
  var sec = document.getElementById('capture');
  var cv  = sec && sec.querySelector('.capture-canvas');
  if(!sec || !cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var legend = [].slice.call(sec.querySelectorAll('.capture-legend li'));
  var steps  = [].slice.call(sec.querySelectorAll('.capture-steps li'));
  var counter = sec.querySelector('[data-cap-n]');

  var W=0,H=0,dpr=1,p=0,t=0,raf=0,live=false,pts=null,edges=null;

  function rnd(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var v = Math.imul(seed ^ seed>>>15, 1 | seed);
    v = v + Math.imul(v ^ v>>>7, 61 | v) ^ v;
    return ((v ^ v>>>14) >>> 0) / 4294967296; }; }

  /* The subject is a bridge crossing a cut: the Baffin job in section. Points
     are generated on the surfaces themselves rather than scattered through a
     volume, so the cloud actually resolves into a structure you can read. */
  function ground(u){
    return 0.74
      - 0.15*Math.exp(-Math.pow((u-0.10)/0.20,2))
      - 0.12*Math.exp(-Math.pow((u-0.95)/0.18,2))
      + 0.10*Math.exp(-Math.pow((u-0.50)/0.16,2));   /* the cut, mid-span */
  }
  var DECK_Y = 0.44, PIER_U = [0.34, 0.66];

  function build(){
    var r = rnd(4242);
    var dense = W < 700 ? 0.55 : 1;
    pts = [];  edges = [];

    function emit(x, y, kind, keep){
      pts.push({
        tx:x, ty:y, kind:kind, keep:keep,
        rx: x + (r()-0.5)*0.17, ry: y + (r()-0.5)*0.15,
        jx: r()-0.5, jy: r()-0.5,
        a: 0.30 + r()*0.55, ph: r()*Math.PI*2
      });
      return pts.length-1;
    }

    /* ground, as a run of returns along the surface with a little thickness */
    var gN = Math.round(420*dense), gIdx = [];
    for(var i=0;i<gN;i++){
      var u = i/(gN-1);
      var y = ground(u) + (r()-0.5)*0.012;
      gIdx.push(emit(u, y, 'ground', r()));
      if(r() < 0.5) emit(u + (r()-0.5)*0.01, y + 0.012 + r()*0.05, 'ground', r()*0.4);
    }
    for(var g=0;g<gIdx.length-1;g++) edges.push([gIdx[g], gIdx[g+1]]);

    /* the deck: two faces and a run of edge returns */
    var dN = Math.round(300*dense), dTop=[], dBot=[];
    for(var j=0;j<dN;j++){
      var uu = 0.06 + (j/(dN-1))*0.88;
      dTop.push(emit(uu, DECK_Y + (r()-0.5)*0.006, 'deck', r()));
      dBot.push(emit(uu, DECK_Y + 0.030 + (r()-0.5)*0.006, 'deck', r()*0.5));
    }
    for(var d2=0;d2<dTop.length-1;d2++){
      edges.push([dTop[d2], dTop[d2+1]]);
      edges.push([dBot[d2], dBot[d2+1]]);
      if(d2 % 12 === 0) edges.push([dTop[d2], dBot[d2]]);
    }

    /* piers down to the bed */
    PIER_U.forEach(function(pu){
      var top = DECK_Y + 0.030, bot = ground(pu);
      var n = Math.round(90*dense), col=[];
      for(var k=0;k<n;k++){
        var f = k/(n-1);
        col.push(emit(pu + (r()-0.5)*0.014, top + (bot-top)*f, 'pier', r()));
      }
      for(var c=0;c<col.length-1;c++) edges.push([col[c], col[c+1]]);
    });

    /* scatter: vegetation and noise the scanner also picks up */
    var sN = Math.round(260*dense);
    for(var m=0;m<sN;m++){
      var su = r(), sy = ground(su) - r()*0.10;
      emit(su, sy, 'noise', r()*0.10);
    }
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    if(!W||!H) return;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    build();
  }

  function progress(){
    return window.matchMedia('(max-width:860px)').matches
      ? noteProgress(window.__pinProgress(sec, sec.querySelector('.capture-sticky')))
      : window.__sectionProgress(sec);
  }

  /* On a phone the four notes scroll past in equal quarters, and each one
     should leave the drawing in its own state: raw returns, registered cloud,
     surface mesh, deliverable. So scroll position is mapped onto the animation
     through knots at each note's midpoint, which makes every note bring a
     change instead of the stages bunching up between notes. */
  var KNOTS = [[0,0],[0.125,0.08],[0.375,0.38],[0.625,0.68],[0.875,0.97],[1,1]];
  function noteProgress(s){
    for(var i=1;i<KNOTS.length;i++){
      if(s <= KNOTS[i][0]){
        var a = KNOTS[i-1], b = KNOTS[i];
        return a[1] + (b[1]-a[1]) * (s-a[0]) / (b[0]-a[0]);
      }
    }
    return 1;
  }

  var sm = function(v){ v = v<0?0:v>1?1:v; return v*v*v*(v*(v*6-15)+10); };

  function draw(){
    if(!W||!H||!pts) return;
    ctx.clearRect(0,0,W,H);
    var bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#05364c'); bg.addColorStop(0.55,'#032e41'); bg.addColorStop(1,'#05364c');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    /* four stages, overlapping only at their edges */
    var reg  = sm((p-0.10)/0.26);      /* returns pulled onto position */
    var mesh = sm((p-0.42)/0.24);      /* surfaces joined */
    var deliv= sm((p-0.70)/0.26);      /* resolved to line work */

    var pad = Math.min(W,H)*0.10;
    /* on a wide screen the drawing keeps to the right, so the notes on the
       left always have clear ground under them */
    var x0 = W > 900 ? W*0.40 : pad*0.6;
    var vw = (W - pad) - x0, vh = H - pad*2;
    function px(u,v){ return [x0 + u*vw, pad + v*vh]; }

    /* the scan sweep, only while the returns are still landing */
    if(reg < 1){
      var sx = pad + ((t*0.16)%1)*vw;
      var sg = ctx.createLinearGradient(sx-40,0,sx+40,0);
      sg.addColorStop(0,'rgba(90,220,160,0)');
      sg.addColorStop(0.5,'rgba(90,220,160,'+(0.14*(1-reg)).toFixed(3)+')');
      sg.addColorStop(1,'rgba(90,220,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(sx-40, pad, 80, vh);
    }

    /* mesh: drawn under the points, fading up as they connect */
    if(mesh > 0.01 && edges){
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(143,193,211,'+(0.30*mesh*(1-deliv*0.55)).toFixed(3)+')';
      ctx.beginPath();
      var step = deliv > 0.5 ? 2 : 1;
      for(var e=0;e<edges.length;e+=step){
        var A = pts[edges[e][0]], B = pts[edges[e][1]];
        var a1 = px(A.tx,A.ty), b1 = px(B.tx,B.ty);
        ctx.moveTo(a1[0],a1[1]); ctx.lineTo(b1[0],b1[1]);
      }
      ctx.stroke();
    }

    /* the points themselves */
    var shown = 0;
    for(var i=0;i<pts.length;i++){
      var P = pts[i];
      /* raw scatter drifts; registered points hold still */
      var driftX = reduce ? 0 : P.jx * 0.012 * Math.sin(t*0.7 + P.ph);
      var driftY = reduce ? 0 : P.jy * 0.010 * Math.cos(t*0.6 + P.ph);
      var u = P.rx + (P.tx - P.rx)*reg + driftX*(1-reg);
      var v = P.ry + (P.ty - P.ry)*reg + driftY*(1-reg);
      var q = px(u,v);

      /* once it becomes a deliverable, most points retire and the linework carries it */
      var fade = 1 - deliv*(P.keep > 0.14 ? 1 : 0.30);
      if(fade <= 0.02) continue;
      shown++;
      var a = P.a * (0.30 + 0.70*reg) * fade;
      var hue = P.kind==='deck' ? 172 : P.kind==='pier' ? 186 : P.kind==='noise' ? 120 : 150;
      ctx.fillStyle = 'hsla('+hue+',58%,'+(P.kind==='noise'?46:64)+'%,'+a.toFixed(3)+')';
      var r = (P.kind==='noise' ? 0.9 : 1.35) * (1 + 0.45*(1-reg));
      ctx.fillRect(q[0], q[1], r, r);
    }

    /* the deliverable: the deck and banks drawn as clean section lines */
    if(deliv > 0.01){
      ctx.strokeStyle = 'rgba(150,235,190,'+(0.85*deliv).toFixed(3)+')';
      ctx.lineWidth = 1.3;
      /* ground line */
      ctx.beginPath();
      for(var s2=0;s2<=140;s2++){
        var uu = s2/140, pp = px(uu, ground(uu));
        s2 ? ctx.lineTo(pp[0],pp[1]) : ctx.moveTo(pp[0],pp[1]);
      }
      ctx.stroke();
      /* deck and piers */
      ctx.beginPath();
      var dl = px(0.06, DECK_Y), dr = px(0.94, DECK_Y);
      var dl2 = px(0.06, DECK_Y+0.030), dr2 = px(0.94, DECK_Y+0.030);
      ctx.moveTo(dl[0],dl[1]);  ctx.lineTo(dr[0],dr[1]);
      ctx.moveTo(dl2[0],dl2[1]); ctx.lineTo(dr2[0],dr2[1]);
      PIER_U.forEach(function(uu){
        var top = px(uu, DECK_Y+0.030), bot = px(uu, ground(uu));
        ctx.moveTo(top[0],top[1]); ctx.lineTo(bot[0],bot[1]);
      });
      ctx.stroke();
      /* a dimension line, because that is what a deliverable carries */
      ctx.globalAlpha = deliv;
      var l = px(PIER_U[0],0.88), r2 = px(PIER_U[1],0.88);
      ctx.strokeStyle = 'rgba(143,193,211,.75)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(l[0],l[1]); ctx.lineTo(r2[0],r2[1]);
      ctx.moveTo(l[0],l[1]-5); ctx.lineTo(l[0],l[1]+5);
      ctx.moveTo(r2[0],r2[1]-5); ctx.lineTo(r2[0],r2[1]+5);
      ctx.stroke();
      ctx.font = '500 10px ui-monospace,Menlo,monospace';
      ctx.fillStyle = 'rgba(200,226,230,.9)';
      ctx.fillText('30.480 m', (l[0]+r2[0])/2 - 26, l[1]-9);
      ctx.globalAlpha = 1;
    }

    var stage = deliv>0.5 ? 3 : mesh>0.5 ? 2 : reg>0.5 ? 1 : 0;
    for(var g=0;g<legend.length;g++) legend[g].classList.toggle('on', g<=stage);
    for(var h2=0;h2<steps.length;h2++) steps[h2].classList.toggle('live', h2===stage);
    if(counter) counter.textContent = (shown*3210).toLocaleString();
  }

  function loop(){
    if(live){ t += 0.016; p = progress(); draw(); }
    raf = live ? requestAnimationFrame(loop) : 0;
  }
  window.addEventListener('resize', function(){ resize(); p=progress(); draw(); });
  resize(); p=progress(); draw();
  if(reduce) return;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){ if(!raf){ live=true; raf=requestAnimationFrame(loop);} }
        else live=false;
      });
    },{threshold:0}).observe(sec);
  } else { live=true; loop(); }
})();

/* ---- the section heading recedes once its first note is live, so the two
        never sit on top of each other ---- */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  [['#capture','.capture-head']].forEach(function(pair){
    var sec = document.querySelector(pair[0]);
    var head = sec && sec.querySelector(pair[1]);
    if(!sec || !head) return;
    head.style.transition = 'opacity .55s ease, transform .55s cubic-bezier(.2,.8,.3,1)';
    var on = null, ticking = false;
    function update(){
      var p = pair[0]==='#capture' && window.matchMedia('(max-width:860px)').matches
        ? window.__pinProgress(sec, sec.querySelector('.capture-sticky'))
        : window.__sectionProgress(sec);
      var show = p < 0.14;
      if(show !== on){
        on = show;
        head.style.opacity = show ? '1' : '0';
        head.style.transform = show ? 'none' : 'translateY(-10px)';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }, {passive:true});
    update();
    if(reduce){ head.style.opacity='1'; head.style.transform='none'; }
  });
})();


