/* Seam-free local motion: one texture, smooth displacement, no duplicated limbs. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let dispose = () => {};
  let bounce = () => {};
  const enabled = true;
  const positions = {
    crete:[.1545,.157,.0385,.09], hku:[.342,.275,.076,.192],
    campus:[.192,.501,.092,.128], nuaa:[.1504,.282,.049,.109],
    awards:[.153,.667,.07,.16], sumec:[.488,.668,.17,.18],
    chinaDaily:[.604,.685,.16,.18], broadcast:[.577,.73,.04,.15],
    eastern:[.697,.704,.13,.17], collage:[.878,.399,.105,.19],
    loreal:[.581,.568,.12,.14], kol:[.707,.56,.045,.14],
    monthlyEchoes:[.835,.655,.14,.17], hkuCompass:[.938,.71,.075,.17],
    halloweenBeauty:[.768,.715,.067,.127]
  };
  function mount(root) {
    dispose();
    if (!root) return;
    if (root.dataset.spatial === "true") {
      for (const [key,[x,y,w,h]] of Object.entries(positions)) {
        const el=root.querySelector(`[data-object="${key}"]`);
        if (!el) continue;
        const rearScale = 1;
        el.style.left=((.5+(x-.5)*rearScale)*100)+"%";
        el.style.top=((.5+(y-.5)*rearScale)*100)+"%";
        el.style.width=el.dataset.feedbackTarget ? `${w*rearScale*100}%` : `max(32px, ${w*100}%)`;
        el.style.height=el.dataset.feedbackTarget ? `${h*rearScale*100}%` : `max(32px, ${h*100}%)`;
      }
      bounce = key => {
        const target = root.querySelector(`[data-object="${key}"]`);
        if (target?.dataset.feedbackTarget) return;
        if (target && !reduced.matches) target.animate([
          {translate:"0 0"}, {translate:"0 -9px"}, {translate:"0 0"}
        ], {duration:450, easing:"cubic-bezier(.2,.8,.3,1)"});
      };
      dispose = () => { bounce = () => {}; };
      return;
    }
    const image = root.querySelector(".room-art");
    let alive = true, visible = true, frame = 0, gl, canvas, program, texture, buffer;
    let cropLocation, timeLocation, objectLocation, liftLocation;
    let pulseKey="", pulseAt=0;
    bounce=key=>{pulseKey=key;pulseAt=performance.now();};
    let crop = [1,1,0,0], lastFrame = 0, elapsed = 0, previous = 0;
    const shader = (type, text) => {
      const s = gl.createShader(type);
      gl.shaderSource(s,text); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) { gl.deleteShader(s); throw Error("Scene shader compilation failed"); }
      return s;
    };
    function setup() {
      canvas = document.createElement("canvas");
      canvas.className = "room-motion-canvas"; canvas.setAttribute("aria-hidden","true");
      gl = canvas.getContext("webgl",{alpha:false, antialias:false, depth:false, powerPreference:"low-power"});
      if (!gl) return false;
      const vert = shader(gl.VERTEX_SHADER, "attribute vec2 a; varying vec2 uv; void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}");
      const frag = shader(gl.FRAGMENT_SHADER, `
precision highp float;
varying vec2 uv;
uniform sampler2D photo;
uniform vec4 crop;
uniform float time;
uniform vec4 object;
uniform float lift;
float region(vec2 p, vec2 c, vec2 r) {
  float d=length((p-c)/r); return 1.-smoothstep(.15,1.,d);
}
void main() {
  vec2 p=vec2(uv.x,1.-uv.y)*crop.xy+crop.zw;
  vec2 shift=vec2(0.);
  // Curtain fabric anchored at top; no face distortion.
  float curtain=region(p,vec2(.635,.285),vec2(.028,.13));
  shift.x += .0022*sin(time*.62+p.y*7.)*curtain*smoothstep(.02,.24,p.y);
  // A slow, small reach toward the book shelf.
  float reach=region(p,vec2(.17,.182),vec2(.032,.055));
  float book=region(p,vec2(.164,.163),vec2(.022,.048));
  shift += vec2(.00165,-.0007)*sin(time*.85)*reach;
  shift.x += .0011*sin(time*.85)*book;
  // Fingertips pulse against keyboard; hand only.
  float typing=region(p,vec2(.501,.551),vec2(.033,.023));
  shift.y += .00095*(sin(time*9.)+.3*sin(time*14.))*typing;
  // A gentle wrist/scissor movement, with a quiet paper response.
  float cutting=region(p,vec2(.813,.507),vec2(.035,.03));
  shift += vec2(.0007*sin(time*2.7),.001*sin(time*2.7))*cutting;
  float paper=region(p,vec2(.907,.426),vec2(.028,.03));
  shift.y += .0007*sin(time*2.7+.4)*paper;
  // Lift the selected object within the same texture, with feathered boundaries.
  float objectMask=region(p,object.xy,object.zw*.65);
  shift.y += lift*objectMask;
  vec4 color=texture2D(photo,vec2(p.x+shift.x,1.-p.y-shift.y));
  float left=region(p,vec2(.275,.175),vec2(.125,.23));
  float right=region(p,vec2(.875,.20),vec2(.18,.27));
  float light=.009*sin(time*.38)*left+.006*sin(time*.31+1.4)*right;
  color.rgb += vec3(1.,.63,.27)*light;
  gl_FragColor=color;
}`);
      program=gl.createProgram(); gl.attachShader(program,vert); gl.attachShader(program,frag); gl.linkProgram(program);
      gl.deleteShader(vert); gl.deleteShader(frag);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error("Scene shader linking failed");
      gl.useProgram(program);
      cropLocation=gl.getUniformLocation(program,"crop"); timeLocation=gl.getUniformLocation(program,"time");
      objectLocation=gl.getUniformLocation(program,"object");liftLocation=gl.getUniformLocation(program,"lift");
      buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const attr=gl.getAttribLocation(program,"a"); gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
      texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      root.append(canvas);
      canvas.addEventListener("webglcontextlost", lost);
      root.dataset.motionReady="true";
      return true;
    }
    function resize() {
      const width=root.clientWidth, height=root.clientHeight;
      if (!width || !height) return;
      const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
      const sx=width/(image.naturalWidth*scale), sy=height/(image.naturalHeight*scale);
      crop=[sx,sy,(1-sx)/2,(1-sy)/2];
      for (const [key,[x,y,w,h]] of Object.entries(positions)) {
        const el=root.querySelector('[data-object="'+key+'"]');
        if (!el) continue;
        el.style.left=((x-crop[2])/sx*100)+"%"; el.style.top=((y-crop[3])/sy*100)+"%";
        el.style.width=Math.max(44,width*w/sx)+"px"; el.style.height=Math.max(44,height*h/sy)+"px";
      }
      if (gl && canvas) {
        const dpr=Math.min(devicePixelRatio || 1,2);
        canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
        gl.viewport(0,0,canvas.width,canvas.height);
        draw();
      }
    }
    function draw() {
      gl.uniform4fv(cropLocation,crop);
      gl.uniform1f(timeLocation,elapsed);
      const age=(performance.now()-pulseAt)/1000;
      const pulsing=pulseKey && age<.38;
      const key=pulsing?pulseKey:root.dataset.activeObject;
      const bounds=positions[key] || [0,0,.01,.01];
      gl.uniform4fv(objectLocation,bounds);
      const hover=key ? .003 : 0;
      const jump=pulsing?.023*Math.sin(Math.PI*Math.max(0,age)/.38):0;
      gl.uniform1f(liftLocation,reduced.matches?0:hover+jump);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    function render(now) {
      frame=0;
      if (!alive || !enabled || reduced.matches || document.hidden || !visible || !gl) return;
      if (now-lastFrame>=32) {
        elapsed += previous ? Math.min((now-previous)/1000,.1) : 0;
        previous=now; lastFrame=now;
        draw();
      }
      frame=requestAnimationFrame(render);
    }
    function update() {
      cancelAnimationFrame(frame); frame=0; previous=0;
      if (canvas) canvas.hidden=!(enabled && !reduced.matches && gl);
      if (alive && gl && enabled && !reduced.matches && !document.hidden && visible) frame=requestAnimationFrame(render);
    }
    function lost(event) { event.preventDefault(); cancelAnimationFrame(frame); gl=null; canvas.hidden=true; root.dataset.motionReady="false"; }
    function start() {
      if (!alive || !image.naturalWidth) return;
      try { setup(); } catch (error) { console.warn(error.message); gl=null; canvas?.remove(); }
      resize(); update();
    }
    const observer=new ResizeObserver(resize); observer.observe(root);
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}); intersection.observe(root);
    reduced.addEventListener("change",update);
    document.addEventListener("visibilitychange",update);
    if (image.complete) start(); else image.addEventListener("load",start,{once:true});
    dispose=()=>{
      alive=false; cancelAnimationFrame(frame);
      observer.disconnect(); intersection.disconnect();
      reduced.removeEventListener("change",update);
      document.removeEventListener("visibilitychange",update); image.removeEventListener("load",start);
      if (gl) { gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program); }
      canvas?.remove();
    };
  }
  window.RoomMotion={mount,bounce:key=>bounce(key), stop:()=>{dispose();dispose=()=>{};bounce=()=>{};}};
})();

/* Frame-synchronized rotation, independent from the page-turn gesture. */
(() => {
  let active=null, dispose=()=>{};
  const mount=()=>{
    const orbit=document.querySelector('.room-orbit');
    if(orbit===active)return;
    dispose(); active=orbit;
    if(!orbit)return;
    const scene=orbit.closest('.room-scene');
    const labels=[...orbit.querySelectorAll('.role-selector')];
    const media=matchMedia('(max-width: 820px)');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const layout=()=>{
      labels.forEach(label=>orbit.append(label));
      // Fit the complete rectangular cover artwork to its four board corners.
      // Clipping the original rectangle would cut off the lace border.
      orbit.querySelectorAll('[data-cover-corners]').forEach(art=>{
        const [tl,tr,br,bl]=art.dataset.coverCorners.split(',').map(n=>Number(n)/100);
        const w=art.clientWidth,h=art.parentElement.clientHeight;
        if(!w||!h)return;
        if(tl===tr && bl===br) {
          // A square cover is laid out at its actual size, so live type and
          // artwork share the entry cover's proportions without a Y squash.
          art.style.height=w+'px'; art.style.top=(tl*h)+'px';
          art.style.transform='none';
          return;
        }
        const g=(bl-tl)/(br-tr)-1,a=1+g,d=tr*a-tl,e=bl-tl;
        art.style.transform=`matrix3d(${a},${d*h/w},0,${g/w},0,${e},0,0,0,0,1,0,0,${tl*h},0,1)`;
      });
    };
    layout(); media.addEventListener('change',layout);
    const coverLayout=new ResizeObserver(layout); coverLayout.observe(scene);
    let yaw=0,pitch=0,targetYaw=0,targetPitch=0,gesture=null,moved=false,frame=0,last=0;
    const paint=()=>{
      orbit.style.setProperty('--room-yaw',yaw+'deg');
      orbit.style.setProperty('--room-pitch',pitch+'deg');

    };
    const tick=now=>{
      frame=0;
      const dt=last?Math.min(50,now-last):16.67; last=now;
      const blend=reduced.matches?1:1-Math.exp(-dt/(gesture?32:65));
      yaw+=(targetYaw-yaw)*blend; pitch+=(targetPitch-pitch)*blend;
      if(Math.abs(targetYaw-yaw)+Math.abs(targetPitch-pitch)<.015){yaw=targetYaw;pitch=targetPitch;last=0;paint();return;}
      paint();frame=requestAnimationFrame(tick);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(tick);};
    orbit.addEventListener('dragstart',e=>e.preventDefault());
    // The unrotated scene stays hittable when the book is edge-on or rear-facing.
    scene.addEventListener('pointerdown',e=>{
      if(gesture||e.target.closest('select,option')||(e.pointerType==='mouse'&&e.button!==0))return;
      if(e.target.closest('button,a')&&!orbit.contains(e.target))return;
      gesture={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch};moved=false;
      // Cancel native image drag without changing ordinary link/button clicks.
      if(!e.target.closest('button,a'))e.preventDefault();
      e.target.setPointerCapture?.(e.pointerId);e.stopPropagation();
    });
    scene.addEventListener('pointermove',e=>{
      if(!gesture||gesture.id!==e.pointerId)return;
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(!moved&&Math.hypot(dx,dy)<6)return;
      if(!moved){moved=true;scene.setPointerCapture(e.pointerId);orbit.dataset.rotating='true';}
      targetYaw=gesture.yaw+dx*.38;
      targetPitch=Math.max(-70,Math.min(70,gesture.pitch-dy*.28));
      schedule();e.preventDefault();e.stopPropagation();
    });
    const finish=e=>{
      if(gesture?.id!==e.pointerId)return;
      gesture=null;delete orbit.dataset.rotating;
      if(scene.hasPointerCapture(e.pointerId))scene.releasePointerCapture(e.pointerId);
      schedule();
    };
    scene.addEventListener('pointerup',finish);scene.addEventListener('pointercancel',finish);
    // A prop can open a dialog before its captured pointer is released.
    // Finish globally too, so removing that prop cannot leave a live drag.
    window.addEventListener('pointerup',finish,true);
    window.addEventListener('pointercancel',finish,true);
    scene.addEventListener('lostpointercapture',e=>{if(gesture&&e.target===scene)finish(e);});
    scene.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false;}},true);
    orbit.addEventListener('keydown',e=>{
      if(e.target!==orbit)return;
      if(!['Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      if(gesture) {
        const id=gesture.id; gesture=null; delete orbit.dataset.rotating;
        if(scene.hasPointerCapture(id))scene.releasePointerCapture(id);
      }
      if(e.key==='Home'){targetYaw=Math.round(targetYaw/360)*360;targetPitch=0;}
      else if(e.key==='ArrowLeft')targetYaw-=20;
      else if(e.key==='ArrowRight')targetYaw+=20;
      else if(e.key==='ArrowUp')targetPitch=Math.min(70,targetPitch+15);
      else if(e.key==='ArrowDown')targetPitch=Math.max(-70,targetPitch-15);
      else return;
      e.preventDefault();e.stopPropagation();schedule();
    });
    orbit.addEventListener('dblclick',e=>{if(e.target.closest('button,a'))return;targetYaw=Math.round(targetYaw/360)*360;targetPitch=0;schedule();});
    dispose=()=>{cancelAnimationFrame(frame);coverLayout.disconnect();media.removeEventListener('change',layout);window.removeEventListener('pointerup',finish,true);window.removeEventListener('pointercancel',finish,true);};
  };
  new MutationObserver(mount).observe(document.querySelector('#book-content'),{childList:true});mount();
})();
