import type { ReactNode } from 'react';

type Props = { title: string; description?: string; action?: ReactNode };

export function AuthHeader({ title, description, action }: Props) {
  return (
    <header className="mb-10 sm:mb-6">
      <h1 className="text-center font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.045em] text-content-primary sm:text-[2.3rem] md:text-left">
        {title}
      </h1>

      {(description || action) && (
        <div className="mt-2 max-w-sm text-center text-sm leading-6 text-content-secondary md:text-left">
          {description && <span>{description}</span>}
          {action && (
            <>
              {description && ' '}
              {action}
            </>
          )}
        </div>
      )}
    </header>
  );
}
