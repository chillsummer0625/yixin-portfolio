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
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const enabled = true;
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
      glow.addColorStop(0,'rgba(255,215,155,.12)');
      glow.addColorStop(.45,'rgba(237,169,92,.045)');
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
      animateBook(now);
      frame=requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);previous=0;showcaseLast=0;
      const active=enabled&&!reduced.matches;
      root.dataset.lightMotion=String(active);
      paint();
      if(reduced.matches && typeof volume!=='undefined'){stopShowcase();yaw=40;pitch=-16;orient();}
      if(alive&&active&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
    }
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);
    const visibilityObserver=new IntersectionObserver(e=>{visible=e[0].isIntersecting;update();});visibilityObserver.observe(root);
    document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
    const bookButton=root.querySelector('.cover-book');
    const volume=root.querySelector('.book-volume');
    let yaw=40, pitch=-16, tiltX=0, tiltY=0;
    let showcase=true, showcaseTime=0, showcaseLast=0, opening=0, roll=0;
    const front=volume.querySelector('.book-face--front');
    const leaves=[...volume.querySelectorAll('.book-leaf')];
    let pointer=null, startX=0, startY=0, startYaw=0, startPitch=0, dragged=false, suppressClick=false;
    function orient() {
      volume.style.transform=`translateX(${-opening*18}%) rotateY(${yaw+tiltY}deg) rotateX(${pitch-opening*32+tiltX}deg) rotateZ(${roll}deg) scale3d(${1-opening*.62},${1-opening*.62},${1-opening*.62})`;
      front.style.transform=`translateZ(calc(var(--book-depth) / 2)) rotateY(${-24-opening*132}deg)`;
      leaves.forEach((leaf,i)=>{
        const angle=-(4+i*5)*(1-opening) + (-26-i*31)*opening;
        const flutter=opening*Math.sin(showcaseTime*2-i*.85)*4;
        leaf.style.transform=`translateZ(calc(var(--book-depth) / 2 - var(--leaf-offset))) rotateY(${angle+flutter}deg)`;
      });
      volume.dataset.yaw=String(yaw);volume.dataset.pitch=String(pitch);
      const backVisible=Math.cos(yaw*Math.PI/180)*Math.cos(pitch*Math.PI/180)<0;
      root.dataset.bookSide=backVisible?'back':'front';
      volume.querySelector('.book-face--back').inert=!backVisible;
      volume.querySelector('.book-face--front').inert=backVisible;
      bookButton.style.setProperty('--shadow-scale', String(.25+.75*Math.abs(Math.cos(yaw*Math.PI/180))));
    }
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    function animateBook(now) {
      if(!showcase){showcaseLast=0;return;}
      showcaseTime+=showcaseLast?Math.min((now-showcaseLast)/1000,.08):0;showcaseLast=now;
      const t=showcaseTime%12;
      if(t<3){opening=0;yaw=40+360*smooth(t/3);roll=Math.sin(t/3*Math.PI*2)*9;}
      else if(t<5){const p=smooth((t-3)/2);opening=p;yaw=400+35*p;roll=-5*p;}
      else if(t<8){opening=1;yaw=435+Math.sin((t-5)*.8)*5;roll=-5+Math.sin((t-5)*.8)*2;}
      else if(t<10){const p=smooth((t-8)/2);opening=1-p;yaw=435-35*p;roll=-5*(1-p);}
      else {opening=0;yaw=400;roll=0;}
      root.dataset.bookAnimation=opening>.05?'fanning':'rotating';orient();
    }
    function stopShowcase() {
      showcase=false;showcaseLast=0;opening=roll=0;
      root.dataset.bookAnimation='manual';
    }
    function down(e) {
      if(pointer!==null || e.target.closest('a') || (e.pointerType==='mouse' && e.button!==0))return;
      stopShowcase();
      pointer=e.pointerId;startX=e.clientX;startY=e.clientY;startYaw=yaw;startPitch=pitch;
      dragged=false;suppressClick=false;tiltX=tiltY=0;
      bookButton.setPointerCapture(pointer);bookButton.classList.add('is-rotating');
    }
    function move(e) {
      if(pointer===null) {
        if(showcase || e.pointerType!=='mouse' || reduced.matches)return;
        const rect=bookButton.getBoundingClientRect();
        const x=(e.clientX-rect.left)/rect.width, y=(e.clientY-rect.top)/rect.height;
        tiltX=(.5-y)*5;tiltY=(x-.5)*5;
        bookButton.style.setProperty('--sheen-x', `${x*100}%`);
        bookButton.style.setProperty('--sheen-y', `${y*100}%`);orient();return;
      }
      if(e.pointerId!==pointer)return;
      const dx=e.clientX-startX;
      if(Math.hypot(dx,e.clientY-startY)>6)dragged=true;
      if(!dragged)return;
      yaw=startYaw+dx*.65;pitch=Math.max(-110,Math.min(110,startPitch-(e.clientY-startY)*.55));orient();
    }
    function leave(){if(pointer===null){tiltX=tiltY=0;orient();}}
    function up(e) {
      if(e.pointerId!==pointer)return;
      suppressClick=dragged || e.type==='pointercancel';pointer=null;
      bookButton.classList.remove('is-rotating');
      if(bookButton.hasPointerCapture(e.pointerId))bookButton.releasePointerCapture(e.pointerId);
      // Keep the exact released pose; there is no front/back snap.
    }
    function prepareOpen(){stopShowcase();yaw=40;pitch=-16;tiltX=tiltY=0;orient();}
    function click(e) {
      if(e.target.closest('a'))return;
      if(suppressClick && e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;return;}
      if(e.target.closest('.book-face--front')){prepareOpen();return;}
      if(root.dataset.bookSide==='front'){e.preventDefault();e.stopImmediatePropagation();front.click();}
    }
    function key(e) {
      if(e.target.closest('a'))return;
      if(e.key==='Enter' || e.key===' ') {
        e.preventDefault();e.stopPropagation();prepareOpen();front.click();return;
      }
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();stopShowcase();
      if(e.key==='ArrowLeft')yaw-=15;
      if(e.key==='ArrowRight')yaw+=15;
      if(e.key==='ArrowUp')pitch=Math.max(-110,pitch-15);
      if(e.key==='ArrowDown')pitch=Math.min(110,pitch+15);
      orient();
    }
    function focus(){if(showcase){stopShowcase();orient();}}
    bookButton.addEventListener('focusin',focus);
    bookButton.addEventListener('pointerdown',down);
    bookButton.addEventListener('pointermove',move);
    bookButton.addEventListener('pointerup',up);
    bookButton.addEventListener('pointerleave',leave);
    bookButton.addEventListener('pointercancel',up);
    bookButton.addEventListener('click',click,true);
    bookButton.addEventListener('keydown',key);
    orient();resize();update();
    dispose=()=>{alive=false;cancelAnimationFrame(frame);resizeObserver.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);canvas.remove();bookButton.removeEventListener('focusin',focus);bookButton.removeEventListener('pointerdown',down);bookButton.removeEventListener('pointermove',move);bookButton.removeEventListener('pointerup',up);bookButton.removeEventListener('pointerleave',leave);bookButton.removeEventListener('pointercancel',up);bookButton.removeEventListener('click',click,true);bookButton.removeEventListener('keydown',key);};
  }
  window.LightEntry={mount,stop:()=>{dispose();dispose=()=>{};}};
})();
