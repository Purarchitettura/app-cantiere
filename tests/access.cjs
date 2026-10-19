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
    CONFIG: { CANTIERE_CREATORS: ['contact@purarchitettura.it', 'geometrailariocorro@gmail.com'] },
    Auth: { user: { email: 'contact@purarchitettura.it', readonly: false } },
    Store: {
      resolve: id => id, isTemp: id => id.startsWith('tmp~'), same: (a, b) => a === b,
      net: fn => fn(), cachedList: async () => cached.get('list:cantiere:root') || [],
    },
    Drive: { folderInfo: async () => ({ capabilities: { canAddChildren: true } }) },
    IDB: { get: async (_, key) => cached.get(key), put: async (_, key, value) => cached.set(key, value) },
  };
  vm.createContext(ctx); vm.runInContext(source + '\nthis.access = Access;', ctx);
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
  await assert.rejects(access.requireGroupWriter('unknown'),/Editor/); checked++;
  await assert.rejects(access.requireGroupWriter('tmp~new'),/abilitati/); checked++;
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
  console.log(`PASS: sintassi JavaScript e ${checked} verifiche dei permessi.`);
}
main().catch(e => {console.error(e);process.exitCode=1;});
