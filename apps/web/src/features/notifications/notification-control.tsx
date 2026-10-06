
'use client';
import { Bell,BellOff } from 'lucide-react';
import { usePushNotifications } from './use-push-notifications';
export function NotificationControl(){const push=usePushNotifications();if(!push.supported)return null;return <button type="button" title={push.enabled?'Disable notifications':'Enable notifications'} onClick={()=>void(push.enabled?push.disable():push.enable())} className="fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center text-[#0584FE] transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0584FE]/30 md:right-6">{push.enabled?<Bell size={23} strokeWidth={2.4}/>:<BellOff size={23} strokeWidth={2.4}/>}</button>;}
