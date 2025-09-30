
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  // className and onClick are inherited from React.HTMLAttributes<HTMLDivElement>
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const finalClassName = `bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg dark:hover:shadow-primary/20 ${className}`.trim();

  return (
    <div className={finalClassName} {...props}>
      {children}
    </div>
  );
};

export default Card;