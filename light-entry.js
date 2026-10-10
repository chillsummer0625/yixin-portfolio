/* Original warm window-light study; no React Bits source or dependencies. */
(() => {
  let dispose = () => {};
  function mount(root) {
    dispose();
    if (!root) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'entry-light';
    canvas.setAttribute('aria-hidden', 'true');
    root.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const control = root.querySelector('.entry-motion');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const zh = document.documentElement.lang.startsWith('zh');
    let enabled = localStorage.getItem('yixin-entry-motion') !== 'off';
    let alive = true, visible = true, frame = 0, time = 0, previous = 0, last = 0;
    // Stable botanical geometry, composed from the upper right to leave the book clear.
    const branches = Array.from({length: 5}, (_, i) => ({
      x: .96 - i * .085, y: -.13 + i * .045,
      angle: .8 + i * .18, length: .46 + i * .025, phase: i * 1.73
    }));
    function paint() {
      const w=canvas.width, h=canvas.height, u=Math.min(w,h);
      ctx.clearRect(0,0,w,h);
      ctx.save();
      // A softly bounded window projection with warm, slowly breathing brightness.
      ctx.translate(w*.57,h*.02);
      ctx.rotate(-.22);
      const glow=ctx.createLinearGradient(0,0,0,h*1.1);
      glow.addColorStop(0,'rgba(255,215,155,.40)');
      glow.addColorStop(.45,'rgba(237,169,92,.21)');
      glow.addColorStop(1,'rgba(171,94,42,0)');
      ctx.fillStyle=glow;
      ctx.globalAlpha=.9+.08*Math.sin(time*.19);
      ctx.filter='blur(20px)';
      ctx.beginPath(); ctx.moveTo(-u*.12,-h*.2); ctx.lineTo(u*.40,-h*.2);
      ctx.lineTo(u*.68,h*1.05); ctx.lineTo(-u*.54,h*1.05); ctx.closePath(); ctx.fill();
      // Window mullions cut two quiet bands through the light.
      ctx.globalCompositeOperation='destination-out';
      ctx.fillStyle='rgba(0,0,0,.55)'; ctx.filter='blur(9px)';
      ctx.fillRect(-u*.024,-h*.2,u*.027,h*1.2);
      ctx.fillRect(-u*.4,h*.30,u*1.15,u*.027);
      ctx.restore();
      // Leaf silhouettes gently obscure the light, rather than draw a plant on top.
      ctx.save(); ctx.globalCompositeOperation='destination-out';
      ctx.fillStyle='rgba(0,0,0,.64)'; ctx.strokeStyle='rgba(0,0,0,.48)';
      ctx.filter='blur(6px)'; ctx.lineWidth=u*.006;
      for (const b of branches) {
        ctx.save(); ctx.translate(w*b.x,h*b.y);
        ctx.rotate(b.angle+.025*Math.sin(time*.34+b.phase));
        const length=h*b.length;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-u*.06,length*.55,0,length); ctx.stroke();
        for(let j=1;j<8;j++) {
          const y=length*j/8, side=j%2?1:-1;
          ctx.save(); ctx.translate(-u*.025*Math.sin(j*.5),y);
          ctx.rotate(side*.64+.025*Math.sin(time*.45+b.phase+j));
          ctx.beginPath(); ctx.ellipse(side*u*.022,0,u*.034,u*.065,0,0,Math.PI*2); ctx.fill(); ctx.restore();
        }
        ctx.restore();
      }
      ctx.restore();
      // A very sparse dust glint within the shaft.
      ctx.save();ctx.fillStyle='#f1cf9c';
      for(let i=0;i<15;i++) {
        const x=w*(.36+((i*.137)% .37)), y=h*((i*.173+time*.003)%1);
        ctx.globalAlpha=.10+.07*Math.sin(time*.5+i);
        ctx.beginPath();ctx.arc(x,y,.7,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
    function resize() {
      canvas.width=Math.max(1,Math.round(root.clientWidth*.8));
      canvas.height=Math.max(1,Math.round(root.clientHeight*.8));
      paint();
    }
    function tick(now) {
      frame=0;
      if(!alive||!visible||!enabled||reduced.matches||document.hidden)return;
      if(now-last>40) {time+=previous?Math.min((now-previous)/1000,.1):0;previous=now;last=now;paint();}
      frame=requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);previous=0;
      const active=enabled&&!reduced.matches;
      root.dataset.lightMotion=String(active);
      control.textContent=active?'Ⅱ':'▷';
      control.setAttribute('aria-pressed',String(active));
      control.setAttribute('aria-label',zh?(active?'暂停光影':'播放光影'):(active?'Pause light animation':'Play light animation'));
      control.disabled=reduced.matches;
      paint();
      if(alive&&active&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
    }
    function toggle(){enabled=!enabled;localStorage.setItem('yixin-entry-motion',enabled?'on':'off');update();}
    control.addEventListener('click',toggle);
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);
    const visibilityObserver=new IntersectionObserver(e=>{visible=e[0].isIntersecting;update();});visibilityObserver.observe(root);
    document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
    resize();update();
    dispose=()=>{alive=false;cancelAnimationFrame(frame);resizeObserver.disconnect();visibilityObserver.disconnect();control.removeEventListener('click',toggle);document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);canvas.remove();};
  }
  window.LightEntry={mount,stop:()=>{dispose();dispose=()=>{};}};
})();
