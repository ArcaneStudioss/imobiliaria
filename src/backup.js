'use strict';
// Backup do site: diário, consistente, verificado, criptografado e com cópia fora do servidor (S3 compatível).
// Sem dependências. Arquivo final: .sitebak = tar → gzip → AES-256-GCM. A chave fica em dados/backup/backup.key
// e DEVE ser guardada também fora do servidor (o painel mostra a chave de recuperação ao administrador).
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const https = require('node:https');
const http = require('node:http');
const { pipeline } = require('node:stream/promises');

const MAGIA = Buffer.from('SITBAK1\n');            // 8 bytes
const NOME_RE = /^site-backup-(\d{8})-(\d{6})\.sitebak$/;

/* ---------- tar (ustar) mínimo ---------- */
function cabecalhoTar(nome, tamanho, mtime) {
  const h = Buffer.alloc(512);
  h.write(nome, 0, 100, 'utf8'); h.write('0000644\0', 100); h.write('0000000\0', 108); h.write('0000000\0', 116);
  h.write(tamanho.toString(8).padStart(11, '0') + '\0', 124); h.write(Math.floor(mtime / 1000).toString(8).padStart(11, '0') + '\0', 136);
  h.write('        ', 148); h.write('0', 156); h.write('ustar\0', 257); h.write('00', 263);
  let soma = 0; for (const b of h) soma += b;
  h.write(soma.toString(8).padStart(6, '0') + '\0 ', 148);
  return h;
}
async function escreverTar(destino, arquivos) {            // arquivos: [{ nome, caminho }]
  const out = fs.createWriteStream(destino);
  const gravar = b => new Promise((ok, er) => out.write(b, e => e ? er(e) : ok()));
  for (const a of arquivos) {
    const st = fs.statSync(a.caminho);
    await gravar(cabecalhoTar(a.nome, st.size, st.mtimeMs));
    await new Promise((ok, er) => { const r = fs.createReadStream(a.caminho); r.on('data', c => { if (!out.write(c)) { r.pause(); out.once('drain', () => r.resume()); } }); r.on('end', ok); r.on('error', er); });
    const resto = (512 - (st.size % 512)) % 512; if (resto) await gravar(Buffer.alloc(resto));
  }
  await gravar(Buffer.alloc(1024));
  await new Promise(ok => out.end(ok));
}
function lerTar(arquivo, pastaDestino) {                    // extrai com validação de nome (sem '..', sem caminho absoluto)
  const buf = fs.readFileSync(arquivo); const extraidos = []; let pos = 0;
  while (pos + 512 <= buf.length) {
    const h = buf.subarray(pos, pos + 512); if (h.every(b => b === 0)) break;
    const nome = h.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const tam = parseInt(h.subarray(124, 135).toString('ascii').trim() || '0', 8);
    if (!/^[\w./-]+$/.test(nome) || nome.startsWith('/') || nome.split('/').includes('..')) throw new Error('nome inválido dentro do backup: ' + nome);
    const dest = path.join(pastaDestino, nome); fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf.subarray(pos + 512, pos + 512 + tam)); extraidos.push(nome);
    pos += 512 + Math.ceil(tam / 512) * 512;
  }
  return extraidos;
}

/* ---------- criptografia ---------- */
async function cifrar(origem, destino, chave) {              // origem: caminho do .tar.gz
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', chave, iv);
  const out = fs.createWriteStream(destino); out.write(Buffer.concat([MAGIA, iv]));
  await pipeline(fs.createReadStream(origem), c, out, { end: false });
  out.write(c.getAuthTag()); await new Promise(ok => out.end(ok));
}
async function decifrar(origem, destino, chave) {
  const fd = fs.openSync(origem, 'r'); const tam = fs.fstatSync(fd).size; const cab = Buffer.alloc(20), tag = Buffer.alloc(16);
  fs.readSync(fd, cab, 0, 20, 0); fs.readSync(fd, tag, 0, 16, tam - 16); fs.closeSync(fd);
  if (!cab.subarray(0, 8).equals(MAGIA)) throw new Error('arquivo não é um backup deste site');
  const d = crypto.createDecipheriv('aes-256-gcm', chave, cab.subarray(8, 20)); d.setAuthTag(tag);
  await pipeline(fs.createReadStream(origem, { start: 20, end: tam - 17 }), d, fs.createWriteStream(destino));
}
const sha256Arquivo = caminho => new Promise((ok, er) => { const h = crypto.createHash('sha256'); fs.createReadStream(caminho).on('data', c => h.update(c)).on('end', () => ok(h.digest('hex'))).on('error', er); });

