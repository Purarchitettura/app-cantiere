const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {Blob,File}=require('node:buffer');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');let tests=0;
async function main(){
 const crc=html.slice(html.indexOf('const CRC_TABLE ='),html.indexOf('// ZIP senza compressione'));
 const source=html.slice(html.indexOf('const PhotoBatch = {'),html.indexOf('/* ---------- foto: numerazione'));
 let received=null;const ctx={Blob,TextEncoder,navigator:{share:files=>{received=files;return Promise.resolve();},canShare:payload=>payload.files.length===3}};
 vm.createContext(ctx);vm.runInContext(crc+source+'\nthis.batch=PhotoBatch;this.crc=crc32;',ctx);const batch=ctx.batch;
 const bytes=Buffer.alloc(2097200);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;
 const files=[new File([bytes],'foto-à.jpg',{type:'image/jpeg'}),new File(['seconda'],'foto-2.jpg',{type:'image/jpeg'}),new File([],'vuota.jpg',{type:'image/jpeg'})];
 assert.equal(batch.canShare(files),true);assert.equal(batch.canShare(files.slice(0,1)),false);tests++;
 const sharing=batch.share(files);assert.equal(received.files,files);await sharing;tests++;
 ctx.navigator.canShare=()=>{throw Error('unsupported');};assert.equal(batch.canShare(files),false);tests++;
 ctx.navigator.share=()=>Promise.reject(Object.assign(Error('blocked'),{name:'NotAllowedError'}));await assert.rejects(()=>batch.share(files),/blocked/);tests++;
 const zip=await batch.zip(files);assert.equal(zip.type,'application/zip');const data=Buffer.from(await zip.arrayBuffer());let p=0,index=0;
 while(data.readUInt32LE(p)===0x04034b50){const length=data.readUInt32LE(p+18),nameLen=data.readUInt16LE(p+26),extra=data.readUInt16LE(p+28);assert.equal(data.readUInt16LE(p+8),0);const name=data.subarray(p+30,p+30+nameLen).toString('utf8');assert.equal(name,files[index].name);const body=data.subarray(p+30+nameLen+extra,p+30+nameLen+extra+length);assert.deepEqual(body,Buffer.from(await files[index].arrayBuffer()));assert.equal(data.readUInt32LE(p+14),ctx.crc(body));p+=30+nameLen+extra+length;index++;tests++;}
 assert.equal(index,3);assert.equal(data.readUInt32LE(p),0x02014b50);assert.equal(data.readUInt32LE(data.length-22),0x06054b50);assert.equal(data.readUInt16LE(data.length-12),3);tests++;
 await assert.rejects(()=>batch.zip([]),/Numero di foto/);tests++;
 await assert.rejects(()=>batch.zip([{size:4294967296}]),/troppo grande/);tests++;
 assert.match(html,/if \(fotos\?\.length\) items.push/);assert.match(html,/PhotoBatch.canShare\(files\)/);assert.match(html,/Salvataggio multiplo non riuscito/);assert.match(html,/button.textContent = 'Scarica ZIP'/);tests++;
 console.log('PASS: '+tests+' verifiche salvataggio multiplo, errori visibili e ZIP con byte/CRC originali.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
