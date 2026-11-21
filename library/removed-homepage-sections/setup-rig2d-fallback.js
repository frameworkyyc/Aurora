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

