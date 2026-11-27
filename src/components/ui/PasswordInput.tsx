'use client';

import { useId, useState } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { Input, type InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'endAdornment'> {
  visible?: boolean;
  onVisibleChange?: (nextVisible: boolean) => void;
  toggleTestId?: string;
}

/* Monkey SVG artwork adapted from Milan Raring (MIT License, codepen.io/milanraring/pen/eYYqjeV). */
function MonkeyPasswordToggle({
  visible,
  controlsId,
  toggleTestId,
  disabled,
  onToggle,
}: {
  visible: boolean;
  controlsId: string;
  toggleTestId?: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const ariaLabel = visible ? VI_MESSAGES.auth.hidePasswordAria : VI_MESSAGES.auth.showPasswordAria;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={visible}
      aria-controls={controlsId}
      aria-label={ariaLabel}
      title={ariaLabel}
      data-visible={visible ? 'true' : 'false'}
      data-sfx="toggle"
      data-testid={toggleTestId}
      className="monkey-toggle-btn absolute top-0.5 right-0.5 bottom-0.5 flex w-11 cursor-pointer items-center justify-center overflow-hidden rounded-control border-0 bg-transparent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="relative flex h-8 w-8 items-center justify-center" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="h-8 w-8">
          <ellipse cx="53.7" cy="33" rx="8.3" ry="8.2" fill="#89664C" />
          <ellipse cx="53.7" cy="33" rx="5.4" ry="5.4" fill="#FFC5D3" />
          <ellipse cx="10.2" cy="33" rx="8.2" ry="8.2" fill="#89664C" />
          <ellipse cx="10.2" cy="33" rx="5.4" ry="5.4" fill="#FFC5D3" />
          <g fill="#89664C">
            <path d="m43.4 10.8c1.1-.6 1.9-.9 1.9-.9-3.2-1.1-6-1.8-8.5-2.1 1.3-1 2.1-1.3 2.1-1.3-20.4-2.9-30.1 9-30.1 19.5h46.4c-.7-7.4-4.8-12.4-11.8-15.2" />
            <path d="m55.3 27.6c0-9.7-10.4-17.6-23.3-17.6s-23.3 7.9-23.3 17.6c0 2.3.6 4.4 1.6 6.4-1 2-1.6 4.2-1.6 6.4 0 9.7 10.4 17.6 23.3 17.6s23.3-7.9 23.3-17.6c0-2.3-.6-4.4-1.6-6.4 1-2 1.6-4.2 1.6-6.4" />
          </g>
          <path
            d="m52 28.2c0-16.9-20-6.1-20-6.1s-20-10.8-20 6.1c0 4.7 2.9 9 7.5 11.7-1.3 1.7-2.1 3.6-2.1 5.7 0 6.1 6.6 11 14.7 11s14.7-4.9 14.7-11c0-2.1-.8-4-2.1-5.7 4.4-2.7 7.3-7 7.3-11.7"
            fill="#E0AC7E"
          />
          <g fill="#3B302A">
            <path d="m35.1 38.7c0 1.1-.4 2.1-1 2.1-.6 0-1-.9-1-2.1 0-1.1.4-2.1 1-2.1.6.1 1 1 1 2.1" />
            <path d="m30.9 38.7c0 1.1-.4 2.1-1 2.1-.6 0-1-.9-1-2.1 0-1.1.4-2.1 1-2.1.5.1 1 1 1 2.1" />
            <ellipse cx="40.7" cy="31.7" rx="3.5" ry="4.5" />
            <ellipse cx="23.3" cy="31.7" rx="3.5" ry="4.5" />
          </g>
          <path
            d="M 29.5 47.5 Q 32 48.6 34.5 47.5"
            fill="none"
            stroke="#3B302A"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="monkey-mouth-closed"
          />
          <path
            d="M 27.5 46.5 C 27.5 51 36.5 51 36.5 46.5"
            fill="none"
            stroke="#3B302A"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="monkey-mouth-open"
          />
        </svg>

        <span className="monkey-hands pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 64 64" className="monkey-hands-svg h-8 w-8">
            <path fill="#89664C" d="M9.4,32.5L2.1,61.9H14c-1.6-7.7,4-21,4-21L9.4,32.5z" />
            <path
              fill="#FFD6BB"
              d="M15.8,24.8c0,0,4.9-4.5,9.5-3.9c2.3,0.3-7.1,7.6-7.1,7.6s9.7-8.2,11.7-5.6c1.8,2.3-8.9,9.8-8.9,9.8s10-8.1,9.6-4.6c-0.3,3.8-7.9,12.8-12.5,13.8C11.5,43.2,6.3,39,9.8,24.4C11.6,17,13.3,25.2,15.8,24.8"
            />
            <path fill="#89664C" d="M54.8,32.5l7.3,29.4H50.2c1.6-7.7-4-21-4-21L54.8,32.5z" />
            <path
              fill="#FFD6BB"
              d="M48.4,24.8c0,0-4.9-4.5-9.5-3.9c-2.3,0.3,7.1,7.6,7.1,7.6s-9.7-8.2-11.7-5.6c-1.8,2.3,8.9,9.8,8.9,9.8s-10-8.1-9.7-4.6c0.4,3.8,8,12.8,12.6,13.8c6.6,1.3,11.8-2.9,8.3-17.5C52.6,17,50.9,25.2,48.4,24.8"
            />
          </svg>
        </span>
      </span>
    </button>
  );
}

/**
 * Native password field with an accessible monkey cover/peek toggle button.
 * Keeps `type="password"` / `type="text"` intact for browser Autofill and password managers.
 */
export function PasswordInput({
  id,
  visible,
  onVisibleChange,
  toggleTestId,
  disabled,
  className = '',
  ...rest
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [internalVisible, setInternalVisible] = useState(false);

  const isControlled = visible !== undefined;
  const isVisible = isControlled ? visible : internalVisible;

  function handleToggle() {
    const next = !isVisible;
    if (!isControlled) {
      setInternalVisible(next);
    }
    onVisibleChange?.(next);
  }

  return (
    <Input
      id={inputId}
      type={isVisible ? 'text' : 'password'}
      disabled={disabled}
      className={`password-input-native ${className}`.trim()}
      endAdornment={
        <MonkeyPasswordToggle
          visible={isVisible}
          controlsId={inputId}
          toggleTestId={toggleTestId}
          disabled={disabled}
          onToggle={handleToggle}
        />
      }
      {...rest}
    />
  );
}
