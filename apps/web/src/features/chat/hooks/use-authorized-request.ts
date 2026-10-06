'use client';
import { useCallback } from 'react';
import { apiClient,ApiError } from '@/src/lib/api-client';
import { refreshAuthSession } from '@/src/lib/auth-session';
import { useAuthStore } from '@/src/store/auth.store';

export function useAuthorizedRequest(){
  return useCallback(async<T,>(path:string,options:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown;responseSchema?:{parse:(value:unknown)=>T}}={}):Promise<T>=>{
    const execute=(token?:string)=>apiClient<T>(path,{...options,token});
    try{return await execute(useAuthStore.getState().token??undefined);}catch(error){
      if(!(error instanceof ApiError)||error.status!==401)throw error;
      try{const refreshed=await refreshAuthSession();return await execute(refreshed.tokens.accessToken);}catch(refreshError){throw refreshError;}
    }
  },[]);
}
