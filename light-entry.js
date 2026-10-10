/* Black-stage book entrance, user-controlled recall and free rotation. */
(() => {
  let dispose = () => {};
  function mount(root) {
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
      if(reduced.matches){stopShowcase();returning=false;opening=roll=0;orient();}
      if(alive&&!reduced.matches&&visible&&!document.hidden&&(showcase||returning))frame=requestAnimationFrame(tick);
    }
    const visibilityObserver=new IntersectionObserver(e=>{visible=e[0].isIntersecting;update();});visibilityObserver.observe(root);
    document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
    const bookButton=root.querySelector('.cover-book');
    const volume=root.querySelector('.book-volume');
    let yaw=40, pitch=-16, tiltX=0, tiltY=0;
    let showcase=true, showcaseTime=0, showcaseLast=0, opening=0, roll=0;
    let returning=false, returnTime=0, returnPose=null;
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
      const dt=showcaseLast?Math.min((now-showcaseLast)/1000,.08):0;
      showcaseLast=now;
      if(returning){
        returnTime+=dt;
        const p=smooth(returnTime/.95);
        opening=returnPose.opening+(returnPose.targetOpening-returnPose.opening)*p;roll=returnPose.roll+(returnPose.targetRoll-returnPose.roll)*p;
        yaw=returnPose.yaw+(returnPose.targetYaw-returnPose.yaw)*p;
        pitch=returnPose.pitch+(returnPose.targetPitch-returnPose.pitch)*p;
        if(p===1){returning=false;root.dataset.bookAnimation=returnPose.targetOpening?'far':'near';}
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
    function travel(far) {
      stopShowcase();tiltX=tiltY=0;
      const base=40+360*Math.round((yaw-40)/360);
      returnPose={opening,roll,yaw,pitch,targetOpening:far?1:0,targetRoll:far?-5:0,targetYaw:base+(far?35:0),targetPitch:-16};
      returnTime=0;returning=true;root.dataset.bookAnimation=far?'retreating':'returning';
      if(reduced.matches){opening=returnPose.targetOpening;roll=returnPose.targetRoll;yaw=returnPose.targetYaw;pitch=-16;returning=false;root.dataset.bookAnimation=far?'far':'near';orient();}
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
      if(root.dataset.bookSide==='front'){e.preventDefault();e.stopImmediatePropagation();front.click();}
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
    orient();update();
    dispose=()=>{root.removeEventListener('click',backgroundClick);alive=false;cancelAnimationFrame(frame);visibilityObserver.disconnect();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);bookButton.removeEventListener('pointerdown',down);bookButton.removeEventListener('pointermove',move);bookButton.removeEventListener('pointerup',up);bookButton.removeEventListener('pointerleave',leave);bookButton.removeEventListener('pointercancel',up);bookButton.removeEventListener('click',click,true);bookButton.removeEventListener('keydown',key);};
  }
  window.LightEntry={mount,stop:()=>{dispose();dispose=()=>{};}};
})();
