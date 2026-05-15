import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="label-caps">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        )}
        <input
          ref={ref}
          className={`w-full bg-background border border-border rounded-md py-2 px-3 ${Icon ? 'pl-9' : ''} text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors ${error ? 'border-status-critical' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-status-critical">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
export default Input;
