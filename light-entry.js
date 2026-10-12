/* Black-stage book entrance, user-controlled recall and free rotation. */
(() => {
  let dispose = () => {};
  let recenter = () => {};
  let retreat = () => Promise.resolve();
  function installWand() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    // The star tip is the exact hit point, including during book rotation.
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const wand = document.createElement('div');
    wand.className = 'entry-wand';
    wand.setAttribute('aria-hidden', 'true');
    wand.innerHTML = `<svg viewBox="0 0 52 60" fill="none"><path d="M13 17L42 51" stroke="#241d35" stroke-width="5" stroke-linecap="round"/><path d="M13 17L42 51" stroke="#cfbce9" stroke-width="2.5" stroke-linecap="round"/><path d="M34 42L42 51" stroke="#ffe4aa" stroke-width="3" stroke-linecap="round"/><path d="M12 2L14.8 8.2L21.5 9L16.6 13.6L17.8 20.3L12 17L6.2 20.3L7.4 13.6L2.5 9L9.2 8.2Z" fill="#fff4cf" stroke="#d3b5ef" stroke-width="1.2"/><path d="M12 6L13 10L17 11L13 12L12 16L11 12L7 11L11 10Z" fill="white"/></svg>`;
    wand.setAttribute('popover', 'manual');
    document.body.append(wand);
    let wandHost = null;
    let lastSpark = 0;
    const sparks = new Set();
    function hideWand() {
      wand.classList.remove('is-visible');
      if(wand.matches(':popover-open')) wand.hidePopover();
      document.body.classList.remove('has-magic-wand');
      sparks.forEach(spark => spark.remove());
      sparks.clear();
    }
    function followWand(event) {
      if(event.pointerType !== 'mouse' || !finePointer.matches || document.hidden) { hideWand(); return; }
      document.body.classList.add('has-magic-wand');
      const host = event.target.closest('dialog[open], .language-menu:popover-open');
      if(!wand.matches(':popover-open') || host !== wandHost) {
        if(wand.matches(':popover-open')) wand.hidePopover();
        wand.showPopover();
        wandHost = host;
      }
      wand.classList.add('is-visible');
      wand.style.transform = `translate3d(${event.clientX - 12}px,${event.clientY - 11}px,0)`;
      const now = performance.now();
      if(reduced.matches || now - lastSpark < 65 || sparks.size >= 12) return;
      lastSpark = now;
      const spark = document.createElement('span');
      spark.className = 'entry-wand-spark';
      spark.setAttribute('aria-hidden', 'true');
      spark.style.left = `${event.clientX}px`;
      spark.style.top = `${event.clientY}px`;
      spark.style.setProperty('--spark-x', `${(Math.random() - .5) * 26}px`);
      spark.style.setProperty('--spark-y', `${12 + Math.random() * 22}px`);
      spark.style.setProperty('--spark-color', ['#d7b9ff','#9ee9df','#ffe3a3'][Math.floor(Math.random() * 3)]);
      sparks.add(spark);
      document.body.append(spark);
      spark.addEventListener('animationend', () => { spark.remove(); sparks.delete(spark); }, {once:true});
    }
    // Rotation handlers stop bubbling, so track the physical pointer in capture.
    document.addEventListener('pointermove', followWand, {passive:true, capture:true});
    document.documentElement.addEventListener('pointerleave', hideWand);
    document.addEventListener('visibilitychange', hideWand);
    window.addEventListener('blur', hideWand);
    finePointer.addEventListener('change', hideWand);
    reduced.addEventListener('change', hideWand);
  }
  installWand();
  function mount(root, {closing=false, far=false} = {}) {
    dispose();
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    let alive=true, visible=true, frame=0;
    function tick(now) {
      frame=0;
      if(!alive||!visible||reduced.matches||document.hidden)return;
      animateBook(now);
      if(showcase || returning)frame=requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);showcaseLast=0;
      if(reduced.matches){
        stopShowcase();
        if(returning){opening=returnPose.targetOpening;roll=returnPose.targetRoll;yaw=returnPose.targetYaw;pitch=returnPose.targetPitch;root.dataset.bookAnimation=opening?'far':'near';}
        else opening=roll=0;
        returning=false;orient();returnDone();returnDone=()=>{};
      }
      if(alive&&!reduced.matches&&visible&&!document.hidden&&(showcase||returning))frame=requestAnimationFrame(tick);
    }
    const visibilityObserver=new IntersectionObserver(e=>{visible=e[0].isIntersecting;update();});visibilityObserver.observe(root);
    document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
    const bookButton=root.querySelector('.cover-book');
    if(closing || far)bookButton.style.animation='none';
    const volume=root.querySelector('.book-volume');
    let yaw=far?75:40, pitch=-16, tiltX=0, tiltY=0;
    let showcase=!closing&&!far, showcaseTime=0, showcaseLast=0, opening=far?1:0, roll=far?-5:0;
    let returning=false, returnTime=0, returnPose=null;
    let returnDuration=.95, returnDone=()=>{};
    const front=volume.querySelector('.book-face--front');
    const leaves=[...volume.querySelectorAll('.book-leaf')];
    let pointer=null, startX=0, startY=0, startYaw=0, startPitch=0, dragged=false, suppressClick=false;
    let geometry = null;
    const frontOutside = front.querySelector('.book-front-outside');
    const frontInside = front.querySelector('.book-front-inside');
    const backOutside = volume.querySelector('.book-back-outside');
    const backInside = volume.querySelector('.book-back-inside');
    function measure() {
      const style = getComputedStyle(bookButton);
      const frontMatrix = new DOMMatrix(getComputedStyle(front).transform);
      geometry = { width:bookButton.clientWidth, height:bookButton.clientHeight,
        x:bookButton.offsetLeft, y:bookButton.offsetTop,
        stageWidth:root.clientWidth, stageHeight:root.clientHeight,
        depth:frontMatrix.m43*2, perspective:parseFloat(style.perspective) || 1500 };
    }
    function orient() {
      const ry=yaw+tiltY, rx=pitch-opening*32+tiltX, scale=1-opening*.62;
      const coverAngle=-24-opening*132;
      const angles=leaves.map((leaf,i)=>coverAngle*(i+1)/(leaves.length+1)+opening*Math.sin(showcaseTime*2-i*.85)*4);
      volume.style.transform=`rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${roll}deg) scale3d(${scale},${scale},${scale})`;
      front.style.transform=`translateZ(calc(var(--book-depth) / 2)) rotateY(${coverAngle}deg)`;
      leaves.forEach((leaf,i)=>{leaf.style.transform=`translateZ(calc(var(--book-depth) / 2 - var(--leaf-offset))) rotateY(${angles[i]}deg)`;});
      volume.dataset.yaw=String(yaw);volume.dataset.pitch=String(pitch);
      const rotation=new DOMMatrix().rotateAxisAngle(0,1,0,ry).rotateAxisAngle(1,0,0,rx).rotateAxisAngle(0,0,1,roll);
      const facing=angle=>rotation.multiply(new DOMMatrix().rotateAxisAngle(0,1,0,angle)).transformPoint(new DOMPoint(0,0,1,0)).z>=0;
      // Explicit culling also protects against browser compositor backface glitches.
      const frontVisible=facing(coverAngle), backVisible=facing(180);
      if(frontOutside)frontOutside.style.visibility=frontVisible?'visible':'hidden';
      frontInside.style.visibility=frontVisible?'hidden':'visible';
      backOutside.style.visibility=backVisible?'visible':'hidden';
      backInside.style.visibility=backVisible?'hidden':'visible';
      leaves.forEach((leaf,i)=>{
        const visible=facing(angles[i]);
        leaf.querySelector('.book-leaf__front').style.visibility=visible?'visible':'hidden';
        leaf.querySelector('.book-leaf__back').style.visibility=visible?'hidden':'visible';
      });
      root.dataset.bookSide=backVisible?'back':'front';
      volume.querySelectorAll('.book-face--back a').forEach(link=>{link.inert=!backVisible;});
      if(root.closest('.entry-closing') || !geometry)return;
      // Project cached local corners instead of resetting transforms and forcing
      // a layout flush for every animation frame and pointer move.
      const g=geometry, points=[];
      const addFace=(angle,z)=>{
        const local=new DOMMatrix().translate(0,g.height/2,z).rotateAxisAngle(0,1,0,angle).translate(0,-g.height/2,0);
        for(const x of [0,g.width])for(const y of [0,g.height]){
          const p=local.transformPoint(new DOMPoint(x,y,0));
          const q=rotation.transformPoint(new DOMPoint((p.x-g.width/2)*scale,(p.y-g.height/2)*scale,p.z*scale));
          const depth=g.perspective/(g.perspective-q.z);
          points.push({x:q.x*depth,y:q.y*depth});
        }
      };
      addFace(coverAngle,g.depth/2); addFace(0,-g.depth/2);
      angles.forEach((angle,i)=>addFace(angle,g.depth/2-g.depth*(leaves.length-i)/(leaves.length+1)));
      const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x));
      const top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
      const dx=g.stageWidth/2-(g.x+g.width/2+(left+right)/2);
      const dy=g.stageHeight/2-(g.y+g.height/2+(top+bottom)/2);
      bookButton.style.transform=`translate(${dx}px,${dy}px)`;
      root.style.setProperty('--ground-top',`${g.stageHeight/2+(bottom-top)/2+30}px`);
      root.style.setProperty('--ground-width',`${Math.max(90,Math.min(420,(right-left)*.85))}px`);
    }
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    function animateBook(now) {
      const dt=showcaseLast?Math.min((now-showcaseLast)/1000,.08):0;
      showcaseLast=now;
      if(returning){
        returnTime+=dt;
        const p=smooth(returnTime/returnDuration);
        opening=returnPose.opening+(returnPose.targetOpening-returnPose.opening)*p;roll=returnPose.roll+(returnPose.targetRoll-returnPose.roll)*p;
        yaw=returnPose.yaw+(returnPose.targetYaw-returnPose.yaw)*p;
        pitch=returnPose.pitch+(returnPose.targetPitch-returnPose.pitch)*p;
        if(p===1){returning=false;root.dataset.bookAnimation=returnPose.targetOpening?'far':'near';returnDone();returnDone=()=>{};}
        orient();return;
      }
      if(!showcase)return;
      showcaseTime+=dt;
      const t=showcaseTime;
      if(t<3){opening=0;yaw=40+360*smooth(t/3);roll=Math.sin(t/3*Math.PI*2)*9;}
      else {const p=smooth((t-3)/2);opening=p;yaw=400+35*p;roll=-5*p;}
      if(t>=5){showcase=false;root.dataset.bookAnimation='far';}
      else root.dataset.bookAnimation='intro';
      orient();
    }
    function stopShowcase() {
      showcase=false;showcaseLast=0;
      root.dataset.bookAnimation=opening>.01?'far':'near';
    }
    function travel(far, duration=.95, done=()=>{}) {
      returnDone(); returnDone=done; returnDuration=duration;
      stopShowcase();tiltX=tiltY=0;
      const base=40+360*Math.round((yaw-40)/360);
      returnPose={opening,roll,yaw,pitch,targetOpening:far?1:0,targetRoll:far?-5:0,targetYaw:base+(far?35:0),targetPitch:-16};
      returnTime=0;returning=true;root.dataset.bookAnimation=far?'retreating':'returning';
      if(reduced.matches){opening=returnPose.targetOpening;roll=returnPose.targetRoll;yaw=returnPose.targetYaw;pitch=-16;returning=false;root.dataset.bookAnimation=far?'far':'near';orient();returnDone();returnDone=()=>{};}
      else update();
    }
    function recall(){travel(false);}
    function backgroundClick(e) {
      // Only the empty stage is a retreat control; links and the book remain independent.
      if(e.target.closest('.cover-book,a,button') || returning || pointer!==null)return;
      if(opening<.99)travel(true);
    }
    function down(e) {
      if(returning || pointer!==null || e.target.closest('a') || (e.pointerType==='mouse' && e.button!==0))return;
      stopShowcase();
      pointer=e.pointerId;startX=e.clientX;startY=e.clientY;startYaw=yaw;startPitch=pitch;
      dragged=false;suppressClick=false;tiltX=tiltY=0;
      // Capture only after movement crosses the drag threshold, so a plain
      // click keeps its original book-face target and can open the portfolio.
      bookButton.classList.add('is-rotating');
    }
    function move(e) {
      if(pointer===null) {
        if(showcase || returning || opening>.01 || e.pointerType!=='mouse' || reduced.matches)return;
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
      if(!bookButton.hasPointerCapture(pointer))bookButton.setPointerCapture(pointer);
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
    function prepareOpen(){stopShowcase();opening=roll=0;yaw=40;pitch=-16;tiltX=tiltY=0;orient();}
    function click(e) {
      if(e.target.closest('a'))return;
      if(suppressClick && e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;return;}
      if((e.target===bookButton || e.target===volume) && !suppressClick){e.preventDefault();e.stopImmediatePropagation();if(!returning && opening<.99)travel(true);return;}
      if(returning || opening>.01){e.preventDefault();e.stopImmediatePropagation();if(!returning)recall();return;}
      if(e.target.closest('.book-face--front')){prepareOpen();return;}
      // Every physical book surface opens the contents after the recall finishes.
      e.preventDefault();e.stopImmediatePropagation();prepareOpen();front.click();
    }
    function key(e) {
      if(e.target.closest('a'))return;
      if(e.key==='Enter' || e.key===' ') {
        e.preventDefault();e.stopPropagation();if(returning)return;if(opening>.01){recall();return;}prepareOpen();front.click();return;
      }
      if(returning)return;
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();stopShowcase();
      if(e.key==='ArrowLeft')yaw-=15;
      if(e.key==='ArrowRight')yaw+=15;
      if(e.key==='ArrowUp')pitch=Math.max(-110,pitch-15);
      if(e.key==='ArrowDown')pitch=Math.min(110,pitch+15);
      orient();
    }
    root.addEventListener('click',backgroundClick);
    bookButton.addEventListener('pointerdown',down);
    bookButton.addEventListener('pointermove',move);
    bookButton.addEventListener('pointerup',up);
    bookButton.addEventListener('pointerleave',leave);
    bookButton.addEventListener('pointercancel',up);
    bookButton.addEventListener('click',click,true);
    bookButton.addEventListener('keydown',key);
    const layoutObserver=new ResizeObserver(()=>{measure();orient();});layoutObserver.observe(root);
    recenter=orient;
    retreat=(duration=1500)=>new Promise(resolve=>travel(true,duration/1000,resolve));
    if(far)root.dataset.bookAnimation='far';
    measure();orient();update();
    dispose=()=>{layoutObserver.disconnect();root.removeEventListener('click',backgroundClick);alive=false;cancelAnimationFrame(frame);visibilityObserver.disconnect();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);bookButton.removeEventListener('pointerdown',down);bookButton.removeEventListener('pointermove',move);bookButton.removeEventListener('pointerup',up);bookButton.removeEventListener('pointerleave',leave);bookButton.removeEventListener('pointercancel',up);bookButton.removeEventListener('click',click,true);bookButton.removeEventListener('keydown',key);};
  }
  window.LightEntry={mount,center:()=>recenter(),retreat:duration=>retreat(duration),stop:()=>{dispose();dispose=()=>{};retreat=()=>Promise.resolve();}};
})();
