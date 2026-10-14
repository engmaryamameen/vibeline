'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Pencil, Search, UserPlus, X } from 'lucide-react';
import type { ConversationMember } from '@vibeline/contracts';
import { ChatAvatar } from './chat-avatar';

type Props = {
  open: boolean;
  title: string;
  avatarUrl?: string;
  members: ConversationMember[];
  currentUserId?: string;
  canManage: boolean;
  onClose: () => void;
  onAdd: () => void;
  onRename: (name: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
};

export function GroupConversationDetails({ open, title, avatarUrl, members, currentUserId, canManage, onClose, onAdd, onRename, onRemove }: Props) {
  const [name, setName] = useState(title);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string>();
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string>();

  useEffect(() => {
    setName(title);
    setEditing(false);
    setSearch('');
    setError('');
    setConfirmId(undefined);
  }, [title, open]);

  if (!open) return null;

  const filtered = members.filter(member => member.displayName.toLowerCase().includes(search.trim().toLowerCase()));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = name.trim();
    if (!next || next === title || busy) {
      if (next === title) setEditing(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onRename(next);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the group name.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    if (removing) return;
    setRemoving(id);
    setError('');
    try {
      await onRemove(id);
      setConfirmId(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove this member.');
    } finally {
      setRemoving(undefined);
    }
  };

  return (
    <aside aria-label="Group details" className="absolute inset-0 z-50 flex min-h-0 flex-col bg-white lg:static lg:inset-auto lg:z-auto lg:w-[380px] lg:shrink-0 lg:border-l lg:border-black/10">
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-black/[.07] px-5">
        <h2 className="text-[19px] font-semibold text-black">Group details</h2>
        <button type="button" onClick={onClose} aria-label="Close group details" className="grid h-10 w-10 place-items-center rounded-full bg-black/[.04] hover:bg-black/[.08]"><X size={20}/></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        <div className="flex flex-col items-center border-b border-black/[.08] pb-6 pt-7 text-center">
          <ChatAvatar name={title} src={avatarUrl} group size="xl" className="!h-[88px] !w-[88px]" />
          <h3 className="mt-3 max-w-full break-words text-[23px] font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-black/45">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>
        <section className="border-b border-black/[.08] py-6" aria-label="Group name settings">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Group name</h4>
            {canManage && !editing && <button type="button" onClick={() => { setName(title); setEditing(true); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#228e70]"><Pencil size={15}/> Edit</button>}
          </div>
          {editing && canManage ? (
            <form onSubmit={submit} className="space-y-3">
              <input autoFocus aria-label="Group name" value={name} onChange={event => setName(event.target.value)} maxLength={100} className="h-11 w-full rounded-xl border border-black/15 px-3 text-sm outline-none focus:border-[#228e70] focus:ring-2 focus:ring-[#228e70]/15" />
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => { setEditing(false); setName(title); }} className="h-10 flex-1 rounded-xl bg-black/[.05] text-sm font-medium">Cancel</button>
                <button type="submit" disabled={busy || !name.trim() || name.trim() === title} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#228e70] text-sm font-semibold text-white disabled:opacity-45"><Check size={16}/>{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          ) : <p className="break-words text-[15px] text-black/65">{title}</p>}
        </section>
        <section className="pt-6" aria-label="Group members">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Members <span className="font-normal text-black/40">({members.length})</span></h4>
            {canManage && <button type="button" onClick={onAdd} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#e1f5ed] px-3 text-sm font-semibold text-[#228e70]"><UserPlus size={16}/> Add people</button>}
          </div>
          {members.length > 5 && <label className="mt-4 flex h-10 items-center gap-2 rounded-xl bg-black/[.04] px-3"><Search size={17} className="text-black/40"/><input aria-label="Search members" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search members" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>}
          <div className="mt-4 space-y-1">
            {filtered.length === 0 && <p className="py-5 text-center text-sm text-black/45">No members found.</p>}
            {filtered.map(member => (
              <div key={member.userId} className="flex min-h-[68px] items-center gap-3 rounded-xl px-1 py-2">
                <ChatAvatar name={member.displayName} src={member.avatarUrl}/>
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-medium">{member.displayName}{member.userId === currentUserId ? ' (you)' : ''}</p><p className="text-xs capitalize text-black/45">{member.role}</p></div>
                {canManage && member.userId !== currentUserId && (
                  confirmId === member.userId ? <div className="flex shrink-0 items-center gap-2"><button type="button" disabled={!!removing} onClick={() => void remove(member.userId)} className="text-xs font-semibold text-red-600">Confirm</button><button type="button" disabled={!!removing} onClick={() => setConfirmId(undefined)} className="text-xs text-black/55">Cancel</button></div>
                    : <button type="button" onClick={() => setConfirmId(member.userId)} className="shrink-0 rounded-lg px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button>
                )}
              </div>
            ))}
          </div>
        </section>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
    </aside>
  );
}