/* ---------- AWS Signature V4 (S3 e compatíveis: Cloudflare R2, Backblaze B2, MinIO) ---------- */
const hmac = (k, v) => crypto.createHmac('sha256', k).update(v).digest();
function sigv4({ metodo, host, caminho, query = '', headers = {}, payloadHash, regiao, servico = 's3', chaveId, segredo, dataISO }) {
  const amzdata = dataISO || new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');   // 20130524T000000Z
  const dia = amzdata.slice(0, 8);
  const h = { ...headers, host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzdata };
  const nomes = Object.keys(h).map(k => k.toLowerCase()).sort();
  const canonCab = nomes.map(k => `${k}:${String(Object.entries(h).find(([x]) => x.toLowerCase() === k)[1]).trim()}\n`).join('');
  const assinados = nomes.join(';');
  const canon = [metodo, caminho, query, canonCab, assinados, payloadHash].join('\n');
  const escopo = `${dia}/${regiao}/${servico}/aws4_request`;
  const aAssinar = ['AWS4-HMAC-SHA256', amzdata, escopo, crypto.createHash('sha256').update(canon).digest('hex')].join('\n');
  const kS = hmac(hmac(hmac(hmac('AWS4' + segredo, dia), regiao), servico), 'aws4_request');
  const assinatura = crypto.createHmac('sha256', kS).update(aAssinar).digest('hex');
  return { assinatura, headers: { ...h, authorization: `AWS4-HMAC-SHA256 Credential=${chaveId}/${escopo}, SignedHeaders=${assinados}, Signature=${assinatura}` } };
}
const codificaS3 = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
async function enviarS3(cfg, chaveObjeto, arquivo, { tipo = 'application/octet-stream' } = {}) {
  const u = new URL(cfg.endpoint);
  if (u.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(u.hostname)) throw new Error('o endereço do armazenamento precisa ser https://');
  const st = fs.statSync(arquivo), hash = await sha256Arquivo(arquivo);
  const caminho = `${u.pathname.replace(/\/$/, '')}/${codificaS3(cfg.bucket)}/${chaveObjeto.split('/').map(codificaS3).join('/')}`;
  const { headers } = sigv4({ metodo: 'PUT', host: u.host, caminho, headers: { 'content-length': st.size, 'content-type': tipo }, payloadHash: hash, regiao: cfg.regiao || 'auto', chaveId: cfg.chaveId, segredo: cfg.segredo });
  const cliente = u.protocol === 'https:' ? https : http;
  return new Promise((ok, falha) => {
    const req = cliente.request({ method: 'PUT', hostname: u.hostname, port: u.port || undefined, path: caminho, headers, timeout: 120e3 }, res => {
      const partes = []; res.on('data', c => partes.push(c)); res.on('end', () => (res.statusCode >= 200 && res.statusCode < 300) ? ok(true) : falha(new Error(`armazenamento respondeu ${res.statusCode}`)));
    });
    req.on('timeout', () => req.destroy(new Error('tempo esgotado ao enviar'))); req.on('error', falha);
    fs.createReadStream(arquivo).on('error', falha).pipe(req);
  });
}

