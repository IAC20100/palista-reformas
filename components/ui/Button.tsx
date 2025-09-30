

import React from 'react';

// Fix: Refactored prop types for the generic component to be more robust.
type ButtonBaseProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
};

type ButtonProps<E extends React.ElementType> = ButtonBaseProps & {
  as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, keyof ButtonBaseProps | 'as'>;


const Button = <E extends React.ElementType = 'button'>({
  as,
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  className,
  ...props
}: ButtonProps<E>) => {
  const Component = as || 'button';

  const baseClasses = 'inline-flex items-center justify-center border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-hover text-white focus:ring-primary',
    secondary: 'bg-secondary hover:bg-secondary-hover text-white focus:ring-secondary',
    ghost: 'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 focus:ring-primary',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  const finalClassName = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className || ''}`.trim();

  return (
    // Fix: This line no longer causes an error due to corrected prop types.
    <Component {...props} className={finalClassName}>
      {leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
      {children}
    </Component>
  );
};

export default Button;