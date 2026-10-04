import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@vibeline/utils';

type LayoutProps = HTMLAttributes<HTMLDivElement>;

type PageShellProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  containerClassName?: string;
  gridClassName?: string;
};

export const PageContainer = ({ className, ...props }: LayoutProps) => (
  <div
    className={cn(
      'mx-auto flex min-h-[100dvh] w-full max-w-[2200px]',
      'px-4',
      'sm:px-6',
      'md:px-8',
      'lg:px-10',
      'xl:px-12',
      className
    )}
    {...props}
  />
);
export const ResponsiveGrid = ({ className, ...props }: LayoutProps) => (
  <div
    className={cn(
      'grid w-full flex-1 grid-cols-4 gap-x-4',
      'md:grid-cols-8 md:gap-x-6',
      'lg:grid-cols-12 lg:gap-x-6',
      className
    )}
    {...props}
  />
);

export const PageShell = ({
  children,
  className,
  containerClassName,
  gridClassName,
  ...props
}: PageShellProps) => (
  <main
    className={cn('min-h-[100dvh] bg-white', className)}
    {...props}
  >
    <PageContainer className={containerClassName}>
      <ResponsiveGrid className={gridClassName}>
        {children}
      </ResponsiveGrid>
    </PageContainer>
  </main>
);