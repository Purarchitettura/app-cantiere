const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const source=html.slice(html.indexOf('function groupPoints('),html.lastIndexOf('/*',html.indexOf('function toast(')));
const marks=[],texts=[];let pages=0;
class PdfMock {
 constructor(){this.pages=[];}
 addPage(){this.p={};this.pages.push(this.p);pages++;}
 text(t,x,y){texts.push(String(t));assert.ok(y<=289,'testo oltre margine inferiore');}
 wrap(t,w){return String(t).match(new RegExp('.{1,'+Math.floor(w/2)+'}','g'))||[''];}
 line(){} rect(){} image(){} addJpeg(){return{};} output(){return new Blob([texts.join('\n')]);}
}
const ctx={console,Blob,TextEncoder,DataView,Uint8Array,Map,Set,Math,Date,Store:{same:(a,b)=>a===b,getBlob:async()=>new Blob(['jpeg'])},fmtDay:x=>x||'',fmtDateTime:()=> '10/11/2026 10:00',todayISO:()=> 'FINAL_DATE_SENTINEL',pad:n=>String(n).padStart(2,'0'),rangeLabel:a=>a.join(', '),decodeImage:async()=>({width:1200,height:800}),imgSize:im=>({w:im.width,h:im.height}),canvasToBlob:async()=>new Blob(['jpeg']),resizeToJpeg:async()=>({blob:new Blob(['jpeg']),w:1200,h:800}),document:{createElement:()=>({getContext:()=>({fillRect(){},drawImage(){},beginPath(){},arc(){marks.push('dot');},fill(){},stroke(){},measureText:t=>({width:t.length*8}),fillText:t=>marks.push(t)})})}};
vm.createContext(ctx);vm.runInContext(source+'\nthis.reportPoints=reportPoints;this.drawPinsCanvas=drawPinsCanvas;this.buildReport=buildReport;this.buildDocx=buildDocx;',ctx);
// Replace lexical PDFDoc only in this isolated context; no application state is used.
ctx.PdfMock=PdfMock;vm.runInContext('PDFDoc = PdfMock;',ctx);
const photo=(n,x=.2,y=.3,ang=0)=>({id:'f'+n,n,reference:String(n),data:{pianta:'p',x,y,ang,autore:'AUTHOR_SENTINEL',nota:'Nota preservata',taken:'2026-11-10'}});
const fotos=[photo(1),photo(2,.201,.301,90),photo(3,.8,.8,180),{id:'f4',n:4,data:{autore:'AUTHOR_SENTINEL'}}];fotos[1].reference='2 · duplicate';
async function main(){
 const pts=ctx.reportPoints(fotos,'p');assert.equal(pts.length,2);assert.equal(pts[0].pointLabel,'P1');assert.deepEqual(Array.from(pts[0].nums),['1','2 · duplicate']);assert.equal(ctx.reportPoints(fotos,'other').length,0);
 const args={cant:{data:{nome:'Test'}},grp:{data:{titolo:'Prova',data:'2026-11-10'}},fotos,piante:[{id:'p',data:{label:'Piano'}}],perPage:4,withPlans:true,redattore:'Redattore',intestazione:'Studio'};
 await ctx.buildReport(args);assert.equal(pages,2,'nessuna pagina per firma');assert.ok(texts.includes('P1 - Foto n. 1, 2 · duplicate'));assert.ok(texts.includes('P2 - Foto n. 3'));assert.ok(!texts.join('\n').includes('AUTHOR_SENTINEL'));assert.ok(!texts.join('\n').includes('Il tecnico'));assert.ok(!texts.join('\n').includes('FINAL_DATE_SENTINEL'));assert.equal(marks.filter(x=>x==='dot').length,2);assert.deepEqual(marks.filter(x=>/^P\d/.test(x)),['P1','P2']);
 const docx=Buffer.from(await (await ctx.buildDocx(args)).arrayBuffer());let at=0,xml='';while(docx.readUInt32LE(at)===0x04034b50){const size=docx.readUInt32LE(at+18),n=docx.readUInt16LE(at+26),e=docx.readUInt16LE(at+28),name=docx.subarray(at+30,at+30+n).toString(),start=at+30+n+e;if(name==='word/document.xml')xml=docx.subarray(start,start+size).toString();at=start+size;}
 assert.ok(xml.includes('P1 - Foto n. 1, 2 · duplicate'));assert.ok(xml.includes('P2 - Foto n. 3'));assert.ok(xml.includes('Nota preservata'));assert.ok(xml.includes('Senza punto su planimetria'));for(const s of ['AUTHOR_SENTINEL','Il tecnico','FINAL_DATE_SENTINEL','________________','freccia ='])assert.ok(!xml.includes(s));
 for(const perPage of [2,4,6]){texts.length=0;pages=0;await ctx.buildReport({...args,withPlans:false,perPage,fotos:Array.from({length:perPage},(_,i)=>photo(i+1))});assert.equal(pages,2,'nessuna pagina finale aggiuntiva');}
 texts.length=0;pages=0;await ctx.buildReport({...args,fotos:[],withPlans:false});assert.equal(pages,1);
 console.log('PASS: legenda per punto, direzioni aggregate, riferimenti duplicati, foto senza punto, PDF/Word senza autore o firma/data finali, impaginazioni 2/4/6 e rapporto vuoto.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
