'use client';
import { useEffect,useState,type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { CallMedia } from '@vibeline/contracts';
import { CallHistoryList } from '@/src/features/calls/components/call-history-list';
import { useCallHistory } from '@/src/features/calls/hooks/use-call-history';
import { useAuthorizedRequest } from '@/src/lib/authorized-request';
import { cn } from '@vibeline/utils';
import { chatIcons } from '@/src/shared/assets/svg/chat';
import { ChatAvatar } from './chat-avatar';
import { EmojiPicker } from './emoji-picker';

type Props={open:boolean;conversationId:string;name:string;avatarUrl?:string;quickEmoji:string;currentUserId?:string;callsSupported:boolean;callBusy:boolean;onStartCall:(media:CallMedia)=>void;onSetQuickEmoji:(emoji:string)=>Promise<void>;onClose:()=>void};
const iconButton='grid h-10 w-10 place-items-center rounded-full bg-black/[.04]';
const row='flex h-[52px] w-full items-center border-b border-black/[.12] text-left text-[17px] leading-5 tracking-[-.41px]';
export function ConversationDetails({open,conversationId,name,avatarUrl,quickEmoji,currentUserId,callsSupported,callBusy,onStartCall,onSetQuickEmoji,onClose}:Props){
 const request=useAuthorizedRequest();const [muted,setMuted]=useState(false);const [emojiOpen,setEmojiOpen]=useState(false);const [savingMute,setSavingMute]=useState(false);
 const history=useCallHistory(conversationId,open);
 useEffect(()=>{if(!open)return;let cancelled=false;void request<{preference:{muted:boolean}}>(`/notifications/conversations/${conversationId}`).then(({preference})=>{if(!cancelled)setMuted(preference.muted)}).catch(()=>{});return()=>{cancelled=true}},[open,conversationId,request]);
 const toggleMute=async()=>{if(savingMute)return;const next=!muted;setSavingMute(true);try{const {preference}=await request<{preference:{muted:boolean}}>(`/notifications/conversations/${conversationId}`,{method:'PUT',body:{muted:next}});setMuted(preference.muted)}finally{setSavingMute(false)}};
 if(!open)return null;
 const callActions=[[chatIcons.profileAudio,'Audio','audio'],[chatIcons.profileVideo,'Video','video']] as const;
 return <aside className="absolute inset-0 z-50 flex min-h-0 flex-col overflow-y-auto bg-white lg:static lg:inset-auto lg:z-auto lg:w-[380px] lg:shrink-0 lg:border-l lg:border-black/[.12]">
  <div className="relative flex min-h-full flex-col px-4 pb-8 pt-5 xl:pt-8">
   <button onClick={onClose} aria-label="Back to conversation" className="absolute left-4 top-5 grid h-10 w-10 place-items-center lg:hidden"><img src={chatIcons.backBlue} alt="" width={13} height={23} className="brightness-0"/></button><button onClick={onClose} aria-label="Close conversation details" className="absolute right-4 top-5 hidden h-10 w-10 place-items-center rounded-full hover:bg-black/[.04] lg:grid"><X size={24}/></button>
   <div className="flex flex-col items-center pt-5"><ChatAvatar name={name} src={avatarUrl} size="xl" className="!h-[88px] !w-[88px]"/><h2 className="mt-2 text-center text-[24px] font-bold leading-[29px] tracking-[.33px] text-black">{name}</h2><p className="mt-0.5 text-[14px] text-black/45">Vibeline</p></div>
   <div className="mx-auto mt-5 grid w-full max-w-[268px] grid-cols-4 gap-4">{callActions.map(([icon,label,media])=><button key={label} type="button" disabled={!callsSupported||callBusy} onClick={()=>onStartCall(media)} title={callsSupported?`${label} call`:'Calling needs a modern browser served over HTTPS'} aria-label={`${label} call with ${name}`} className="flex flex-col items-center transition-opacity disabled:opacity-40"><span className={iconButton}><img src={icon} alt="" className="max-h-5 max-w-[21px]"/></span><span className="mt-1.5 text-[12px] leading-[14px] tracking-[-.01px] text-black/50">{label}</span></button>)}<button type="button" title="Profile is not available yet" aria-disabled="true" className="flex flex-col items-center"><span className={iconButton}><img src={chatIcons.profilePerson} alt="" className="max-h-5 max-w-[21px]"/></span><span className="mt-1.5 text-[12px] leading-[14px] tracking-[-.01px] text-black/50">Profile</span></button><button type="button" onClick={()=>void toggleMute()} disabled={savingMute} aria-pressed={muted} className="flex flex-col items-center disabled:opacity-50"><span className={iconButton}><img src={chatIcons.profileBell} alt="" className="max-h-5 max-w-[21px]"/></span><span className="mt-1.5 text-[12px] leading-[14px] tracking-[-.01px] text-black/50">{muted?'Unmute':'Mute'}</span></button></div>
   <div className="mt-4"><div className={row}><span>Color</span><span className="ml-auto h-6 w-6 rounded-full bg-[#0584FE] ring-[6px] ring-inset ring-[#0584FE]"><span className="mx-auto mt-[9px] block h-1.5 w-1.5 rounded-full bg-white"/></span></div><div className="relative"><button type="button" onClick={()=>setEmojiOpen(v=>!v)} className={row}><span>Emoji</span><span className="ml-auto text-[22px]">{quickEmoji}</span></button>{emojiOpen&&<EmojiPicker className="md:right-0 md:top-[48px]" title="Choose quick emoji" onClose={()=>setEmojiOpen(false)} onSelect={emoji=>{void onSetQuickEmoji(emoji);setEmojiOpen(false)}}/>}</div><button type="button" className={row}><span>Nicknames</span><img className="ml-auto" src={chatIcons.profileChevron} alt="" width={8} height={13}/></button></div>
   <Section title="Calls"><CallHistoryList calls={history.calls} loading={history.loading} error={history.error} currentUserId={currentUserId}/></Section>
   <Section title="More actions"><button type="button" className={row}><span>Search in Conversation</span><span className={cn(iconButton,'ml-auto !h-8 !w-8')}><img src={chatIcons.profileSearch} alt="" width={15} height={15}/></span></button><button type="button" className={row}><span>Create group</span><span className={cn(iconButton,'ml-auto !h-8 !w-8')}><img src={chatIcons.profileGroup} alt="" width={22} height={13}/></span></button></Section>
   <Section title="Privacy"><button type="button" className={row}><span>Ignore Messages</span><span className={cn(iconButton,'ml-auto !h-8 !w-8')}><img src={chatIcons.profileIgnore} alt="" width={16} height={16}/></span></button><button type="button" className={cn(row,'border-b-0')}><span>Block</span></button></Section>
  </div>
 </aside>;
}
function Section({title,children}:{title:string;children:ReactNode}){return <section className="mt-6"><h3 className="mb-1 text-[13px] font-semibold uppercase leading-4 tracking-[-.15px] text-black/35">{title}</h3>{children}</section>}
