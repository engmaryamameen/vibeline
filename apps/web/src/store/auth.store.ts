import { create } from 'zustand';
import type { User } from '@vibeline/contracts';
type AuthState={token:string|null;currentUser:User|null;hasHydrated:boolean;setSession:(p:{token:string;currentUser:User})=>void;clearSession:()=>void;setHasHydrated:(v:boolean)=>void};
export const useAuthStore=create<AuthState>((set)=>({token:null,currentUser:null,hasHydrated:true,setSession:({token,currentUser})=>set({token,currentUser}),clearSession:()=>set({token:null,currentUser:null}),setHasHydrated:(hasHydrated)=>set({hasHydrated})}));
