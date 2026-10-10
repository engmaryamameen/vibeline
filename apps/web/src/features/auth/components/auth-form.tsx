import type { FormHTMLAttributes } from 'react';
import { cn } from '@vibeline/utils';

export function AuthForm({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cn('space-y-8', className)} noValidate {...props} />;
}
