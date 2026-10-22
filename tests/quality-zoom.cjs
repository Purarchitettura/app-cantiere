const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const plain=x=>JSON.parse(JSON.stringify(x));let tests=0;
async function main(){
  let saved='{}';
  const qualitySource=html.slice(html.indexOf('const PhotoQuality = {'),html.indexOf('/* ---------- archivio sul dispositivo'));
  const qctx={localStorage:{getItem:()=>saved,setItem:(_,v)=>{saved=v;}}};
  vm.createContext(qctx);vm.runInContext(qualitySource+'\nthis.settings=Settings;this.quality=PhotoQuality;',qctx);
  assert.equal(qctx.settings.get().latoMax,4096);assert.equal(qctx.settings.get().qualita,0.96);tests++;
  saved=JSON.stringify({latoMax:2048,qualita:0.85,firma:'Firma da conservare',perPage:6});
  const upgraded=qctx.settings.get();assert.equal(upgraded.latoMax,4096);assert.equal(upgraded.firma,'Firma da conservare');assert.equal(upgraded.perPage,6);tests++;
  qctx.settings.set({latoMax:1600,qualita:0.92});assert.equal(qctx.settings.get().latoMax,1600);tests++;
  assert.equal(qctx.quality.jpegQuality(0),0.98);assert.equal(qctx.quality.jpegQuality(4096),0.96);tests++;
  const constraints=qctx.quality.cameraConstraints({latoMax:4096});assert.equal(constraints.video.width.ideal,4096);assert.equal(constraints.video.height.ideal,3072);assert.equal(constraints.audio,false);tests++;
  let canvas,qualityUsed,closed=0;
  const resizeSource=html.slice(html.indexOf('async function resizeToJpeg('),html.indexOf('async function pdfPageToJpeg('));
  const rctx={decodeImage:async()=>({width:5000,height:3750,close:()=>closed++}),imgSize:im=>({w:im.width,h:im.height}),document:{createElement:()=>canvas={getContext:()=>({fillRect(){},drawImage(){}})}},canvasToBlob:async(c,type,q)=>{qualityUsed=q;return {type};}};
  vm.createContext(rctx);vm.runInContext(resizeSource+'\nthis.size=imageExportSize;this.resize=resizeToJpeg;',rctx);
  assert.deepEqual(plain(rctx.size(5000,3750,4096)),{w:4096,h:3072});tests++;
  assert.deepEqual(plain(rctx.size(3750,5000,4096)),{w:3072,h:4096});tests++;
  assert.deepEqual(plain(rctx.size(5000,3750,0)),{w:5000,h:3750});tests++;
  assert.deepEqual(plain(rctx.size(800,600,4096)),{w:800,h:600});tests++;
  const resized=await rctx.resize({},4096,0.96);assert.equal(resized.w,4096);assert.equal(canvas.height,3072);assert.equal(qualityUsed,0.96);assert.equal(closed,1);tests++;
  // Esegue i gestori reali di PlanView in un DOM minimo: nessun evento sintetico nella pagina utente.
  const nodes=[];
  class Element{
    constructor(tag,attrs={},children=[]){this.tag=tag;this.attrs=attrs;this.style={};this.dataset={};this.listeners={};this.scrollLeft=0;this.scrollTop=0;this.clientHeight=300;this.naturalWidth=1000;this.naturalHeight=1000;this.children=children.flat().filter(x=>x!=null);nodes.push(this);}
    get clientWidth(){return parseFloat(this.style.width)||400;}
    getBoundingClientRect(){
      if(this.attrs.class==='plan-stage'){const width=this.clientWidth,height=width;const s=nodes.find(n=>n.attrs.class==='plan-scroll');return {left:Math.max(0,(400-width)/2)-s.scrollLeft,top:Math.max(0,(300-height)/2)-s.scrollTop,width,height};}
      return {left:0,top:0,width:400,height:300};
    }
    addEventListener(name,fn,opts){(this.listeners[name]??=[]).push({fn,opts});}
    append(...kids){this.children.push(...kids);}
    replaceChildren(...kids){this.children=kids;}
    setAttribute(k,v){this.attrs[k]=v;}
    fire(name,details={}){const e={cancelable:true,touches:[],preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.immediateStopped=true;},...details};for(const {fn} of this.listeners[name]||[])fn(e);return e;}
  }
  let disconnected=false,taps=0;
  const ctx={h:(tag,attrs,...kids)=>new Element(tag,attrs||{},kids),sv:(tag,attrs,...kids)=>new Element(tag,attrs||{},kids),icon:x=>x,Store:{fullURL:async()=> 'blob:test'},requestAnimationFrame:fn=>fn(),ResizeObserver:class{observe(){}disconnect(){disconnected=true;}}};
  const planSource=html.slice(html.indexOf('function PlanView('),html.indexOf('/* ---------- Accesso ---------- */'));
  vm.createContext(ctx);vm.runInContext(planSource+'\nthis.create=PlanView;',ctx);
  const view=ctx.create({pianta:{id:'test'},interactive:true,onTap:()=>taps++});
  const image=nodes.find(n=>n.tag==='img'),scroller=nodes.find(n=>n.attrs.class==='plan-scroll'),stage=nodes.find(n=>n.attrs.class==='plan-stage');
  image.fire('load');assert.equal(stage.style.width,'300px');tests++;
  const point=(x,y)=>({clientX:x,clientY:y});
  const start=scroller.fire('touchstart',{touches:[point(150,150),point(250,150)]});
  assert.equal(start.defaultPrevented,true);assert.equal(scroller.listeners.touchstart[0].opts.passive,false);tests++;
  const move=scroller.fire('touchmove',{touches:[point(100,150),point(300,150)]});
  assert.equal(move.defaultPrevented,true);assert.equal(view.el.dataset.zoom,'2');assert.equal(stage.style.width,'600px');assert.equal(view.el.getBoundingClientRect().width,400);tests++;
  const anchored=stage.getBoundingClientRect();assert.equal(anchored.left+anchored.width/2,200);assert.equal(anchored.top+anchored.height/2,150);tests++;
  const cancelClick=scroller.fire('click');assert.equal(cancelClick.defaultPrevented,true);assert.equal(taps,0);tests++;
  scroller.fire('touchend');scroller.fire('touchstart',{touches:[point(200,150)]});
  const left=scroller.scrollLeft;const drag=scroller.fire('touchmove',{touches:[point(160,120)]});
  assert.equal(drag.defaultPrevented,true);assert.equal(scroller.scrollLeft,left+40);tests++;
  scroller.fire('touchend');scroller.fire('touchstart',{touches:[point(200,150)]});
  assert.equal(scroller.fire('click').defaultPrevented,undefined);image.fire('click',{clientX:200,clientY:150});assert.equal(taps,1);tests++;
  const wheel=scroller.fire('wheel',{ctrlKey:true,deltaY:-200,clientX:200,clientY:150});assert.equal(wheel.defaultPrevented,true);assert.ok(+view.el.dataset.zoom>2);tests++;
  assert.equal(scroller.fire('wheel',{ctrlKey:false,deltaY:10}).defaultPrevented,undefined);tests++;
  scroller.fire('touchcancel');scroller.fire('gesturestart',{clientX:200,clientY:150});
  const before=+view.el.dataset.zoom;const gesture=scroller.fire('gesturechange',{scale:1.2,clientX:200,clientY:150});assert.equal(gesture.defaultPrevented,true);assert.ok(+view.el.dataset.zoom>before);tests++;
  scroller.fire('gestureend');scroller.fire('wheel',{ctrlKey:true,deltaY:-99999,clientX:200,clientY:150});assert.equal(+view.el.dataset.zoom,10);tests++;
  scroller.fire('wheel',{ctrlKey:true,deltaY:99999,clientX:200,clientY:150});assert.equal(+view.el.dataset.zoom,1);tests++;
  view.destroy();assert.equal(disconnected,true);tests++;
  assert.match(html,/\.plan-scroll\s*\{[^}]*touch-action:\s*none/);assert.match(html,/\.plan-scroll\s*\{[^}]*overscroll-behavior:\s*contain/);assert.doesNotMatch(html,/user-scalable=no|maximum-scale=1/);tests++;
  console.log(`PASS: ${tests} verifiche qualità foto, zoom confinato, trascinamento e tocchi.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
