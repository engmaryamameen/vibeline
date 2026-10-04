import { apiErrorResponseSchema } from '@vibeline/contracts';
import { env } from './env';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export class ApiError extends Error {
  constructor(public readonly status:number,message:string,public readonly code?:string){super(message);this.name='ApiError';}
}
type ResponseSchema<T>={parse:(value:unknown)=>T};
type RequestOptions<T>={method?:HttpMethod;body?:unknown;token?:string;responseSchema?:ResponseSchema<T>};
export async function apiClient<T=unknown>(path:string,options:RequestOptions<T>={}):Promise<T>{
  const hasBody=options.body!==undefined;
  const response=await fetch(`${env.apiBaseUrl}${path}`,{method:options.method??'GET',headers:{...(hasBody?{'content-type':'application/json'}:{}),...(options.token?{authorization:`Bearer ${options.token}`}:{})},body:hasBody?JSON.stringify(options.body):undefined,credentials:'include',cache:'no-store'});
  if(!response.ok){const raw=await response.json().catch(()=>null);const parsed=apiErrorResponseSchema.safeParse(raw);throw new ApiError(response.status,parsed.success?parsed.data.message:'Request failed',parsed.success?parsed.data.code:undefined);}
  if(response.status===204)return undefined as T;
  const payload:unknown=await response.json();
  return options.responseSchema?options.responseSchema.parse(payload):payload as T;
}
