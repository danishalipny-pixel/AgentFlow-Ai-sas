import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'violet' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'gold',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

    const variants = {
      gold: 'bg-gold hover:bg-gold-light text-black font-semibold shadow-glow hover:shadow-[0_0_30px_rgba(212,175,55,0.25)] focus:ring-gold border border-gold/40',
      violet: 'bg-violet-accent hover:bg-violet-light text-white font-semibold shadow-violetGlow hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] focus:ring-violet-accent border border-violet-500/40',
      secondary: 'bg-surface-card hover:bg-surface-cardHover text-gray-200 border border-surface-border focus:ring-gray-400',
      outline: 'bg-transparent hover:bg-white/5 text-gray-200 border border-white/15 focus:ring-gray-400',
      ghost: 'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white',
      danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
