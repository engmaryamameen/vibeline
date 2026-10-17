import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@vibeline/ui';
import { cn } from '@vibeline/utils';
import { authPrimaryClassName } from './auth-styles';

type Props = { loading: boolean; children: ReactNode; loadingLabel: string };

export function SubmitButton({ loading, children, loadingLabel }: Props) {
  return (
    <Button
      size="lg"
      type="submit"
      disabled={loading}
      className={cn(
        authPrimaryClassName,
        'flex h-11 w-full flex-row items-center justify-center gap-2 rounded-full px-[14px] py-3 text-center text-sm font-medium leading-5 tracking-[0.015em]'
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
