'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@vibeline/ui';
import { Bell, BellOff, LogOut } from 'lucide-react';
import { usePushNotifications } from '@/src/features/notifications/use-push-notifications';

type Props = { displayName: string; onLogout: () => void };

export function SidebarAccountMenu({ displayName, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const push = usePushNotifications();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleNotifications = async () => {
    setBusy(true);
    setError('');
    try {
      if (push.enabled) await push.disable();
      else if (!(await push.enable())) setError(push.permission === 'denied' ? 'Notifications are blocked in your browser settings.' : 'Notifications could not be enabled.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Notifications could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Avatar name={displayName} size="lg" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-black/[.08] bg-white shadow-[0_16px_50px_rgba(0,0,0,.18)] motion-safe:animate-scale-in"
        >
          <p className="truncate border-b border-black/[.08] px-4 py-3 text-[13px] text-black/50">{displayName}</p>

          {push.supported && (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => void toggleNotifications()}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition-colors hover:bg-black/[.04] disabled:opacity-50"
            >
              {push.enabled ? <Bell size={17} className="text-accent" /> : <BellOff size={17} className="text-black/45" />}
              <span className="min-w-0 flex-1">
                <span className="block">{push.enabled ? 'Notifications on' : 'Enable notifications'}</span>
                {error && <span className="block text-[11px] text-status-error">{error}</span>}
              </span>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-3 border-t border-black/[.08] px-4 py-3 text-left text-[15px] text-status-error transition-colors hover:bg-status-error/[.06]"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
