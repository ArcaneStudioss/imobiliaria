'use strict';
// Testes de ponta a ponta: sobe o servidor numa pasta temporária e conversa com ele por HTTP.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'imob-teste-'));
process.env.DATA_DIR = DIR; process.env.SEM_BACKUP = '1'; process.env.SETUP_CODE = 'ABCDE12345';
const { servidor, db } = require('../server');
let base, cookie = '';

const pedir = async (metodo, caminho, corpo, extra = {}) => {
  const h = { ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extra };
  const r = await fetch(base + caminho, { method: metodo, headers: h, body: corpo !== undefined ? JSON.stringify(corpo) : undefined, redirect: 'manual' });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  const tipo = r.headers.get('content-type') || '';
  return { status: r.status, headers: r.headers, corpo: tipo.includes('json') ? await r.json() : await r.text() };
};
const admin = (m, c, b) => pedir(m, '/api/admin' + c, b, { 'X-Painel': '1' });

before(() => new Promise(ok => servidor.listen(0, () => { base = `http://127.0.0.1:${servidor.address().port}`; ok(); })));
after(() => { servidor.close(); db.close(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('páginas públicas respondem e têm o essencial para o Google', async () => {
  for (const p of ['/', '/imoveis', '/imoveis?finalidade=aluguel&tipo=casa', '/anunciar', '/favoritos', '/privacidade']) {
    const r = await pedir('GET', p); assert.equal(r.status, 200, p);
    assert.match(r.corpo, /<link rel="canonical"/); assert.match(r.corpo, /application\/ld\+json/);
    assert.ok(r.headers.get('content-security-policy').includes("script-src 'self'"));
  }
  const s = await pedir('GET', '/sitemap.xml'); assert.equal(s.status, 200); assert.match(s.corpo, /<loc>.*\/imovel\//);
  const rb = await pedir('GET', '/robots.txt'); assert.match(rb.corpo, /Disallow: \/painel/);
});

test('ficha do imóvel: galeria, dados estruturados e 404', async () => {
  const slug = db.prepare('SELECT slug FROM imoveis LIMIT 1').get().slug;
  const r = await pedir('GET', '/imovel/' + slug);
  assert.equal(r.status, 200); assert.match(r.corpo, /RealEstateListing/); assert.match(r.corpo, /data-abre-foto/);
  assert.equal((await pedir('GET', '/imovel/nao-existe')).status, 404);
  assert.equal((await pedir('GET', '/%E0%A4%A')).status, 400);
});

test('arquivos: não deixa sair da pasta pública nem expor dados', async () => {
  for (const p of ['/../server.js', '/..%2fserver.js', '/uploads/../site.db', '/src/db.js', '/.git/config', '/dados/site.db', '/painel/../server.js']) {
    const r = await pedir('GET', p); assert.ok([400, 404].includes(r.status), `${p} → ${r.status}`);
  }
  const red = await pedir('GET', '//evil.com/'); assert.ok(!String(red.headers.get('location') || '').startsWith('//'));
  const css = await pedir('GET', '/site.css?v=1'); assert.equal(css.status, 200); assert.match(css.headers.get('cache-control'), /immutable/);
});

test('contato: valida, ignora robôs e guarda o lead', async () => {
  const t = Date.now() - 10e3;
  let r = await pedir('POST', '/api/contato', { nome: 'A', telefone: '1', consentimento: true, t });
  assert.equal(r.status, 400); assert.equal(r.corpo.campo, 'nome');
  r = await pedir('POST', '/api/contato', { nome: 'Ana', telefone: '(55) 99999-1111', t });
  assert.equal(r.status, 400); assert.equal(r.corpo.campo, 'consentimento');
  const antes = db.prepare('SELECT COUNT(*) n FROM leads').get().n;
  r = await pedir('POST', '/api/contato', { nome: 'Robô', telefone: '(55) 99999-1111', consentimento: true, site: 'http://spam', t });
  assert.equal(r.status, 200); assert.equal(db.prepare('SELECT COUNT(*) n FROM leads').get().n, antes);
  r = await pedir('POST', '/api/contato', { origem: 'visita', nome: '<b>Ana</b>', telefone: '(55) 99999-1111', consentimento: true, imovel_id: 1, dados: { data: '2026-11-02', periodo: 'tarde', lixo: 'x' }, t });
  assert.equal(r.status, 201);
  const l = db.prepare('SELECT * FROM leads ORDER BY id DESC LIMIT 1').get();
  assert.equal(l.origem, 'visita'); assert.equal(l.imovel_id, 1); assert.deepEqual(JSON.parse(l.dados), { data: '2026-11-02', periodo: 'tarde' });
  r = await pedir('POST', '/api/contato', 'texto', { 'Content-Type': 'text/plain' }); assert.equal(r.status, 415);
});

test('painel: exige login e cabeçalho próprio', async () => {
  assert.equal((await admin('GET', '/imoveis')).status, 401);
  assert.equal((await pedir('POST', '/api/admin/entrar', { email: 'x@x.com', senha: 'x' })).status, 403);   // sem X-Painel
  const e = await admin('GET', '/estado'); assert.equal(e.corpo.instalado, false);
  assert.equal((await admin('POST', '/instalar', { codigo: 'ERRADO0000', nome: 'G', email: 'g@x.com', senha: 'uma frase segura' })).status, 403);
  assert.equal((await admin('POST', '/instalar', { codigo: 'ABCDE12345', nome: 'Gabi', email: 'g@x.com', senha: '123' })).corpo.campo, 'senha');
  const ok = await admin('POST', '/instalar', { codigo: 'ABCDE12345', nome: 'Gabi', email: 'g@x.com', senha: 'uma frase segura' });
  assert.equal(ok.status, 201); assert.match(ok.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal((await admin('POST', '/instalar', { codigo: 'ABCDE12345', nome: 'X', email: 'y@x.com', senha: 'uma frase segura' })).status, 409);
  const outro = await pedir('PUT', '/api/admin/config', { nome: 'X' }, { 'X-Painel': '1', Origin: 'https://site-malicioso.com' });
  assert.equal(outro.status, 403);
});

test('painel: imóvel, fotos com conferência de formato e escape no site', async () => {
  const im = await admin('POST', '/imoveis', { titulo: 'Casa <script>alert(1)</script> nova', finalidade: 'venda', tipo: 'casa', preco: '450.000', cidade: 'Santa Rosa', quartos: 3 });
  assert.equal(im.status, 201); assert.equal(im.corpo.preco, 450000);
  const falso = 'data:image/webp;base64,' + Buffer.from('<?php echo 1; ?>').toString('base64');
  assert.equal((await admin('POST', `/imoveis/${im.corpo.id}/fotos`, { grande: falso, pequena: falso })).status, 400);
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(20)]).toString('base64');
  const f = await admin('POST', `/imoveis/${im.corpo.id}/fotos`, { grande: 'data:image/webp;base64,' + webp, pequena: 'data:image/webp;base64,' + webp });
  assert.equal(f.status, 201); assert.match(f.corpo.grande, /^\/uploads\/[0-9a-f]{24}\.webp$/);
  assert.equal((await pedir('GET', f.corpo.grande)).status, 200);
  const pag = await pedir('GET', '/imovel/' + im.corpo.slug);
  assert.equal(pag.status, 200); assert.ok(!pag.corpo.includes('<script>alert(1)')); assert.match(pag.corpo, /&lt;script&gt;/);
  assert.equal((await admin('PUT', `/imoveis/${im.corpo.id}`, { titulo: 'Casa', video_url: 'https://evil.com/x' })).corpo.campo, 'video_url');
  await admin('DELETE', `/imoveis/${im.corpo.id}/fotos/${f.corpo.id}`);
  assert.equal((await pedir('GET', f.corpo.grande)).status, 404);
});

test('painel: configuração valida campos e só aceita imagens próprias', async () => {
  assert.equal((await admin('PUT', '/config', { ga4: 'UA-123' })).corpo.campo, 'ga4');
  const r = await admin('PUT', '/config', { whatsapp: '(55) 99999-0000', instagram: 'https://instagram.com/minha.imob', hero_img_1: 'https://evil.com/x.jpg', verificacao_google: '<meta name="google-site-verification" content="abc_123-XYZ" />' });
  assert.equal(r.status, 200); assert.equal(r.corpo.instagram, 'minha.imob'); assert.equal(r.corpo.hero_img_1, '/img/hero/cena1.webp'); assert.equal(r.corpo.verificacao_google, 'abc_123-XYZ');
  const home = await pedir('GET', '/'); assert.match(home.corpo, /wa\.me\/5555999990000/); assert.match(home.corpo, /google-site-verification" content="abc_123-XYZ"/);
});

test('login: senha errada é recusada e bloqueia depois de várias tentativas', async () => {
  cookie = '';
  for (let i = 0; i < 8; i++) assert.equal((await admin('POST', '/entrar', { email: 'g@x.com', senha: 'errada' + i })).status, 401);
  assert.equal((await admin('POST', '/entrar', { email: 'g@x.com', senha: 'uma frase segura' })).status, 429);
});

test('contatos exportados em planilha não executam fórmulas', async () => {
  cookie = '';
  const { criarSessoes } = require('../src/auth');
  const s = criarSessoes(db); const res = { setHeader: (k, v) => { cookie = String(v).split(';')[0]; } };
  s.criar({ headers: {}, socket: {} }, res, db.prepare('SELECT id FROM usuarios LIMIT 1').get().id);
  await pedir('POST', '/api/contato', { nome: '=HYPERLINK("x")', telefone: '(55) 99999-2222', consentimento: true, t: Date.now() - 9e3 }, { 'CF-Connecting-IP': '10.0.0.9' });
  const r = await pedir('GET', '/api/admin/leads.csv');
  assert.equal(r.status, 200); assert.match(r.corpo, /"'=HYPERLINK/);
});
