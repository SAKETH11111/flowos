/*
  FlowOS Animation System
  - 3D Dock interactions with hardware acceleration
  - Neighbor magnification (dock effect)
  - IntersectionObserver to pause work when offscreen
  - Touch support for mobile users
*/

/* eslint-env browser */

(function initAnimations() {
  const taskbar = document.querySelector('.taskbar');
  if (!taskbar) return;

  taskbar.classList.add('dock-3d-container');

  const items = Array.from(taskbar.querySelectorAll('.taskbar > div, .taskbar .taskbar-item'));
  items.forEach((el) => {
    el.classList.add('dock-item-3d');
    el.style.willChange = 'transform';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        items.forEach((el) => (el.style.transform = 'translateZ(0)'));
      }
    });
  }, { threshold: 0.01 });

  observer.observe(taskbar);

  function applyDockEffect(index, intensity = 1) {
    const maxScale = 1.18 * intensity;
    const neighborScale = 1.08 * intensity;
    const tilt = 6 * intensity;

    items.forEach((el, i) => {
      const distance = Math.abs(i - index);
      if (distance === 0) {
        el.style.transform = `perspective(1000px) translateZ(10px) rotateX(8deg) rotateY(4deg) scale(${maxScale})`;
      } else if (distance === 1) {
        el.style.transform = `perspective(1000px) translateZ(6px) rotateX(6deg) rotateY(3deg) scale(${neighborScale})`;
      } else {
        el.style.transform = 'translateZ(0)';
      }
    });
  }

  function resetDockEffect() {
    items.forEach((el) => {
      el.style.transform = 'translateZ(0)';
    });
  }

  // Mouse hover interaction
  items.forEach((el, index) => {
    el.addEventListener('mouseenter', () => applyDockEffect(index, 1));
    el.addEventListener('mouseleave', resetDockEffect);
  });

  // Touch interaction: magnify beneath finger
  let activeTouch = null;
  taskbar.addEventListener('touchstart', (e) => {
    activeTouch = e.touches[0];
    const idx = items.findIndex((el) => {
      const rect = el.getBoundingClientRect();
      return activeTouch.clientX >= rect.left && activeTouch.clientX <= rect.right;
    });
    if (idx >= 0) applyDockEffect(idx, 1);
  }, { passive: true });

  taskbar.addEventListener('touchmove', (e) => {
    activeTouch = e.touches[0];
    const idx = items.findIndex((el) => {
      const rect = el.getBoundingClientRect();
      return activeTouch.clientX >= rect.left && activeTouch.clientX <= rect.right;
    });
    if (idx >= 0) applyDockEffect(idx, 1);
  }, { passive: true });

  taskbar.addEventListener('touchend', () => {
    activeTouch = null;
    resetDockEffect();
  });
})();
