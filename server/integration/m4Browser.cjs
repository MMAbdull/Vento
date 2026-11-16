// Temporary loopback-only test UI. Not mounted in the product application.
const { approvedUri } = require('./m4Guard.cjs');
const uri = approvedUri(process.env.VENTO_M4_TEST_URI);
const mongoose = require('mongoose');
const http = require('node:http');
const { randomBytes } = require('node:crypto');
const { createApp } = require('../app');
const { IDLE_MS } = require('../services/sessionPolicy');
let now = Date.now();
const html = `<!doctype html><html lang="en"><title>Vento isolated security verification</title>
<h1>Vento isolated security verification</h1><p>Synthetic local data only. No product UI.</p>
<button id="register">Create synthetic account</button><button id="me">Check session</button>
<button id="csrf">Check rejected CSRF</button><button id="logout">Log out</button>
<button id="expire">Advance isolated clock seven days</button><button id="login">Reauthenticate synthetic account</button>
<button id="httpOnly">Check HttpOnly visibility</button><pre id="result" role="status"></pre>
<script>
(()=>{let csrf='',email='',password=''; const out=document.querySelector('#result');
async function call(route,method='GET',body={},bad=false){const r=await fetch('http://127.0.0.1:38149/api/auth/'+route,{method,credentials:'include',headers:method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-Token':bad?'invalid':csrf},body:method==='GET'?undefined:JSON.stringify(body)});const d=await r.json();if(d.csrfToken)csrf=d.csrfToken;return r.status;}
async function run(action,fn){out.textContent='Running '+action;try{const status=await fn();out.textContent=JSON.stringify({action,status});}catch{out.textContent=JSON.stringify({action,networkRejected:true});}}
document.querySelector('#register').onclick=()=>run('register',async()=>{email='browser-'+crypto.randomUUID()+'@example.invalid';password=crypto.randomUUID()+crypto.randomUUID();await call('csrf');return call('register','POST',{name:'Synthetic browser owner',email,password});});
document.querySelector('#me').onclick=()=>run('session',()=>call('me'));
document.querySelector('#csrf').onclick=()=>run('invalid-csrf',async()=>{await call('csrf');return call('activity','POST',{},true);});
document.querySelector('#logout').onclick=()=>run('logout',async()=>{await call('csrf');return call('logout','POST');});
document.querySelector('#expire').onclick=()=>run('advance-clock',async()=>{const r=await fetch('/advance',{method:'POST'});return r.status;});
document.querySelector('#login').onclick=()=>run('reauthenticate',async()=>{if(!email)return 'no-in-memory-fixture';await call('csrf');return call('login','POST',{email,password});});
document.querySelector('#httpOnly').onclick=()=>{out.textContent=JSON.stringify({action:'httpOnly',sessionCookieVisible:document.cookie.includes('vento.sid.dev=')});};
run('initial-session',()=>call('me'));
})();</script></html>`;
(async () => {
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 2000 });
  const app = createApp({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name,
    secret: randomBytes(48).toString('hex'), origins: ['http://127.0.0.1:38148'], production: false, clock: () => now });
  app.listen(38149, '127.0.0.1');
  http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/advance' && req.method === 'POST' && req.headers.origin === 'http://127.0.0.1:38148') {
      now += IDLE_MS; res.writeHead(200).end(); return;
    }
    if (req.method !== 'GET' || req.url !== '/') { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
  }).listen(38148, '127.0.0.1', () => console.log('Isolated browser harness ready on loopback ports 38148/38149'));
})().catch(() => { console.error('Isolated browser harness startup failed'); process.exitCode = 1; });
