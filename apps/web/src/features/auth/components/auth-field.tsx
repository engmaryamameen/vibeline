import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react';
import { Info, type LucideProps } from 'lucide-react';
import { Input } from '@vibeline/ui';
import { cn } from '@vibeline/utils';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ComponentType<LucideProps>;
  trailing?: ReactNode;
  fieldAction?: ReactNode;
  error?: string;
};

export function AuthField({ label, icon: Icon, trailing, fieldAction, error, className, id, name, ...props }: Props) {
  const fieldId = id ?? name;
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="mb-2 block text-sm font-medium text-content-primary">{label}</span>

      <span className="group relative block">
        {Icon && (
          <Icon
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2',
              'text-content-muted transition-colors duration-150',
              'group-focus-within:text-accent',
              error && 'text-status-error'
            )}
          />
        )}

        <Input
          id={fieldId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(Icon && 'pl-11', trailing && 'pr-12', className)}
          {...props}
        />

        {trailing}
      </span>

      {(error || fieldAction) && (
        <span className="mt-1.5 flex items-start justify-between gap-3">
          <span className="min-w-0 flex-1">
            {error && (
              <span id={errorId} role="alert" className="flex items-center gap-2 text-sm leading-[22px] text-status-error">
                <Info className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </span>
            )}
          </span>
          {fieldAction && <span className="shrink-0">{fieldAction}</span>}
        </span>
      )}
    </label>
  );
}
