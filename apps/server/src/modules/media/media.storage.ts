import { mkdir,readFile,unlink,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(process.cwd(),process.env.MEDIA_STORAGE_DIR||'.data/media');
export const mediaStorage={
 async put(key:string,data:Buffer){await mkdir(root,{recursive:true});await writeFile(resolve(root,key),data,{flag:'wx'});},
 async get(key:string){return readFile(resolve(root,key));},
 async delete(key:string){await unlink(resolve(root,key)).catch(()=>undefined);}
};
