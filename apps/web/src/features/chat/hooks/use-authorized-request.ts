'use client';
import { useCallback } from 'react';
import type { AuthSessionResponse } from '@vibeline/contracts';
import { apiClient,ApiError } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/store/auth.store';

export function useAuthorizedRequest(){
  const clearSession=useAuthStore(s=>s.clearSession);
  return useCallback(async<T,>(path:string,options:{method?:'GET'|'POST'|'PATCH'|'DELETE';body?:unknown;responseSchema?:{parse:(value:unknown)=>T}}={}):Promise<T>=>{
    const execute=(token?:string)=>apiClient<T>(path,{...options,token});
    try{return await execute(useAuthStore.getState().token??undefined);}catch(error){
      if(!(error instanceof ApiError)||error.status!==401)throw error;
      try{const refreshed=await apiClient<AuthSessionResponse>('/auth/refresh',{method:'POST'});useAuthStore.getState().setSession({token:refreshed.tokens.accessToken,currentUser:refreshed.user});return await execute(refreshed.tokens.accessToken);}catch(refreshError){clearSession();throw refreshError;}
    }
  },[clearSession]);
}
