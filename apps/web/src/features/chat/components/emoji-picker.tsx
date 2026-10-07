'use client';
import { useEffect,useMemo,useRef,useState } from 'react';
import { Search,X } from 'lucide-react';
import { cn } from '@vibeline/utils';

const GROUPS=[
 ['Recent',['👍','❤️','😂','🔥','👏','🎉','😍','😭']],
 ['Smileys',['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😎','🤩','🥳','😭','😢','😮','😱','🤯','😡','🤔','🫡','🤗']],
 ['Gestures',['👍','👎','👏','🙌','👋','🤝','🙏','💪','👌','✌️','🤞','🤟','🤘','💯','✨']],
 ['Hearts',['❤️','❤️‍🔥','💔','💕','💙','💚','💜','🖤','🤍','💛','🧡']],
 ['Fun',['🎉','🎂','🎁','🎈','⭐','🌟','💥','💫','🚀','⚽','🏀','🎮','🎵','📸','💡','👀','💬','📌','🔔']],
 ['Food',['☕','🍕','🍔','🍟','🍿','🍩','🍪','🍓','🍉']],
] as const;
const ALL=[...new Set(GROUPS.flatMap(([,items])=>items))];
export const DEFAULT_REACTIONS=['👍','❤️','😂','😮','😢'];

type Props={onSelect:(emoji:string)=>void;onClose:()=>void;className?:string;title?:string};
export function EmojiPicker({onSelect,onClose,className='',title='Emoji'}:Props){
 const panelRef=useRef<HTMLDivElement>(null);const searchRef=useRef<HTMLInputElement>(null);const [query,setQuery]=useState('');const [visible,setVisible]=useState(false);
 useEffect(()=>{const frame=requestAnimationFrame(()=>setVisible(true));const key=(event:KeyboardEvent)=>{if(event.key==='Escape')close()};document.addEventListener('keydown',key);return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key)}},[]);
 const close=()=>{setVisible(false);window.setTimeout(onClose,140)};
 const filtered=useMemo(()=>query.trim()?ALL.filter(emoji=>emoji.includes(query.trim())):null,[query]);
 const choose=(emoji:string)=>{onSelect(emoji);try{const previous=JSON.parse(localStorage.getItem('vibeline:recent-emojis')||'[]') as string[];localStorage.setItem('vibeline:recent-emojis',JSON.stringify([emoji,...previous.filter(v=>v!==emoji)].slice(0,12)))}catch{}};
 return <div className="fixed inset-0 z-[80] md:pointer-events-none" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
  <button type="button" aria-label="Close emoji picker" onClick={close} className={cn('absolute inset-0 bg-black/20 transition-opacity duration-150 md:bg-transparent',visible?'opacity-100':'opacity-0')}/>
  <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} className={cn('pointer-events-auto absolute inset-x-0 bottom-0 max-h-[72dvh] rounded-t-[26px] border border-black/[.08] bg-white shadow-[0_-12px_40px_rgba(0,0,0,.14)] transition duration-150 ease-out md:inset-auto md:w-[340px] md:max-h-none md:rounded-[20px] md:shadow-[0_16px_50px_rgba(0,0,0,.18)]',visible?'translate-y-0 scale-100 opacity-100':'translate-y-3 scale-[.985] opacity-0',className)}>
   <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-black/15 md:hidden"/>
   <div className="flex items-center gap-2 px-4 pb-2 pt-3"><div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-black/[.05] px-3"><Search size={16} className="shrink-0 text-black/35"/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search emoji" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-black/35"/></div><button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-black/55 hover:bg-black/[.05]"><X size={18}/></button></div>
   <div className="emoji-scroll max-h-[52dvh] overflow-y-auto overscroll-contain px-3 pb-[max(16px,env(safe-area-inset-bottom))] md:max-h-[330px]">
    {filtered?<div className="grid grid-cols-8 gap-1 py-2">{filtered.map(emoji=><EmojiButton key={emoji} emoji={emoji} onSelect={choose}/>)}</div>:GROUPS.map(([label,items])=><section key={label} className="pb-3"><h3 className="sticky top-0 z-10 bg-white/95 px-1 py-2 text-[11px] font-semibold uppercase tracking-wide text-black/35 backdrop-blur">{label}</h3><div className="grid grid-cols-8 gap-1">{items.map(emoji=><EmojiButton key={`${label}-${emoji}`} emoji={emoji} onSelect={choose}/>)}</div></section>)}
   </div>
  </div>
 </div>;
}
function EmojiButton({emoji,onSelect}:{emoji:string;onSelect:(emoji:string)=>void}){return <button type="button" onClick={()=>onSelect(emoji)} aria-label={`Choose ${emoji}`} className="grid aspect-square min-h-9 place-items-center rounded-xl text-[24px] transition-transform duration-100 hover:bg-black/[.05] active:scale-90">{emoji}</button>}
