import type { InputHTMLAttributes } from 'react';
import { cn } from '@vibeline/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      'h-[46px] w-full rounded-lg border-2 border-[#E2E8F0] bg-white px-4',
      'text-sm font-normal leading-[22px] tracking-[0.01em] text-[#334155]',
      'placeholder:text-[#94A3B8]',
      'outline-none transition-colors duration-150 ease-out',
      'hover:border-[#CBD5E1]',
      'focus:border-[#CBCBCB]',
      'aria-[invalid=true]:border-[#D12E34]',
      'disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:opacity-60',
      className
    )}
    {...props}
  />
);
