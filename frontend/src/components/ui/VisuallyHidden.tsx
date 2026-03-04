import React from 'react';

/**
 * VisuallyHidden - Hides content visually but keeps it accessible to screen readers
 * 
 * Usage:
 * <button>
 *   <TrashIcon />
 *   <VisuallyHidden>Hapus item</VisuallyHidden>
 * </button>
 */
interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ 
  children, 
  as: Component = 'span' 
}) => {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
};

export default VisuallyHidden;
