const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
let tests=0;
async function main(){
 const helper=html.slice(html.indexOf('const DrivePhoto = {'),html.indexOf('/* ---------- archivio di prova'));
 let canvas,encoded=[],closed=0,sizeFor=()=>2000000;
 const image={width:6000,height:4000,close:()=>closed++};
 const ctx={decodeImage:async()=>image,imgSize:im=>({w:im.width,h:im.height}),document:{createElement:()=>canvas={getContext:()=>({fillRect(){},drawImage(im){assert.equal(im,image);}})}},canvasToBlob:async(c,type,q)=>{encoded.push({w:c.width,h:c.height,q});return {size:sizeFor(c,q),type};}};
 vm.createContext(ctx);vm.runInContext(helper+'\nthis.photo=DrivePhoto;',ctx);const photo=ctx.photo;
 const exact={size:1500000};assert.equal(await photo.prepare(exact),exact);assert.equal(encoded.length,0);tests++;
 sizeFor=(c,q)=>q<=0.88?1499999:1800000;const original={size:18000000};
 let small=await photo.prepare(original);assert.equal(small.size,1499999);assert.equal(original.size,18000000);assert.equal(encoded[0].w,4096);assert.equal(closed,1);tests++;
 encoded=[];sizeFor=(c,q)=>c.width<=3276&&q<=0.82?1500000:3000000;
 small=await photo.prepare(original);assert.equal(small.size,1500000);assert.ok(encoded.some(c=>c.w<4096));assert.equal(closed,2);tests++;
 sizeFor=()=>2000000;await assert.rejects(()=>photo.prepare(original),/entro 1,5 MB/);assert.equal(closed,3);tests++;
 ctx.canvasToBlob=async()=>{throw Error('codec');};await assert.rejects(()=>photo.prepare(original),/codec/);assert.equal(closed,4);tests++;

 const db=new Map(),key=(s,k)=>s+'|'+k;let email='one@example.test',uploads=[],found=[],prepared=0;
 const compressed={size:1400000,type:'image/jpeg'},high={size:9000000,type:'image/jpeg'};
 const idb={get:async(s,k)=>db.get(key(s,k)),put:async(s,k,v)=>db.set(key(s,k),v),del:async(s,k)=>db.delete(key(s,k)),keys:async s=>[...db.keys()].filter(k=>k.startsWith(s+'|')).map(k=>k.slice(s.length+1)),all:async s=>[...db.entries()].filter(([k])=>k.startsWith(s+'|')).map(([k,v])=>[k.slice(s.length+1),v])};
 const sctx={MODE:'drive',TMP:'tmp~',IDB:idb,Access:{email:()=>email},DrivePhoto:{MAX_BYTES:1500000,prepare:async b=>{assert.equal(b,high);prepared++;return compressed;}},URL:{createObjectURL:b=>'blob:'+b.size,revokeObjectURL(){}},console};
 const storeSource=html.slice(html.indexOf('const Store = {'),html.indexOf('/* ---------- foto: numerazione'));
 vm.createContext(sctx);vm.runInContext(storeSource+'\nthis.store=Store;',sctx);const store=sctx.store;
 store.backend={list:async()=>found,create:async(kind,parent,data,b)=>{assert.ok(b.size<=1500000);uploads.push(b);return {id:'remote',kind,data,parentId:parent};},getBlob:async()=>compressed,remove:async()=>{}};
 const op={type:'create',kind:'foto',parentId:'group',tempId:'tmp~photo',hasBlob:true,data:{photoUid:'photo-uid'}};
 await idb.put('blobs','q:'+op.tempId,high);assert.equal(await store.getBlob({id:op.tempId,kind:'foto',data:op.data}),high);tests++;
 await store.runOp(op);assert.equal(uploads.length,1);assert.equal(uploads[0],compressed);assert.equal(await idb.get('blobs','h:one@example.test:photo-uid'),high);assert.equal(await idb.get('blobs','q:'+op.tempId),undefined);tests++;
 const ent={id:'remote',kind:'foto',data:op.data};assert.equal(await store.getBlob(ent),high);assert.equal(await store.getBlob({id:op.tempId,kind:'foto',data:op.data}),high);tests++;
 assert.equal(await store.fullURL(ent),'blob:9000000');tests++;
 await idb.put('blobs','t:remote',{size:30000});await store.clearCache();assert.equal(await idb.get('blobs','c:remote'),undefined);assert.equal(await idb.get('blobs','t:remote'),undefined);assert.equal(await store.getBlob(ent),high);tests++;
 email='two@example.test';assert.equal(await store.getBlob(ent),compressed);tests++;
 email='one@example.test';assert.equal(await store.getBlob(ent),high);tests++;
 // Retry idempotente: non carica di nuovo e non sostituisce l'originale con la copia ridotta.
 found=[ent];await idb.put('blobs','q:'+op.tempId,high);const before=prepared;await store.runOp(op);assert.equal(uploads.length,1);assert.equal(prepared,before);assert.equal(await store.getBlob(ent),high);tests++;
 found=[];sctx.DrivePhoto.prepare=async()=>({size:1500001});await idb.put('blobs','q:'+op.tempId,high);
 await assert.rejects(()=>store.runOp(op),/caricamento bloccato/);assert.equal(uploads.length,1);assert.equal(await idb.get('blobs','q:'+op.tempId),high);tests++;
 sctx.DrivePhoto.prepare=async()=>{throw Error('compressione fallita');};await assert.rejects(()=>store.runOp(op),/compressione fallita/);assert.equal(await idb.get('blobs','q:'+op.tempId),high);tests++;
 await store.runOp({type:'remove',kind:'foto',id:'remote',originalKey:'h:one@example.test:photo-uid'});assert.equal(await idb.get('blobs','h:one@example.test:photo-uid'),undefined);tests++;
 // Anche chiamando direttamente il backend, un file oltre soglia è respinto prima della rete.
 const driveSource=html.slice(html.indexOf('const Drive = {'),html.indexOf('/* La copia Drive'));
 const dctx={DrivePhoto:{MAX_BYTES:1500000}};vm.createContext(dctx);vm.runInContext(driveSource+'\nthis.drive=Drive;',dctx);
 await assert.rejects(()=>dctx.drive.create('foto','group',{}, {size:1500001}),/caricamento bloccato/);tests++;
 assert.match(html,/resizeToJpeg\(files\[i\], 0, 1\)/);assert.match(html,/new File\(\[await Store.getBlob\(f\)\]/);tests++;
 console.log('PASS: '+tests+' verifiche limite 1,5 MB, originali, esportazione, cache, account, retry e blocco upload.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
