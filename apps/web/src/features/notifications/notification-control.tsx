
'use client';
import { Bell,BellOff } from 'lucide-react';
import { usePushNotifications } from './use-push-notifications';
export function NotificationControl(){const push=usePushNotifications();if(!push.supported)return null;return <button type="button" title={push.enabled?'Disable notifications':'Enable notifications'} onClick={()=>void(push.enabled?push.disable():push.enable())} className="fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-panel shadow-sm md:right-6">{push.enabled?<Bell size={18}/>:<BellOff size={18}/>}</button>;}
