import React from 'react';
import { Loader } from 'lucide-react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClass = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'sm' }) => {
  const sizeClassName = sizeClass[size];
  return <Loader className={`${sizeClassName} animate-spin`} />;
};

export default Spinner;
