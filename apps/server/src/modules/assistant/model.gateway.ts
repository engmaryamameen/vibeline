export type ModelContextMessage={role:'developer'|'user'|'assistant';content:string};
export type ModelGeneration={text:string;provider:string;model:string;inputTokens?:number;outputTokens?:number;totalTokens?:number};
export interface ModelGateway{generate(input:{messages:ModelContextMessage[];signal:AbortSignal}):Promise<ModelGeneration>;}
