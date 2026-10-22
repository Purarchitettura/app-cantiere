const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const source=html.slice(html.indexOf('const Nav = {'),html.indexOf('function AppBar('));
let tests=0,shown='',destroyed=[],created=[],queue=[],historyItems=[null,null],position=1,goCalls=0;
const events={},touchEvents={};
const win={scrollY:0,addEventListener:(n,fn)=>events[n]=fn,scrollTo:(_,v)=>win.scrollY=v};
const history={get state(){return historyItems[position];},pushState(s){historyItems.splice(position+1);historyItems.push(s);position++;},replaceState(s){historyItems[position]=s;},go(delta){assert.notEqual(delta,0,'history.go(0) ricaricherebbe la pagina');goCalls++;queue.push(()=>{const next=position+delta;if(next>=0&&next<historyItems.length){position=next;events.popstate({state:history.state});}});}};
const ctx={window:win,history,document:{addEventListener:(n,fn)=>touchEvents[n]=fn},location:{pathname:'/app/',search:''},paintChips(){},$:()=>({replaceChildren:el=>shown=el}),Date,Math};
vm.createContext(ctx);vm.runInContext(source+'\nthis.nav=Nav;',ctx);const nav=ctx.nav;
const view=name=>()=>{created.push(name);return {el:name,route:{name},destroy:()=>destroyed.push(name)};};
function flush(){let limit=40;while(queue.length){if(!--limit)throw Error('Cronologia in ciclo');queue.shift()();}}
function native(delta){history.go(delta);flush();}
function emit(name,details={}){const e={touches:[],changedTouches:[],target:{closest:()=>null},cancelable:true,preventDefault(){this.prevented=true;},...details};touchEvents[name](e);return e;}
function swipe(x=5,y=100,endX=110,endY=105,target=null){emit('touchstart',{touches:[{clientX:x,clientY:y}],...(target?{target}: {})});emit('touchmove',{touches:[{clientX:endX,clientY:endY}]});emit('touchend',{changedTouches:[{clientX:endX,clientY:endY}]});flush();}
nav.reset(view('Home'));assert.equal(shown,'Home');assert.equal(position,1);tests++;
nav.push(view('Cantiere'));win.scrollY=120;nav.push(view('Gruppo'));assert.equal(shown,'Gruppo');assert.equal(nav.stack.length,3);tests++;
native(-1);assert.equal(shown,'Cantiere');assert.equal(win.scrollY,120);assert.ok(destroyed.includes('Gruppo'));tests++;
nav.back();nav.back();flush();assert.equal(shown,'Home');assert.equal(nav.stack.length,1);tests++;
const rootCalls=goCalls;nav.back();assert.equal(goCalls,rootCalls);tests++;
native(1);native(1);assert.equal(shown,'Gruppo');assert.equal(created.filter(n=>n==='Gruppo').length,2);tests++;
native(-1);nav.push(view('Impostazioni'));native(1);assert.equal(shown,'Impostazioni');assert.equal(nav.entries.length,3);tests++;
let closed=0;nav.openLayer(()=>closed++);native(-1);assert.equal(closed,1);assert.equal(shown,'Impostazioni');assert.equal(nav.stack.length,3);tests++;
native(1);assert.equal(shown,'Impostazioni');assert.equal(closed,1);assert.equal(nav.index,2);tests++;
const layer=nav.openLayer(()=>closed++);nav.closeLayer(layer,()=>closed+=10);flush();assert.equal(closed,11);assert.equal(nav.index,2);tests++;
const busy=nav.openLayer(()=>closed++,false);native(-1);assert.equal(nav.index,3);assert.equal(busy.active,true);assert.equal(closed,11);tests++;
nav.closeLayer(busy,()=>closed+=100);flush();assert.equal(nav.index,2);assert.equal(closed,111);tests++;
const preparation=nav.openLayer(()=>{},false);nav.closeLayer(preparation,()=>{});let promptClosed=0;
const prompt=nav.openLayer(()=>promptClosed++);assert.equal(prompt.waiting,true);flush();assert.equal(prompt.waiting,false);assert.equal(nav.index,3);
native(-1);assert.equal(promptClosed,1);assert.equal(nav.index,2);tests++;
const parent=nav.openLayer(()=>closed++),child=nav.openLayer(()=>closed++,false);
nav.closeLayer(child,()=>closed+=1000);nav.closeLayer(parent,()=>closed+=10000);flush();assert.equal(nav.index,2);assert.equal(closed,11111);tests++;
nav.reset(view('Home'));nav.pushMany([view('Cantiere'),view('Gruppo')]);native(-1);assert.equal(shown,'Cantiere');native(-1);assert.equal(shown,'Home');tests++;
nav.push(view('Dettagli'));swipe();assert.equal(shown,'Home');tests++;
nav.push(view('Dettagli'));swipe(120);assert.equal(shown,'Dettagli');tests++;
swipe(5,100,100,240);assert.equal(shown,'Dettagli');tests++;
swipe(5,100,110,105,{closest:()=>({className:'plan'})});assert.equal(shown,'Dettagli');tests++;
swipe(5,100,110,105,{closest:()=>({tagName:'INPUT'})});assert.equal(shown,'Dettagli');tests++;
emit('touchstart',{touches:[{clientX:5,clientY:100}]});emit('touchmove',{touches:[{clientX:50,clientY:100},{clientX:90,clientY:100}]});emit('touchend',{changedTouches:[{clientX:110,clientY:100}]});flush();assert.equal(shown,'Dettagli');tests++;
emit('touchstart',{touches:[{clientX:5,clientY:100}]});emit('touchcancel');emit('touchend',{changedTouches:[{clientX:110,clientY:100}]});flush();assert.equal(shown,'Dettagli');tests++;
emit('touchstart',{touches:[{clientX:5,clientY:100}]});const moved=emit('touchmove',{touches:[{clientX:50,clientY:102}]});assert.equal(moved.prevented,true);native(-1);emit('touchend',{changedTouches:[{clientX:110,clientY:100}]});flush();assert.equal(shown,'Home');assert.equal(nav.index,0);tests++;
nav.push(view('Privato'));nav.reset(view('Login'));native(-1);assert.equal(shown,'Login');assert.equal(nav.stack.length,1);tests++;
nav.push(view('Accesso'));let cameraClosed=0;nav.openLayer(()=>cameraClosed++);nav.reset(view('Login'));assert.equal(cameraClosed,1);assert.equal(shown,'Login');tests++;
assert.match(html,/navLayer = Nav\.openLayer\(finishCamera\)/);assert.match(html,/Nav\.closeLayer\(navLayer, finishCamera\)/);tests++;
console.log('PASS: '+tests+' verifiche cronologia, Indietro/Avanti, dialoghi, fotocamera, reset accesso e gesto laterale.');
