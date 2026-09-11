'use client';

import React, { useEffect } from 'react';

/**
 * Universal Holdable & Drag-to-Cancel Interaction for all buttons in the app (excluding dropdowns).
 * - When pressed and held: blurs the whole button (box & text) and slightly recesses (scale 0.98, opacity 0.7).
 * - If cursor/finger is dragged outside the button box: cancels the action and restores normal sharpness.
 * - If released inside or tapped: executes the action normally.
 */
export const HoldableGlobalListener: React.FC = () => {
  useEffect(() => {
    let activeBtn: HTMLElement | null = null;
    let isCancelled = false;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest interactive button or button-like element
      const btn = target.closest(
        'button, [role="button"], a[class*="border-2"], a[class*="shadow-"]'
      ) as HTMLElement | null;

      if (!btn) return;

      // Skip dropdowns, citation buttons, and elements marked with data-no-hold
      if (
        btn.tagName === 'SELECT' ||
        btn.closest('select') ||
        btn.hasAttribute('data-no-hold') ||
        btn.closest('[data-no-hold]') ||
        btn.closest('[data-citation-container]') ||
        (btn as HTMLButtonElement).disabled
      ) {
        return;
      }

      activeBtn = btn;
      isCancelled = false;

      // Apply held styling class
      btn.classList.add('btn-held-active');

      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!activeBtn) return;

      const rect = activeBtn.getBoundingClientRect();
      // Boundary (+6px tolerance) around the button
      const isInside =
        e.clientX >= rect.left - 6 &&
        e.clientX <= rect.right + 6 &&
        e.clientY >= rect.top - 6 &&
        e.clientY <= rect.bottom + 6;

      if (!isInside && !isCancelled) {
        isCancelled = true;
        activeBtn.classList.remove('btn-held-active');
      } else if (isInside && isCancelled) {
        isCancelled = false;
        activeBtn.classList.add('btn-held-active');
      }
    };

    const handlePointerUp = () => {
      if (!activeBtn) return;

      const currentTarget = activeBtn;
      currentTarget.classList.remove('btn-held-active');

      if (isCancelled) {
        // Suppress the click event so the action is cancelled!
        const suppressClick = (clickEvent: MouseEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          clickEvent.stopImmediatePropagation();
        };

        window.addEventListener('click', suppressClick, { capture: true, once: true });
        setTimeout(() => {
          window.removeEventListener('click', suppressClick, { capture: true });
        }, 60);
      }

      activeBtn = null;
      isCancelled = false;
    };

    const handlePointerCancel = () => {
      if (activeBtn) {
        activeBtn.classList.remove('btn-held-active');
        activeBtn = null;
      }
      isCancelled = true;
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, []);

  return null;
};
