/* A center-bound spread with independent wings; the projection stays on the stage. */
(() => {
  let dispose = () => {};
  let retreat = () => Promise.resolve();
  function mount(root) {
    dispose();
    if (!root) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const book = root.closest('.book');
    const distanceStage = document.createElement('div');
    distanceStage.className = 'closing-distance';
    root.before(distanceStage); distanceStage.append(root);
    const ground = root.closest('.closing-page').querySelector('.closing-ground');
    if (ground) distanceStage.append(ground);
    let far = false, travelling = false, distanceAnimation = null;
    async function travel(toFar) {
      if (travelling || far === toFar) return;
      travelling = true;
      const target = toFar ? 'scale3d(.38,.38,.38)' : 'scale3d(1,1,1)';
      root.dataset.bookAnimation = toFar ? 'retreating' : 'returning';
      book.classList.toggle('is-closing-distant', toFar);
      root.querySelectorAll('.closing-panel a,.closing-panel button').forEach(action => { action.inert = true; });
      const animation = distanceStage.animate([
        {transform: distanceStage.style.transform || 'scale3d(1,1,1)'},
        {transform: target}
      ], {duration: reduced.matches ? 0 : 1400,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});
      distanceAnimation = animation;
      await animation.finished.catch(() => {});
      distanceStage.style.transform = target;
      animation.cancel(); distanceAnimation = null;
      far = toFar; travelling = false;
      root.dataset.bookAnimation = far ? 'far' : 'near';
      book.classList.toggle('is-closing-distant',far);
      schedule();
    }
    retreat = () => travel(true);
    distanceStage.addEventListener('click', event => {
      if (!far && !travelling) return;
      event.preventDefault(); event.stopPropagation();
      if (!travelling) void travel(false);
    }, { ...options, capture: true });
    const interactionStage = root.closest('.closing-page');
    const fronts = [...root.querySelectorAll('.closing-panel')];
    const mobile = matchMedia('(max-width:820px)');
    const reduced = matchMedia('(prefers-reduced-motion:reduce)');
    let yaw = -6, pitch = 10, pointer = null, dragged = false, suppressClick = false;
    let targetYaw = yaw, targetPitch = pitch;
    let paintedFit = null, paintedX = 0, paintedY = 0, lastTime = 0;
    let originX = 0, originY = 0, originYaw = 0, originPitch = 0;
    let frame = 0, geometry = null;
    // Cache the book's local corners. Rotation must not alternate DOM writes
    // and synchronous layout reads for every pointer event.
    function measure() {
      if (mobile.matches) { geometry = null; return; }
      const stage = root.closest('.closing-page');
      const stageStyle = getComputedStyle(stage);
      const [perspectiveX,perspectiveY] = stageStyle.perspectiveOrigin.split(' ').map(parseFloat);
      const points = [];
      function inParent(element, point) {
        const style = getComputedStyle(element);
        const [ox,oy,oz = 0] = style.transformOrigin.split(' ').map(parseFloat);
        // Entry animations temporarily fold the wings. Cache their resting
        // geometry so a resize notification cannot freeze an animated pose.
        const matrix = element.classList.contains('closing-wing')
          ? new DOMMatrix().rotate(0,element.classList.contains('closing-wing--left') ? 22 : -22,0)
          : new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
        const transformed = matrix.transformPoint(new DOMPoint(point.x-ox,point.y-oy,point.z-oz));
        return { x:transformed.x+ox+element.offsetLeft, y:transformed.y+oy+element.offsetTop, z:transformed.z+oz };
      }
      for (const face of root.querySelectorAll('.closing-panel,.closing-sheet,.closing-reverse')) {
        const wing = face.closest('.closing-wing');
        for (const x of [0,face.offsetWidth]) for (const y of [0,face.offsetHeight]) {
          const point = inParent(wing,inParent(face,{x,y,z:0}));
          points.push({x:point.x-root.offsetWidth/2,y:point.y-root.offsetHeight/2,z:point.z});
        }
      }
      geometry = { points, width:stage.clientWidth, height:stage.clientHeight,
        cx:root.offsetLeft+root.offsetWidth/2, cy:root.offsetTop+root.offsetHeight/2,
        perspective:parseFloat(stageStyle.perspective), perspectiveX,perspectiveY };
    }
    function orient(now = performance.now()) {
      frame = 0;
      const dt = lastTime ? Math.min(50, now-lastTime) : 16.67;
      lastTime = now;
      const blend = reduced.matches ? 1 : 1-Math.exp(-dt/32);
      yaw += (targetYaw-yaw)*blend;
      pitch += (targetPitch-pitch)*blend;
      fronts.forEach((front,index) => {
        const inert = far || travelling || (!mobile.matches && Math.cos((yaw+(index === 0 ? 22 : -22))*Math.PI/180)*Math.cos(pitch*Math.PI/180)<0);
        // Disable concealed actions, never the physical paper hit surface.
        front.querySelectorAll('a,button').forEach(action => { action.inert = inert; });
      });
      let fit = 1, dx = 0, dy = 0;
      if (geometry) {
        const g = geometry, ry = yaw*Math.PI/180, rx = pitch*Math.PI/180;
        const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
        const rotated = g.points.map(p => {
          const x = p.x*cy+p.z*sy, z = -p.x*sy+p.z*cy;
          return {x,y:p.y*cx-z*sx,z:p.y*sx+z*cx};
        });
        const bounds = () => {
          const projected = rotated.map(p => {
            const scale = .92*fit, depth = g.perspective/(g.perspective-p.z*scale);
            return {x:g.perspectiveX+(g.cx+p.x*scale-g.perspectiveX)*depth,
              y:g.perspectiveY+(g.cy+p.y*scale-g.perspectiveY)*depth,depth};
          });
          return {left:Math.min(...projected.map(p=>p.x)),right:Math.max(...projected.map(p=>p.x)),
            top:Math.min(...projected.map(p=>p.y)),bottom:Math.max(...projected.map(p=>p.y)),
            depth:projected.reduce((sum,p)=>sum+p.depth,0)/projected.length};
        };
        // Perspective fitting uses cached geometry only; there are no layout reads.
        for (let i=0;i<2;i++) {
          const box = bounds();
          fit *= Math.min(1,g.height*.82/(box.bottom-box.top),g.width*.88/(box.right-box.left));
        }
        const box = bounds();
        dx = (g.width/2-(box.left+box.right)/2)/box.depth;
        dy = (g.height*.46-(box.top+box.bottom)/2)/box.depth;
      }
      if (paintedFit === null || reduced.matches) {
        paintedFit = fit; paintedX = dx; paintedY = dy;
      } else {
        paintedFit += (fit-paintedFit)*blend;
        paintedX += (dx-paintedX)*blend;
        paintedY += (dy-paintedY)*blend;
      }
      // One non-inherited compositor property instead of five custom-property
      // writes that invalidate the text, gradients and all eight inner sheets.
      if (mobile.matches) root.style.removeProperty('transform');
      else root.style.transform = `translate(${paintedX}px,${paintedY}px) rotateX(${pitch}deg) rotateY(${yaw}deg) scale3d(${.92*paintedFit},${.92*paintedFit},${.92*paintedFit})`;
      if (Math.abs(targetYaw-yaw)+Math.abs(targetPitch-pitch) > .015
        || Math.abs(fit-paintedFit) > .0001
        || Math.abs(dx-paintedX)+Math.abs(dy-paintedY) > .05) schedule();
      else lastTime = 0;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(orient); }
    function reset() { targetYaw = yaw = -6; targetPitch = pitch = 10; paintedFit = null; cancelAnimationFrame(frame); orient(); }
    interactionStage.addEventListener('pointerdown', event => {
      const bounds = root.getBoundingClientRect();
      const onPaper = event.target.closest('.closing-book-orbit') ||
        (event.clientX >= bounds.left-16 && event.clientX <= bounds.right+16 &&
         event.clientY >= bounds.top-16 && event.clientY <= bounds.bottom+16);
      if (!onPaper) return;
      if (far || travelling) { event.stopPropagation(); return; }
      if (mobile.matches || event.target.closest('a,button') || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.stopPropagation();
      pointer = event.pointerId; dragged = false; suppressClick = false;
      originX = event.clientX; originY = event.clientY; originYaw = targetYaw; originPitch = targetPitch;
      root.setPointerCapture(pointer);
      root.classList.add('is-rotating');
      event.preventDefault();
    }, { ...options, capture:true });
    interactionStage.addEventListener('pointermove', event => {
      if (pointer !== event.pointerId) return;
      event.stopPropagation();
      const dx = event.clientX - originX, dy = event.clientY - originY;
      dragged ||= Math.hypot(dx, dy) > 5;
      if (dragged) { targetYaw = originYaw + dx * .25; targetPitch = originPitch - dy * .22; schedule(); }
    }, options);
    function release(event) {
      if (pointer !== event.pointerId) return;
      event.stopPropagation();
      schedule();
      suppressClick = dragged; pointer = null;
      root.classList.remove('is-rotating');
      if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    }
    interactionStage.addEventListener('pointerup', release, options);
    interactionStage.addEventListener('pointercancel', release, options);
    interactionStage.addEventListener('click', event => {
      if (far || travelling) {
        event.preventDefault(); event.stopPropagation();
        if (!travelling) void travel(false);
        return;
      }
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    }, { ...options, capture: true });
    root.addEventListener('dblclick', event => { if (!event.target.closest('a,button')) reset(); }, options);
    root.addEventListener('keydown', event => {
      if (event.target !== root) return;
      if (far && ['Enter',' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); void travel(false); return; }
      if (event.key === 'Home') { event.preventDefault(); reset(); }
      if (event.shiftKey && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        targetYaw += event.key === 'ArrowLeft' ? -8 : event.key === 'ArrowRight' ? 8 : 0;
        targetPitch += event.key === 'ArrowUp' ? 8 : event.key === 'ArrowDown' ? -8 : 0;
        schedule();
      }
    }, options);
    const observer = new ResizeObserver(() => { measure(); schedule(); });
    observer.observe(root);
    observer.observe(root.closest('.closing-page'));
    mobile.addEventListener('change', () => { measure(); schedule(); }, options);
    measure(); orient();
    dispose = () => { controller.abort(); observer.disconnect(); cancelAnimationFrame(frame); distanceAnimation?.cancel(); book.classList.remove('is-closing-distant'); };
  }
  window.ClosingBook = { mount, retreat: () => retreat(), stop: () => { dispose(); dispose = () => {}; retreat = () => Promise.resolve(); } };
})();