/* ---------- retenção: 7 diários + 4 semanais + 6 mensais ---------- */
function quaisManter(nomes, hoje = new Date()) {
  const info = nomes.map(n => { const m = NOME_RE.exec(n); return m ? { n, dia: m[1], quando: m[1] + m[2] } : null; }).filter(Boolean).sort((a, b) => b.quando.localeCompare(a.quando));
  const manter = new Set(), semanas = new Set(), meses = new Set(), dias = new Set();
  const dt = d => new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00Z`);
  const semanaDe = d => String(Math.floor((dt(d).getTime() / 864e5 + 3) / 7));
  for (const i of info) { // um por dia nos 7 dias mais recentes
    if (!dias.has(i.dia) && dias.size < 7) { dias.add(i.dia); manter.add(i.n); }
  }
  for (const i of info) { const s = semanaDe(i.dia); if (!semanas.has(s) && semanas.size < 4 + 1) { semanas.add(s); manter.add(i.n); } }
  for (const i of info) { const m = i.dia.slice(0, 6); if (!meses.has(m) && meses.size < 6) { meses.add(m); manter.add(i.n); } }
  if (info[0]) manter.add(info[0].n);                       // o mais recente nunca é apagado
  return { manter: [...manter], apagar: info.map(i => i.n).filter(n => !manter.has(n)) };
}

/* ---------- gerenciador ---------- */
function criarBackup({ dir, bancos, log = console, agora = () => new Date() }) {
  const pasta = path.join(dir, 'backup'), pastaArquivos = path.join(pasta, 'arquivos');
  const arqChave = path.join(pasta, 'backup.key'), arqStatus = path.join(pasta, 'status.json'), arqOffsite = path.join(pasta, 'offsite.json');
  fs.mkdirSync(pastaArquivos, { recursive: true, mode: 0o700 });
  let rodando = false;
  const ler = (f, padrao) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return padrao; } };
  const gravar = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2), { mode: 0o600 });
  function chave() {
    if (!fs.existsSync(arqChave)) fs.writeFileSync(arqChave, crypto.randomBytes(32).toString('base64url'), { mode: 0o600 });
    return Buffer.from(fs.readFileSync(arqChave, 'utf8').trim(), 'base64url');
  }
  const chaveTexto = () => chave().toString('base64url');
  function offsiteCfg() {
    const e = process.env, f = ler(arqOffsite, {});
    const c = { endpoint: e.BACKUP_S3_ENDPOINT || f.endpoint, bucket: e.BACKUP_S3_BUCKET || f.bucket, regiao: e.BACKUP_S3_REGIAO || f.regiao || 'auto', prefixo: e.BACKUP_S3_PREFIXO ?? f.prefixo ?? 'site/', chaveId: e.BACKUP_S3_CHAVE_ID || f.chaveId, segredo: e.BACKUP_S3_SEGREDO || f.segredo };
    return c.endpoint && c.bucket && c.chaveId && c.segredo ? c : null;
  }
  const status = () => ler(arqStatus, { ultimo: null, offsite: null });
  function listar() {
    return fs.readdirSync(pastaArquivos).filter(n => NOME_RE.test(n)).sort().reverse().map(n => { const st = fs.statSync(path.join(pastaArquivos, n)); const m = NOME_RE.exec(n); return { nome: n, id: `${m[1]}-${m[2]}`, bytes: st.size, quando: new Date(`${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}T${m[2].slice(0, 2)}:${m[2].slice(2, 4)}:${m[2].slice(4, 6)}Z`).toISOString() }; });
  }
  const caminhoPorId = id => /^\d{8}-\d{6}$/.test(String(id)) ? (p => fs.existsSync(p) ? p : null)(path.join(pastaArquivos, `site-backup-${id}.sitebak`)) : null;

  async function executar({ motivo = 'manual' } = {}) {
    if (rodando) throw new Error('já existe um backup em andamento');
    rodando = true; const t0 = Date.now(), d = agora();
    const carimbo = d.toISOString().replace(/[-:]|\.\d{3}Z/g, '').replace('T', '-');          // 20261002-031500
    const tmp = path.join(pasta, `.tmp-${carimbo}`); fs.mkdirSync(tmp, { recursive: true });
    const st = status();
    try {
      // 1) cópias consistentes (VACUUM INTO funciona com o banco em uso) + verificação de integridade
      const { DatabaseSync } = require('node:sqlite'); const itens = [];
      const bancosAlvo = [['site.db', bancos.site]];
      for (const [nome, db] of bancosAlvo) {
        const dest = path.join(tmp, nome); fs.mkdirSync(path.dirname(dest), { recursive: true });
        db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
        const c = new DatabaseSync(dest, { readOnly: true }); const r = c.prepare('PRAGMA integrity_check').get(); const versao = (c.prepare('SELECT v FROM _versao').get() || {}).v; c.close();
        if (Object.values(r)[0] !== 'ok') throw new Error('verificação de integridade falhou em ' + nome);
        itens.push({ nome, caminho: dest, bytes: fs.statSync(dest).size, sha256: await sha256Arquivo(dest), esquema: versao });
      }
      // fotos enviadas pelo painel (o banco só guarda o caminho)
      const pastaUp = path.join(dir, 'uploads'), fotos = [];
      if (fs.existsSync(pastaUp)) for (const f of fs.readdirSync(pastaUp)) if (/^[\w.-]+$/.test(f) && fs.statSync(path.join(pastaUp, f)).isFile()) fotos.push({ nome: `uploads/${f}`, caminho: path.join(pastaUp, f) });
      const manifesto = { fotos: fotos.length, formato: 'site-imobiliaria-backup/1', criado_em: d.toISOString(), motivo, bancos: itens.map(i => ({ nome: i.nome, bytes: i.bytes, sha256: i.sha256, esquema: i.esquema })) };
      const arqManifesto = path.join(tmp, 'manifesto.json'); fs.writeFileSync(arqManifesto, JSON.stringify(manifesto, null, 2));
      // 2) tar → gzip → AES-256-GCM
      const tar = path.join(tmp, 'pacote.tar'), tgz = path.join(tmp, 'pacote.tar.gz');
      await escreverTar(tar, [{ nome: 'manifesto.json', caminho: arqManifesto }, ...itens.map(i => ({ nome: i.nome, caminho: i.caminho })), ...fotos]);
      await pipeline(fs.createReadStream(tar), zlib.createGzip({ level: 9 }), fs.createWriteStream(tgz));
      const nomeFinal = `site-backup-${carimbo}.sitebak`, final = path.join(pastaArquivos, nomeFinal);
      await cifrar(tgz, final + '.parcial', chave()); fs.renameSync(final + '.parcial', final);
      // 3) confere que o arquivo gerado abre com a chave (decifra e lê o manifesto)
      const prova = path.join(tmp, 'prova.tgz'); await decifrar(final, prova, chave());
      const ok = zlib.gunzipSync(fs.readFileSync(prova)).length > 0; if (!ok) throw new Error('arquivo gerado não abriu');
      const resumo = { quando: d.toISOString(), ok: true, arquivo: nomeFinal, bytes: fs.statSync(final).size, bancos: itens.length, ms: Date.now() - t0, motivo, erro: null };
      st.ultimo = resumo; gravar(arqStatus, st);
      // 4) retenção local
      const { apagar } = quaisManter(fs.readdirSync(pastaArquivos), d); for (const n of apagar) fs.rmSync(path.join(pastaArquivos, n), { force: true });
      // 5) cópia fora do servidor
      const cfg = offsiteCfg();
      if (cfg) {
        try { await enviarS3(cfg, `${cfg.prefixo || ''}${nomeFinal}`, final); st.offsite = { quando: agora().toISOString(), ok: true, arquivo: nomeFinal, erro: null }; }
        catch (e) { st.offsite = { quando: agora().toISOString(), ok: false, arquivo: nomeFinal, erro: String(e.message).slice(0, 200) }; log.error('[backup] falha ao enviar para fora do servidor:', e.message); }
        gravar(arqStatus, st);
      }
      log.log(`[backup] ok: ${nomeFinal} (${resumo.bytes} bytes, ${itens.length} bancos, ${resumo.ms} ms)${cfg ? ' · fora do servidor: ' + (st.offsite.ok ? 'ok' : 'FALHOU') : ' · sem cópia fora do servidor'}`);
      return { ...resumo, offsite: st.offsite };
    } catch (e) {
      st.ultimo = { quando: d.toISOString(), ok: false, arquivo: null, bytes: 0, bancos: 0, ms: Date.now() - t0, motivo, erro: String(e.message).slice(0, 300) }; gravar(arqStatus, st);
      log.error('[backup] FALHOU:', e.message); throw e;
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); rodando = false; }
  }
  function salvarOffsite(c) {
    const novo = { endpoint: String(c.endpoint || '').trim().replace(/\/$/, ''), bucket: String(c.bucket || '').trim(), regiao: String(c.regiao || 'auto').trim(), prefixo: String(c.prefixo ?? 'site/').trim(), chaveId: String(c.chaveId || '').trim(), segredo: String(c.segredo || '').trim() };
    const atual = ler(arqOffsite, {}); if (!novo.segredo && atual.segredo) novo.segredo = atual.segredo; if (novo.chaveId === '__manter__' && atual.chaveId) novo.chaveId = atual.chaveId;   // deixar em branco mantém o segredo atual
    if (!/^https:\/\/[\w.-]+(:\d+)?(\/.*)?$/.test(novo.endpoint) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/.test(novo.endpoint)) throw new Error('endereço inválido (use https://...)');
    if (!/^[\w.-]{3,63}$/.test(novo.bucket)) throw new Error('nome do bucket inválido');
    if (!/^[\w./-]{0,100}$/.test(novo.prefixo) || novo.prefixo.includes('..')) throw new Error('prefixo inválido');
    if (!novo.chaveId || !novo.segredo) throw new Error('informe a chave de acesso e o segredo');
    gravar(arqOffsite, novo);
  }
  async function testarOffsite() {
    const cfg = offsiteCfg(); if (!cfg) throw new Error('armazenamento externo não configurado');
    const t = path.join(pasta, '.teste'); fs.writeFileSync(t, `teste de conexao ${new Date().toISOString()}\n`);
    try { await enviarS3(cfg, `${cfg.prefixo || ''}teste-conexao.txt`, t, { tipo: 'text/plain' }); } finally { fs.rmSync(t, { force: true }); }
    return true;
  }
  const configPublica = () => { const c = offsiteCfg(); return c ? { configurado: true, endpoint: c.endpoint, bucket: c.bucket, regiao: c.regiao, prefixo: c.prefixo, chaveId: c.chaveId.slice(0, 4) + '…' + c.chaveId.slice(-3), origem: process.env.BACKUP_S3_ENDPOINT ? 'variáveis de ambiente' : 'painel' } : { configurado: false }; };

  // agenda: roda uma vez por dia (a partir das 03h de Brasília) e, se o último backup bom tem mais de 26 h, na hora
  function agendar() {
    const checar = () => {
      if (rodando) return; const u = status().ultimo, idade = u && u.ok ? Date.now() - Date.parse(u.quando) : Infinity, hora = agora().getUTCHours();
      if (idade > 26 * 36e5 || (idade > 20 * 36e5 && hora >= 6)) executar({ motivo: 'agendado' }).catch(() => {});
    };
    setTimeout(checar, 90e3).unref(); setInterval(checar, 10 * 60e3).unref();
  }
  return { executar, listar, status, caminhoPorId, chaveTexto, salvarOffsite, testarOffsite, configPublica, agendar, pasta };
}

module.exports = { criarBackup, quaisManter, sigv4, enviarS3, cifrar, decifrar, escreverTar, lerTar, sha256Arquivo, NOME_RE };
