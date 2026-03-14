import * as React from 'react';
import { cn } from '../utils/cn';

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="toolbar"
      className={cn('flex items-center gap-1 border-b border-gray-200 px-2 py-1', className)}
      {...props}
    />
  ),
);
Toolbar.displayName = 'Toolbar';

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded text-sm transition-colors hover:bg-gray-100',
        active && 'bg-gray-200',
        className,
      )}
      {...props}
    />
  ),
);
ToolbarButton.displayName = 'ToolbarButton';
