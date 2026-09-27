import { z } from 'zod';
export const userSearchQuerySchema=z.object({q:z.string().trim().min(2).max(100)});
export const userSearchResultSchema=z.object({id:z.string().uuid(),email:z.string().email(),displayName:z.string(),avatarUrl:z.string().nullish().transform(v=>v??undefined)});
export type UserSearchResult=z.infer<typeof userSearchResultSchema>;
export const userSearchResponseSchema=z.object({users:z.array(userSearchResultSchema)});
