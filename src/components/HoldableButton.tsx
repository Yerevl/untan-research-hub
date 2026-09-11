'use client';

import React, { useState, useRef, useEffect } from 'react';

interface HoldableButtonProps {
  onTrigger: () => void;
  icon: React.ReactNode;
  label: string;
  title?: string;
  className?: string;
}

export const HoldableButton: React.FC<HoldableButtonProps> = ({
  onTrigger,
  icon,
  label,
  title,
  className = '',
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isCancelledRef = useRef(false);
  const isPointerDownRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    isCancelledRef.current = false;
    setIsHolding(true);

    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;

      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Generous boundary (+6px) around the button
        const isInside =
          e.clientX >= rect.left - 6 &&
          e.clientX <= rect.right + 6 &&
          e.clientY >= rect.top - 6 &&
          e.clientY <= rect.bottom + 6;

        if (!isInside) {
          if (!isCancelledRef.current) {
            isCancelledRef.current = true;
            setIsHolding(false);
          }
        } else {
          if (isCancelledRef.current) {
            isCancelledRef.current = false;
            setIsHolding(true);
          }
        }
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      if (!isCancelledRef.current) {
        onTrigger();
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(20);
        }
      }

      setIsHolding(false);
      isCancelledRef.current = false;
    };

    const handleGlobalPointerCancel = () => {
      isPointerDownRef.current = false;
      isCancelledRef.current = true;
      setIsHolding(false);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerCancel);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerCancel);
    };
  }, [onTrigger]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onPointerDown={handlePointerDown}
      className={`inline-flex items-center space-x-1.5 px-3 py-2 border-2 border-black dark:border-white font-black text-xs uppercase tracking-wide transition-all duration-150 select-none touch-none ${
        isHolding
          ? 'blur-[1.5px] opacity-70 scale-[0.98]'
          : 'blur-none opacity-100 scale-100 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5'
      } bg-white dark:bg-black text-black dark:text-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-[#FEF08A] hover:text-black ${className}`}
      title={title}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
