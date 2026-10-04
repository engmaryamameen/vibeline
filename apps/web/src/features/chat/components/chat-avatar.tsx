import { Avatar } from '@vibeline/ui';
import { Bot, Users } from 'lucide-react';
import { cn } from '@vibeline/utils';

export function ChatAvatar({name,src,group=false,assistant=false,size='md',className,online=false}:{name:string;src?:string;group?:boolean;assistant?:boolean;size?:'md'|'lg'|'xl';className?:string;online?:boolean}){
 if(group||assistant)return <div className={cn('grid shrink-0 place-items-center rounded-full bg-accent-subtle text-accent',size==='xl'?'h-[60px] w-[60px]':size==='lg'?'h-[52px] w-[52px]':'h-10 w-10',className)}>{assistant?<Bot size={size==='xl'?26:size==='lg'?24:19}/>:<Users size={size==='xl'?26:size==='lg'?24:19}/>}</div>;
 return <span className="relative inline-flex shrink-0"><Avatar name={name} src={src} size="lg" className={cn(size==='xl'?'!h-[60px] !w-[60px]':size==='lg'?'!h-[52px] !w-[52px]':undefined,className)}/>{online&&<span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2px] border-surface-panel bg-emerald-500 animate-[presence-in_180ms_ease-out]"/>}</span>;
}
