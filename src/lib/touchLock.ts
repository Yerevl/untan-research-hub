import type React from 'react';

/**
 * Universal touch-scroll-lock helper for interactive buttons and links.
 * Prevents mobile browser scrolling while the element is held or touched,
 * while ensuring clean release on pointer up/cancel so clicks still trigger.
 */
export function lockTouchScrollOnPointerDown(e: React.PointerEvent<HTMLElement>) {
  if (e.button !== 0) return;

  if (e.currentTarget && 'setPointerCapture' in e.currentTarget) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }

  if (typeof document === 'undefined') return;

  const originalOverflow = document.body.style.overflow;
  const originalTouchAction = document.body.style.touchAction;

  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';

  const preventTouch = (te: TouchEvent) => {
    if (te.cancelable) {
      te.preventDefault();
    }
  };

  window.addEventListener('touchmove', preventTouch, { passive: false });

  const cleanup = () => {
    document.body.style.overflow = originalOverflow;
    document.body.style.touchAction = originalTouchAction;
    window.removeEventListener('touchmove', preventTouch);
    window.removeEventListener('pointerup', cleanup);
    window.removeEventListener('pointercancel', cleanup);
  };

  window.addEventListener('pointerup', cleanup, { once: true });
  window.addEventListener('pointercancel', cleanup, { once: true });
}

