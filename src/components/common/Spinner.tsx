import { FC } from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

const Spinner: FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`inline-block ${sizeClasses[size]} animate-spin rounded-full border-solid border-primary-500 border-t-transparent ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export { Spinner };
