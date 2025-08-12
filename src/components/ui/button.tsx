import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:text-white': variant === 'default',
            'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]': variant === 'destructive',
            'border border-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary-lightest)] text-[var(--color-primary)]': variant === 'outline',
            'bg-transparent hover:bg-[var(--color-primary-lightest)] text-[var(--color-primary)]': variant === 'ghost',
            'underline-offset-4 hover:underline text-[var(--color-primary)]': variant === 'link',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
