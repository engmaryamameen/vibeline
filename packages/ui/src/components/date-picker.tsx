'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
  type WheelEvent
} from 'react';

import { cn } from '@vibeline/utils';

import { Portal } from './portal';

export interface DatePickerProps {
  id: string;
  name?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  minDate?: string;
  maxDate?: string;
  minimumAge?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

type PickerItem = {
  value: number;
  label: string;
};

type PickerColumnProps = {
  label: string;
  items: PickerItem[];
  value: number;
  onChange: (value: number) => void;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const ITEM_HEIGHT = 48;
const CLOSE_ANIMATION_MS = 240;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value?: string) => {
  if (!value) return null;

  const parts = value.split('-').map(Number);
  if (parts.length !== 3) return null;

  const [year, month, day] = parts;
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return normalizeDate(date);
};

const formatDisplayDate = (value?: string) => {
  const date = parseIsoDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).format(date);
};

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M8 2v4M16 2v4M3 9h18" />
    <rect x="3" y="4" width="18" height="17" rx="2" />
  </svg>
);

const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="m6 15 6-6 6 6" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

function PickerColumn({
  label,
  items,
  value,
  onChange
}: PickerColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value)
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTop = selectedIndex * ITEM_HEIGHT;
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const selectIndex = (
    index: number,
    behavior: ScrollBehavior = 'smooth'
  ) => {
    if (!items.length) return;

    const nextIndex = clamp(index, 0, items.length - 1);
    const nextItem = items[nextIndex];
    if (!nextItem) return;

    if (nextItem.value !== value) {
      onChange(nextItem.value);
    }

    containerRef.current?.scrollTo({
      top: nextIndex * ITEM_HEIGHT,
      behavior
    });
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const target = event.currentTarget;

    scrollTimeoutRef.current = setTimeout(() => {
      const index = clamp(
        Math.round(target.scrollTop / ITEM_HEIGHT),
        0,
        items.length - 1
      );

      const item = items[index];

      if (item && item.value !== value) {
        onChange(item.value);
      }

      target.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }, 90);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY === 0) return;

    selectIndex(selectedIndex + (event.deltaY > 0 ? 1 : -1));
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 text-center text-xs font-medium text-content-secondary sm:text-sm">
        {label}
      </div>

      <div className="flex flex-col items-center">
        <button
          type="button"
          aria-label={`Previous ${label.toLowerCase()}`}
          disabled={selectedIndex <= 0}
          onClick={() => selectIndex(selectedIndex - 1)}
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-full text-content-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-content-primary disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronUpIcon className="h-4 w-4" />
        </button>

        <div className="relative w-full">
          <div
            ref={containerRef}
            role="listbox"
            aria-label={label}
            tabIndex={0}
            onScroll={handleScroll}
            onWheel={handleWheel}
            className="relative h-36 snap-y snap-mandatory overflow-y-auto overscroll-contain py-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, index) => {
              const selected = item.value === value;

              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectIndex(index)}
                  className={cn(
                    'flex h-12 w-full snap-center items-center justify-center rounded-lg px-1 transition-[color,font-size,font-weight,opacity] duration-150',
                    selected
                      ? 'text-base font-semibold text-content-primary text-[17px] sm:text-[17px]'
                      : 'text-sm font-medium text-content-muted opacity-55 hover:text-content-secondary hover:opacity-100'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label={`Next ${label.toLowerCase()}`}
          disabled={selectedIndex >= items.length - 1}
          onClick={() => selectIndex(selectedIndex + 1)}
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-content-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-content-primary disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DatePicker({
  id,
  name,
  label,
  value,
  defaultValue,
  placeholder = 'MM/DD/YYYY',
  error,
  minDate,
  maxDate,
  minimumAge,
  disabled,
  required,
  className,
  onChange,
  onBlur
}: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = isControlled ? value : internalValue;

  const selectedDate = useMemo(
    () => parseIsoDate(selectedValue),
    [selectedValue]
  );

  const parsedMinDate = useMemo(() => parseIsoDate(minDate), [minDate]);
  const parsedMaxDate = useMemo(() => parseIsoDate(maxDate), [maxDate]);

  const now = normalizeDate(new Date());

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [draftYear, setDraftYear] = useState(
    selectedDate?.getFullYear() ?? now.getFullYear()
  );
  const [draftMonth, setDraftMonth] = useState(
    selectedDate ? selectedDate.getMonth() + 1 : now.getMonth() + 1
  );
  const [draftDay, setDraftDay] = useState(
    selectedDate?.getDate() ?? now.getDate()
  );

  const currentYear = now.getFullYear();
  const minYear = parsedMinDate?.getFullYear() ?? currentYear - 120;
  const maxYear = parsedMaxDate?.getFullYear() ?? currentYear;

  const yearItems = useMemo<PickerItem[]>(() => {
    const items: PickerItem[] = [];

    for (let year = minYear; year <= maxYear; year += 1) {
      items.push({
        value: year,
        label: String(year)
      });
    }

    return items;
  }, [minYear, maxYear]);

  const monthItems = useMemo<PickerItem[]>(
    () =>
      MONTHS.map((month, index) => ({
        value: index + 1,
        label: month
      })),
    []
  );

  const maximumDay = getDaysInMonth(draftYear, draftMonth);

  const dayItems = useMemo<PickerItem[]>(
    () =>
      Array.from({ length: maximumDay }, (_, index) => ({
        value: index + 1,
        label: String(index + 1).padStart(2, '0')
      })),
    [maximumDay]
  );

  useEffect(() => {
    if (draftDay > maximumDay) {
      setDraftDay(maximumDay);
    }
  }, [draftDay, maximumDay]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const documentElement = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverflow = documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const currentPaddingRight = Number.parseFloat(
      window.getComputedStyle(body).paddingRight
    ) || 0;

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const close = () => {
    setVisible(false);

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setValidationAttempted(false);
      onBlur?.();

      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }, CLOSE_ANIMATION_MS);
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const draftDate = normalizeDate(
    new Date(draftYear, draftMonth - 1, draftDay)
  );

  const minimumAgeDate =
    minimumAge !== undefined
      ? new Date(
        now.getFullYear() - minimumAge,
        now.getMonth(),
        now.getDate()
      )
      : null;

  const isTooYoung = Boolean(
    minimumAgeDate && draftDate.getTime() > minimumAgeDate.getTime()
  );

  const isBeforeMin = Boolean(
    parsedMinDate && draftDate.getTime() < parsedMinDate.getTime()
  );

  const isAfterMax = Boolean(
    parsedMaxDate && draftDate.getTime() > parsedMaxDate.getTime()
  );

  const draftInvalid = isTooYoung || isBeforeMin || isAfterMax;

  const openPicker = () => {
    if (disabled) return;

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    const source = selectedDate ?? normalizeDate(new Date());

    setDraftYear(source.getFullYear());
    setDraftMonth(source.getMonth() + 1);
    setDraftDay(source.getDate());
    setValidationAttempted(false);
    setOpen(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });
  };

  const apply = () => {
    if (draftInvalid) {
      setValidationAttempted(true);
      return;
    }

    const nextValue = toIsoDate(draftDate);

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
    close();
  };

  const errorId = `${id}-error`;
  const modalError = validationAttempted
    ? isTooYoung
      ? `You must be at least ${minimumAge} years old.`
      : isBeforeMin || isAfterMax
        ? 'Select a valid date.'
        : null
    : null;

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-content-primary"
        >
          {label}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue ?? ''}
          required={required}
        />
      )}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onClick={openPicker}
        className={cn(
          'flex h-[46px] w-full items-center justify-between rounded-lg border-[1.5px] bg-surface-panel px-4 text-left',
          'transition-[border-color,box-shadow] duration-150 ease-out',
          'border-border hover:border-border-strong',
          'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error &&
          'border-status-error focus:border-status-error focus:ring-status-error/10'
        )}
      >
        <span
          className={cn(
            'text-sm font-normal leading-[22px] tracking-[0.01em]',
            selectedValue ? 'text-content-primary' : 'text-content-muted'
          )}
        >
          {formatDisplayDate(selectedValue) || placeholder}
        </span>

        <CalendarIcon className="h-4 w-4 shrink-0 text-content-secondary" />
      </button>

      {error && (
        <span
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-center gap-2 text-sm leading-[22px] text-status-error"
        >
          <InfoIcon className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </span>
      )}

      {open && (
        <Portal>
          <div className="fixed inset-0 z-[1000]">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close date picker"
              onClick={close}
              className={cn(
                'absolute inset-0 h-full w-full cursor-default bg-black/45',
                'transition-opacity duration-[240ms] ease-out motion-reduce:transition-none',
                visible ? 'opacity-100' : 'opacity-0'
              )}
            />

            <div className="pointer-events-none absolute inset-0 flex items-end sm:items-center sm:justify-center sm:p-6 lg:p-8">
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-dialog-title`}
                className={cn(
                  'pointer-events-auto w-full bg-surface-panel shadow-2xl',
                  'rounded-t-[28px] border border-border px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3',
                  'transition-[transform,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                  'sm:w-[500px] sm:rounded-2xl sm:p-7 lg:w-[520px] lg:p-8',
                  visible
                    ? 'translate-y-0 opacity-100 sm:scale-100'
                    : 'translate-y-full opacity-0 sm:translate-y-3 sm:scale-[0.97]'
                )}
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong sm:hidden" />

                <div className="mb-6 flex items-center justify-between gap-4 sm:mb-7">
                  <h2
                    id={`${id}-dialog-title`}
                    className="font-display text-xl font-semibold leading-none text-content-primary sm:text-xl"
                  >
                    Date of birth
                  </h2>

                  <button
                    type="button"
                    aria-label="Close"
                    onClick={close}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-content-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-accent/15"
                  >
                    <CloseIcon className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-2 px-5">
                  <PickerColumn
                    key={`month-${open}`}
                    label="Month"
                    items={monthItems}
                    value={draftMonth}
                    onChange={setDraftMonth}
                  />

                  <PickerColumn
                    key={`day-${open}-${maximumDay}`}
                    label="Day"
                    items={dayItems}
                    value={draftDay}
                    onChange={setDraftDay}
                  />

                  <PickerColumn
                    key={`year-${open}`}
                    label="Year"
                    items={yearItems}
                    value={draftYear}
                    onChange={setDraftYear}
                  />
                </div>

                <div className="mt-4 min-h-6 sm:mt-4">
                  {modalError && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 text-sm text-status-error"
                    >
                      <InfoIcon className="h-4 w-4 shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-3 sm:mt-5">
                  <button
                    type="button"
                    onClick={close}
                    className="h-11 flex-1 rounded-lg border border-border bg-surface-panel px-4 text-sm font-medium text-content-primary transition-colors duration-150 hover:bg-surface-soft focus:outline-none focus:ring-2 focus:ring-accent/10"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={apply}
                    className="h-11 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
