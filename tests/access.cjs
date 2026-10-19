const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script);
const source = html.slice(html.indexOf('const Access = {'), html.indexOf('/* ---------- utilità ---------- */'));
let checked = 0;
function context(mode = 'drive') {
  const cached = new Map();
  const ctx = {
    MODE: mode, TMP: 'tmp~', ROOT_ID: 'root',
    CONFIG: { CANTIERE_CREATORS: ['contact@purarchitettura.it', 'geometrailariocorro@gmail.com'], CANTIERE_ACCESS: {'collaboratore@example.test':['site']} },
    Auth: { user: { email: 'contact@purarchitettura.it', readonly: false }, save() {} },
    Store: {
      resolve: id => id, isTemp: id => id.startsWith('tmp~'), same: (a, b) => a === b,
      net: fn => fn(), cachedList: async () => cached.get('list:cantiere:root') || [],
    },
    Drive: { folderInfo: async () => ({ capabilities: { canAddChildren: true } }), rootInfo: async () => null, list: async () => [{id:'site',canAddChildren:true}] },
    IDB: { get: async (_, key) => cached.get(key), put: async (_, key, value) => cached.set(key, value) },
  };
  vm.createContext(ctx); vm.runInContext(source + '\nthis.access = Access;', ctx);
  ctx.access.setSites([{id:'site'}]);
  return { ctx, access: ctx.access, cached };
}
async function main() {
  const { ctx, access, cached } = context();
  for (const email of ['contact@purarchitettura.it', 'geometrailariocorro@gmail.com', ' CONTACT@PURARCHITETTURA.IT ']) {
    ctx.Auth.user = { email, readonly: false };
    assert.equal(access.canCreateCantiere(), true); checked++;
  }
  for (const user of [null, {email: '', readonly:false}, {email:'collaboratore@example.test',readonly:false}, {email:'contact@purarchitettura.it',readonly:true}, {email:'contact@purarchitettura.it'}]) {
    ctx.Auth.user = user; assert.equal(access.canCreateCantiere(),false);
    assert.throws(() => access.requireCantiereCreator()); checked++;
  }
  ctx.Auth.user = {email:'collaboratore@example.test',readonly:true};
  assert.equal(access.canWriteCantiere({id:'site',canAddChildren:true}),true); checked++;
  assert.equal(access.canWriteCantiere({id:'site',canAddChildren:false}),false); checked++;
  assert.equal(access.canWriteCantiere({id:'site'}),false); checked++;
  assert.equal(access.canCreateCantiere(),false); checked++;
  cached.set('list:cantiere:root',[{id:'site',canAddChildren:false}]);
  await access.requireGroupWriter('site');
  assert.equal(cached.get('list:cantiere:root')[0].canAddChildren,true); checked++;
  ctx.Drive.folderInfo = async () => ({capabilities:{canAddChildren:false}});
  await assert.rejects(access.requireGroupWriter('site'),/Editor/);
  assert.equal(cached.get('list:cantiere:root')[0].canAddChildren,false); checked++;
  ctx.Drive.folderInfo = async () => {throw Object.assign(new Error('offline'),{offline:true});};
  await assert.rejects(access.requireGroupWriter('site'),/Editor/); checked++;
  cached.set('list:cantiere:root',[{id:'site',canAddChildren:true}]);
  await access.requireGroupWriter('site'); checked++;
  await assert.rejects(access.requireGroupWriter('unknown'),/autorizzato/); checked++;
  await assert.rejects(access.requireGroupWriter('tmp~new'),/autorizzato/); checked++;
  ctx.Auth.user = {email:'contact@purarchitettura.it',readonly:false};
  await access.requireGroupWriter('tmp~new'); checked++;
  // Verifica i blocchi effettivi nei due percorsi di creazione, prima di scrivere o accodare.
  for (const name of ['Drive','Store']) {
    const block = html.slice(html.indexOf('const ' + name + ' = {'));
    const method = block.match(/  async create\(kind, parentId, data, blob\) \{([\s\S]*?)\n  \},/)[1];
    ctx.Auth.user = {email:'collaboratore@example.test',readonly:false};
    const create = vm.runInContext('(async function(kind,parentId,data,blob){' + method + '\n})',ctx);
    await assert.rejects(create('cantiere','root',{}),/abilitati/); checked++;
  }
  const demo = context('demo'); demo.ctx.Auth.user = null;
  assert.equal(demo.access.canCreateCantiere(),true);
  assert.equal(demo.access.canWriteCantiere({id:'site'}),true);
  await demo.access.requireGroupWriter('site'); checked++;
  // Assegnazione esplicita + accesso Drive verificato: servono entrambi.
  ctx.Auth.user = {email:'collaboratore@example.test',readonly:false};
  access.setSites([{id:'site'},{id:'other'}]);
  assert.equal(access.canReadCantiere({id:'site'}),true); checked++;
  assert.equal(access.canReadCantiere({id:'other'}),false); checked++;
  assert.equal(access.canWriteCantiere({id:'other',canAddChildren:true}),false); checked++;
  ctx.Auth.user.email = 'nonassegnato@example.test';
  assert.equal(access.canReadCantiere({id:'site'}),false); checked++;
  ctx.Auth.user.email = 'collaboratore@example.test';
  // Un account senza alcun accesso alla cartella archivio entra nel solo cantiere assegnato.
  await access.refreshSession();
  assert.equal(ctx.Auth.user.readonly,true);
  assert.equal(access.canReadCantiere({id:'site'}),true);
  assert.equal(access.canWriteCantiere({id:'site',canAddChildren:true}),true); checked++;
  ctx.Drive.list = async () => [];
  await access.refreshSession();
  assert.equal(access.canReadCantiere({id:'site'}),false); checked++;
  // Offline si riusa solo l'elenco dell'account corrente, senza quello globale precedente.
  ctx.Drive.rootInfo = async () => {throw Object.assign(new Error('offline'),{offline:true});};
  cached.set('access-sites:collaboratore@example.test',[{id:'site'},{id:'other'}]);
  await access.refreshSession();
  assert.equal(access.canReadCantiere({id:'site'}),true);
  assert.equal(access.canReadCantiere({id:'other'}),false); checked++;
  ctx.Auth.user.email = 'nuovo@example.test';
  await access.refreshSession();
  assert.equal(access.canReadCantiere({id:'site'}),false); checked++;
  ctx.Auth.user = {email:'collaboratore@example.test',readonly:true};
  access.setSites([{id:'site'}]);
  delete ctx.CONFIG.CANTIERE_ACCESS['collaboratore@example.test'];
  assert.equal(access.canReadCantiere({id:'site'}),false); checked++;
  ctx.CONFIG.CANTIERE_ACCESS['collaboratore@example.test'] = ['site'];
  // Il percorso di lettura Drive non enumera l'archivio di un collaboratore.
  const driveBlock = html.slice(html.indexOf('const Drive = {'));
  const driveListBody = driveBlock.match(/  async list\(kind, parentId\) \{([\s\S]*?)\n  \},/)[1];
  const driveList = vm.runInContext('(async function(kind,parentId){' + driveListBody + '\n})',ctx);
  let reads = [];
  const backend = {
    siteInfo: async id => {reads.push(id);return {id,mimeType:'application/vnd.google-apps.folder',appProperties:{fc:'cantiere'}};},
    toEnt: f => f,
    f: () => {throw new Error('Non deve enumerare tutti i cantieri');},
  };
  const assigned = await driveList.call(backend,'cantiere','root');
  assert.deepEqual(reads,['site']);assert.equal(assigned.length,1); checked++;
  backend.siteInfo = async () => null;
  assert.equal((await driveList.call(backend,'cantiere','root')).length,0); checked++;
  backend.siteInfo = async id => ({id,trashed:true,mimeType:'application/vnd.google-apps.folder',appProperties:{fc:'cantiere'}});
  assert.equal((await driveList.call(backend,'cantiere','root')).length,0); checked++;
  console.log(`PASS: sintassi JavaScript e ${checked} verifiche dei permessi.`);
}
main().catch(e => {console.error(e);process.exitCode=1;});
