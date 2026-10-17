export type ModelContextMessage={role:'developer'|'user'|'assistant';content:string};
export type ModelProviderDescriptor={provider:string;model:string};
export type ModelGeneration={text:string;provider:string;model:string;inputTokens?:number;outputTokens?:number;totalTokens?:number};
export interface ModelGateway{
  describe():ModelProviderDescriptor;
  generate(input:{messages:ModelContextMessage[];signal:AbortSignal}):Promise<ModelGeneration>;
}
