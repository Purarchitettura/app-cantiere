const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const source=html.slice(html.indexOf('  async function openSingleCamera()'),html.indexOf('  let unsubscribeSync = null;'));
let tests=0;
async function scenario(){
 const nodes=[],shots=[];let stopped=0,saved=0,failCapture=false,failSave=false,releaseSave=null,fallback=0;
 class Element{constructor(tag,attrs={},kids=[]){this.tag=tag;this.attrs=attrs;this.children=kids.flat();this.style={};this.videoWidth=1600;this.videoHeight=1200;this.value=attrs.value;this.textContent=kids.filter(x=>typeof x==='string').join('');nodes.push(this);}append(...kids){this.children.push(...kids);}replaceChildren(...kids){this.children=kids;}remove(){this.removed=true;}play(){return Promise.resolve();}}
 const track={stop(){stopped++;},getSettings:()=>({deviceId:'main'})};
 const ctx={point:null,shots,h:(tag,attrs,...kids)=>new Element(tag,attrs||{},kids),icon:()=>'',Settings:{get:()=>({})},PhotoQuality:{cameraConstraints:()=>({video:true})},CameraPhoto:{zoomRange:()=>null,zoom:async(_,v)=>({value:v,digital:v}),capture:async()=>{if(failCapture)throw Error('Prova errore');return {type:'image/jpeg'};}},navigator:{mediaDevices:{getUserMedia:async()=>({getVideoTracks:()=>[track],getTracks:()=>[track]}),enumerateDevices:async()=>[]}},document:{body:new Element('body')},toast(){},take:async()=>{fallback++;},File:class{constructor(parts,name,options){this.type=options.type;}},saveFiles:async()=>{saved++;if(releaseSave)await new Promise(r=>releaseSave=r);if(!failSave)shots.push({id:'test'});}};
 vm.createContext(ctx);vm.runInContext(source+'\nthis.open=openSingleCamera;this.getStop=()=>cameraStop;',ctx);
 await ctx.open();await Promise.resolve();await Promise.resolve();
 const overlay=nodes.find(n=>n.attrs.class==='fc-camera-overlay'),shutter=nodes.find(n=>n.tag==='button'&&n.textContent==='Scatta');
 assert.ok(overlay);assert.ok(shutter);assert.equal(saved,0);tests++;
 failCapture=true;await shutter.onclick();assert.equal(saved,0);assert.ok(!overlay.removed);assert.equal(shutter.disabled,false);tests++;
 failCapture=false;failSave=true;await shutter.onclick();assert.equal(saved,1);assert.ok(!overlay.removed);assert.equal(stopped,0);tests++;
 failSave=false;releaseSave=true;
 const pending=shutter.onclick();await Promise.resolve();await Promise.resolve();
 assert.equal(shutter.disabled,true);await shutter.onclick();assert.equal(saved,2);tests++;
 releaseSave();await pending;
 assert.equal(shots.length,1);assert.equal(saved,2);assert.equal(stopped,1);assert.equal(overlay.removed,true);assert.equal(ctx.getStop(),null);tests++;
 assert.equal(fallback,0);tests++;
 await ctx.open();await Promise.resolve();await Promise.resolve();
 ctx.getStop()();assert.equal(stopped,2);assert.equal(saved,2);tests++;
 ctx.navigator.mediaDevices={};await ctx.open();assert.equal(fallback,1);tests++;
 assert.ok(!html.includes('Fotocamera continua'));assert.ok(!html.includes('liveBtn'));tests++;
 const button=html.match(/const camBtn = [^\n]+/)[0];assert.match(button,/onclick: openSingleCamera/);assert.doesNotMatch(button,/take\(true\)/);tests++;
 console.log('PASS: '+tests+' verifiche scatto singolo, salvataggio diretto, chiusura, errori, doppio clic e fallback.');
}
scenario().catch(e=>{console.error(e);process.exitCode=1;});
