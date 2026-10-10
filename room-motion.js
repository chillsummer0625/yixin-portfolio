/* Seam-free local motion: one texture, smooth displacement, no duplicated limbs. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let dispose = () => {};
  let bounce = () => {};
  const enabled = true;
  const positions = {
    crete:[.095,.515,.075,.12], hku:[.44,.235,.10,.17],
    campus:[.213,.375,.11,.15], nuaa:[.18,.495,.09,.10],
    awards:[.115,.68,.08,.15], sumec:[.28,.765,.21,.22],
    chinaDaily:[.456,.75,.18,.18], broadcast:[.65,.665,.09,.09],
    eastern:[.664,.824,.16,.16], collage:[.911,.333,.12,.19],
    loreal:[.439,.627,.11,.10], kol:[.585,.615,.07,.13],
    monthlyEchoes:[.803,.805,.16,.18], hkuCompass:[.943,.845,.105,.19]
  };
  function mount(root) {
    dispose();
    if (!root) return;
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
  float curtain=region(p,vec2(.753,.205),vec2(.056,.23));
  shift.x += .0022*sin(time*.62+p.y*7.)*curtain*smoothstep(.02,.24,p.y);
  // A slow, small reach toward the book shelf.
  float reach=region(p,vec2(.204,.165),vec2(.052,.098));
  float book=region(p,vec2(.197,.105),vec2(.032,.055));
  shift += vec2(.00165,-.0007)*sin(time*.85)*reach;
  shift.x += .0011*sin(time*.85)*book;
  // Fingertips pulse against keyboard; hand only.
  float typing=region(p,vec2(.576,.555),vec2(.046,.029));
  shift.y += .00095*(sin(time*9.)+.3*sin(time*14.))*typing;
  // A gentle wrist/scissor movement, with a quiet paper response.
  float cutting=region(p,vec2(.826,.528),vec2(.043,.054));
  shift += vec2(.0007*sin(time*2.7),.001*sin(time*2.7))*cutting;
  float paper=region(p,vec2(.914,.354),vec2(.035,.045));
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
