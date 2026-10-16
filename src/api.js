'use strict';
// API: rotas públicas (/api/contato, /api/imoveis) e do painel (/api/admin/*).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { lerJson, limitador, ipDe, texto, inteiro, soDigitos, SITUACOES } = require('./util');
const { hashSenha, confereSenha, HASH_FALSO, senhaFraca, criarSessoes } = require('./auth');

class Erro extends Error { constructor(status, msg, campo) { super(msg); this.status = status; this.campo = campo; } }

function criarApi({ db, dir, imoveis, leads, config, backup, codigoInstalacao, cartaoHtml = () => '', log = console }) {
  const sessoes = criarSessoes(db);
  const pastaUp = path.join(dir, 'uploads'); fs.mkdirSync(pastaUp, { recursive: true });
  const limLogin = limitador({ max: 8, janelaMs: 15 * 60e3 });
  const limLead = limitador({ max: 6, janelaMs: 10 * 60e3 });
  const limUpload = limitador({ max: 400, janelaMs: 60 * 60e3 });

  const json = (res, status, obj) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  const instalado = () => !!db.prepare('SELECT 1 FROM usuarios LIMIT 1').get();

  /* ---------- imagens enviadas (já reduzidas no navegador) ---------- */
  function gravarImagem(base64, maxBytes) {
    const m = /^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(String(base64 || ''));
    if (!m) throw new Erro(400, 'Imagem inválida.');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > maxBytes) throw new Erro(413, 'Imagem grande demais.');
    const webp = buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP';
    const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!webp && !jpg && !png) throw new Erro(400, 'Formato de imagem não aceito.');
    const nome = crypto.randomBytes(12).toString('hex') + (webp ? '.webp' : jpg ? '.jpg' : '.png');
    fs.writeFileSync(path.join(pastaUp, nome), buf, { mode: 0o600 });
    return '/uploads/' + nome;
  }
  const apagarArquivo = url => { const m = /^\/uploads\/([\w]+\.(?:webp|jpg|png))$/.exec(String(url || '')); if (m) fs.rmSync(path.join(pastaUp, m[1]), { force: true }); };

  /* ---------- aviso de lead para automação (n8n, Make, Zapier...) ---------- */
  function avisarWebhook(lead) {
    const url = process.env.LEADS_WEBHOOK_URL;
    if (!url || !/^https:\/\//.test(url)) return;
    const corpo = JSON.stringify({ evento: 'novo_lead', ...lead });
    const cab = { 'Content-Type': 'application/json' };
    if (process.env.LEADS_WEBHOOK_SEGREDO) cab['X-Assinatura'] = crypto.createHmac('sha256', process.env.LEADS_WEBHOOK_SEGREDO).update(corpo).digest('hex');
    fetch(url, { method: 'POST', headers: cab, body: corpo, signal: AbortSignal.timeout(8000) }).catch(e => log.error('[lead] webhook falhou:', e.message));
  }

  /* ---------- públicas ---------- */
  async function contato(req, res) {
    const ip = ipDe(req);
    if (limLead.excedeu(ip)) throw new Erro(429, 'Recebemos várias mensagens seguidas. Tente de novo em alguns minutos ou chame no WhatsApp.');
    const d = await lerJson(req, 20e3);
    if (d.site) return json(res, 200, { ok: true });               // armadilha para robôs
    if (Number(d.t) && Date.now() - Number(d.t) < 2500) return json(res, 200, { ok: true });   // enviado rápido demais
    const origem = ['contato', 'visita', 'anunciar', 'whatsapp'].includes(d.origem) ? d.origem : 'contato';
    const nome = texto(d.nome, 80), telefone = texto(d.telefone, 30), email = texto(d.email, 120), mensagem = texto(d.mensagem, 2000);
    if (nome.length < 2) throw new Erro(400, 'Conte como podemos te chamar.', 'nome');
    if (soDigitos(telefone).length < 10) throw new Erro(400, 'Informe um telefone com DDD.', 'telefone');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Erro(400, 'Esse e-mail parece incompleto.', 'email');
    if (origem !== 'whatsapp' && !d.consentimento) throw new Erro(400, 'Precisamos da sua autorização para entrar em contato.', 'consentimento');
    let imovel = null;
    if (d.imovel_id) { imovel = imoveis.porId(inteiro(d.imovel_id)); if (!imovel || !imovel.publicado) imovel = null; }
    const dados = {};
    const extra = d.dados && typeof d.dados === 'object' ? d.dados : {};
    for (const k of ['data', 'periodo', 'tipo', 'finalidade', 'bairro', 'cidade', 'valor', 'quartos', 'area']) if (extra[k] != null) dados[k] = texto(extra[k], 120);
    limLead.registrar(ip);
    const id = leads.registrar({ origem, nome, telefone, email, mensagem, imovel_id: imovel?.id, dados });
    avisarWebhook({ id, origem, nome, telefone, email, mensagem, dados, imovel: imovel ? { codigo: imovel.codigo, titulo: imovel.titulo } : null, quando: new Date().toISOString() });
    json(res, 201, { ok: true });
  }

  function cartoes(req, res, url) {
    const ids = String(url.searchParams.get('ids') || '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 60);
    const r = imoveis.buscar({ ids, porPagina: 60, incluirFechados: true });
    json(res, 200, { itens: r.itens.map(i => ({ id: i.id, html: cartaoHtml(i) })) });
  }

  /* ---------- painel: autenticação ---------- */
  const exigeUsuario = req => { const u = sessoes.usuario(req); if (!u) throw new Erro(401, 'Entre de novo para continuar.'); return u; };

  async function instalar(req, res) {
    if (instalado()) throw new Erro(409, 'O painel já foi configurado.');
    const ip = ipDe(req); if (limLogin.excedeu('i:' + ip)) throw new Erro(429, 'Muitas tentativas. Espere 15 minutos.');
    const d = await lerJson(req, 10e3);
    const cod = Buffer.from(String(d.codigo || '').trim().toUpperCase()), certo = Buffer.from(codigoInstalacao());
    if (cod.length !== certo.length || !crypto.timingSafeEqual(cod, certo)) { limLogin.registrar('i:' + ip); throw new Erro(403, 'Código de instalação errado.', 'codigo'); }
    const nome = texto(d.nome, 80), email = texto(d.email, 120).toLowerCase();
    if (nome.length < 2) throw new Erro(400, 'Informe seu nome.', 'nome');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Erro(400, 'E-mail inválido.', 'email');
    const fraca = senhaFraca(d.senha, email); if (fraca) throw new Erro(400, fraca, 'senha');
    const r = db.prepare('INSERT INTO usuarios (email, nome, senha_hash, criado_em) VALUES (?,?,?,?)').run(email, nome, hashSenha(d.senha), new Date().toISOString());
    sessoes.criar(req, res, r.lastInsertRowid);
    log.log('[painel] administrador criado');
    json(res, 201, { ok: true });
  }

  async function entrar(req, res) {
    const ip = ipDe(req);
    const d = await lerJson(req, 10e3);
    const email = texto(d.email, 120).toLowerCase();
    if (limLogin.excedeu(ip) || limLogin.excedeu('e:' + email)) throw new Erro(429, 'Muitas tentativas. Espere 15 minutos e tente de novo.');
    const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    const ok = confereSenha(String(d.senha || ''), u ? u.senha_hash : HASH_FALSO) && !!u;
    if (!ok) { limLogin.registrar(ip); limLogin.registrar('e:' + email); throw new Erro(401, 'E-mail ou senha não conferem.'); }
    limLogin.limpar('e:' + email);
    db.prepare('UPDATE usuarios SET ultimo_login = ? WHERE id = ?').run(new Date().toISOString(), u.id);
    sessoes.criar(req, res, u.id);
    json(res, 200, { ok: true });
  }

  async function trocarSenha(req, res, u) {
    const d = await lerJson(req, 10e3);
    const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(u.id);
    if (limLogin.excedeu('s:' + u.id)) throw new Erro(429, 'Muitas tentativas. Espere 15 minutos.');
    if (!confereSenha(String(d.atual || ''), row.senha_hash)) { limLogin.registrar('s:' + u.id); throw new Erro(400, 'A senha atual não confere.', 'atual'); }
    const fraca = senhaFraca(d.nova, row.email); if (fraca) throw new Erro(400, fraca, 'nova');
    db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(hashSenha(d.nova), u.id);
    sessoes.encerrarOutras(u.id, u.sessao);
    json(res, 200, { ok: true });
  }

  /* ---------- painel: dados ---------- */
  function resumo(res) {
    const c = q => db.prepare(q).get().n;
    json(res, 200, {
      imoveis: c('SELECT COUNT(*) n FROM imoveis'), publicados: c('SELECT COUNT(*) n FROM imoveis WHERE publicado = 1'),
      exemplos: c('SELECT COUNT(*) n FROM imoveis WHERE exemplo = 1'), semFoto: c('SELECT COUNT(*) n FROM imoveis i WHERE NOT EXISTS (SELECT 1 FROM fotos f WHERE f.imovel_id = i.id)'),
      leadsNovos: c("SELECT COUNT(*) n FROM leads WHERE situacao = 'novo'"), leads30: c(`SELECT COUNT(*) n FROM leads WHERE criado_em > '${new Date(Date.now() - 30 * 864e5).toISOString()}'`),
      maisVistos: db.prepare('SELECT id, codigo, titulo, visitas FROM imoveis ORDER BY visitas DESC LIMIT 5').all(),
      ultimosLeads: leads.listar({}).itens.slice(0, 5),
      backup: backup.status().ultimo,
    });
  }

  async function rotaAdmin(req, res, url) {
    const p = url.pathname.slice('/api/admin'.length) || '/';
    const m = req.method;

    // proteção contra envio de outro site: cabeçalho próprio + mesma origem
    if (m !== 'GET' && m !== 'HEAD') {
      if (req.headers['x-painel'] !== '1') throw new Erro(403, 'Requisição recusada.');
      const o = req.headers.origin; let host = null; try { host = o ? new URL(o).host : req.headers.host; } catch {} if (host !== req.headers.host) throw new Erro(403, 'Origem recusada.');
    }

    if (p === '/estado' && m === 'GET') { const u = sessoes.usuario(req); return json(res, 200, { instalado: instalado(), usuario: u ? { nome: u.nome, email: u.email } : null, site: config.ler().nome }); }
    if (p === '/instalar' && m === 'POST') return instalar(req, res);
    if (p === '/entrar' && m === 'POST') return entrar(req, res);
    if (p === '/sair' && m === 'POST') { sessoes.encerrar(req, res); return json(res, 200, { ok: true }); }

    const u = exigeUsuario(req);
    let r;
    if (p === '/senha' && m === 'POST') return trocarSenha(req, res, u);
    if (p === '/resumo' && m === 'GET') return resumo(res);

    // imóveis
    if (p === '/imoveis' && m === 'GET') return json(res, 200, imoveis.buscar({ texto: url.searchParams.get('texto'), pagina: url.searchParams.get('pagina'), finalidade: url.searchParams.get('finalidade'), ordem: 'recentes', porPagina: 30 }, { admin: true }));
    if (p === '/imoveis' && m === 'POST') { const d = await lerJson(req, 60e3); return json(res, 201, imoveis.criar(d)); }
    if (p === '/exemplos' && m === 'DELETE') {
      const ex = db.prepare('SELECT id FROM imoveis WHERE exemplo = 1').all();
      for (const { id } of ex) { for (const f of imoveis.fotos(id)) { apagarArquivo(f.grande); apagarArquivo(f.pequena); } imoveis.apagar(id); }
      return json(res, 200, { apagados: ex.length });
    }
    if ((r = /^\/imoveis\/(\d+)$/.exec(p))) {
      const id = Number(r[1]);
      if (m === 'GET') { const im = imoveis.porId(id); if (!im) throw new Erro(404, 'Imóvel não encontrado.'); return json(res, 200, { ...im, fotos: imoveis.fotos(id) }); }
      if (m === 'PUT') { const d = await lerJson(req, 60e3); return json(res, 200, imoveis.atualizar(id, d)); }
      if (m === 'PATCH') { const d = await lerJson(req, 2e3); for (const k of ['destaque', 'publicado']) if (k in d) imoveis.alternar(id, k, d[k]); return json(res, 200, imoveis.porId(id)); }
      if (m === 'DELETE') { for (const f of imoveis.fotos(id)) { apagarArquivo(f.grande); apagarArquivo(f.pequena); } imoveis.apagar(id); return json(res, 200, { ok: true }); }
    }
    if ((r = /^\/imoveis\/(\d+)\/fotos$/.exec(p)) && m === 'POST') {
      const id = Number(r[1]); if (!imoveis.porId(id)) throw new Erro(404, 'Imóvel não encontrado.');
      if (limUpload.excedeu(u.id)) throw new Erro(429, 'Muitas fotos enviadas nesta hora. Espere um pouco.');
      if (imoveis.fotos(id).length >= 60) throw new Erro(400, 'Cada imóvel aceita até 60 fotos.');
      const d = await lerJson(req, 9e6);
      const grande = gravarImagem(d.grande, 4.5e6); let pequena;
      try { pequena = gravarImagem(d.pequena, 8e5); } catch (e) { apagarArquivo(grande); throw e; }
      limUpload.registrar(u.id);
      return json(res, 201, imoveis.adicionarFoto(id, { grande, pequena, largura: inteiro(d.largura, 1, 20000), altura: inteiro(d.altura, 1, 20000), legenda: d.legenda }));
    }
    if ((r = /^\/imoveis\/(\d+)\/fotos\/ordem$/.exec(p)) && m === 'PUT') { const d = await lerJson(req, 20e3); imoveis.ordenarFotos(Number(r[1]), Array.isArray(d.ids) ? d.ids.slice(0, 100) : []); return json(res, 200, imoveis.fotos(Number(r[1]))); }
    if ((r = /^\/imoveis\/(\d+)\/fotos\/(\d+)$/.exec(p))) {
      if (m === 'PATCH') { const d = await lerJson(req, 4e3); imoveis.legendaFoto(Number(r[1]), Number(r[2]), d.legenda); return json(res, 200, { ok: true }); }
      if (m === 'DELETE') { const f = imoveis.removerFoto(Number(r[1]), Number(r[2])); if (f) { apagarArquivo(f.grande); apagarArquivo(f.pequena); } return json(res, 200, { ok: true }); }
    }

    // leads
    if (p === '/leads' && m === 'GET') return json(res, 200, leads.listar({ situacao: url.searchParams.get('situacao') || undefined, origem: url.searchParams.get('origem') || undefined, pagina: inteiro(url.searchParams.get('pagina'), 1, 1000) || 1 }));
    if (p === '/leads.csv' && m === 'GET') {
      const linhas = db.prepare('SELECT l.criado_em, l.origem, l.situacao, l.nome, l.telefone, l.email, l.mensagem, i.codigo FROM leads l LEFT JOIN imoveis i ON i.id = l.imovel_id ORDER BY l.criado_em DESC').all();
      const cel = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
      const csv = '﻿Data;Origem;Situação;Nome;Telefone;E-mail;Mensagem;Imóvel\n' + linhas.map(l => [l.criado_em, l.origem, l.situacao, l.nome, l.telefone, l.email, l.mensagem, l.codigo].map(cel).join(';')).join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="contatos.csv"', 'Cache-Control': 'no-store' });
      return res.end(csv);
    }
    if ((r = /^\/leads\/(\d+)$/.exec(p))) {
      if (m === 'PATCH') { const d = await lerJson(req, 2e3); if (!['novo', 'em_atendimento', 'concluido', 'descartado'].includes(d.situacao)) throw new Erro(400, 'Situação inválida.'); leads.mudar(r[1], d.situacao); return json(res, 200, { ok: true }); }
      if (m === 'DELETE') { leads.apagar(r[1]); return json(res, 200, { ok: true }); }
    }

    // configuração do site
    if (p === '/config' && m === 'GET') return json(res, 200, config.ler());
    if (p === '/config' && m === 'PUT') { const d = await lerJson(req, 30e3); return json(res, 200, config.salvar(d)); }
    if (p === '/imagem' && m === 'POST') { const d = await lerJson(req, 7e6); return json(res, 201, { url: gravarImagem(d.dados, 5e6) }); }

    // backup
    if (p === '/backup' && m === 'GET') return json(res, 200, { status: backup.status(), arquivos: backup.listar().slice(0, 20), externo: backup.configPublica() });
    if (p === '/backup' && m === 'POST') return json(res, 201, await backup.executar({ motivo: 'manual' }));
    if ((r = /^\/backup\/(\d{8}-\d{6})$/.exec(p)) && m === 'GET') {
      const arq = backup.caminhoPorId(r[1]); if (!arq) throw new Erro(404, 'Backup não encontrado.');
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${path.basename(arq)}"`, 'Cache-Control': 'no-store' });
      return fs.createReadStream(arq).pipe(res);
    }
    if (p === '/backup/chave' && m === 'POST') {
      const d = await lerJson(req, 2e3); const row = db.prepare('SELECT senha_hash FROM usuarios WHERE id = ?').get(u.id);
      if (limLogin.excedeu('c:' + u.id)) throw new Erro(429, 'Muitas tentativas. Espere 15 minutos.');
      if (!confereSenha(String(d.senha || ''), row.senha_hash)) { limLogin.registrar('c:' + u.id); throw new Erro(400, 'Senha não confere.', 'senha'); }
      return json(res, 200, { chave: backup.chaveTexto() });
    }

    throw new Erro(404, 'Rota não encontrada.');
  }

  async function tratar(req, res, url) {
    try {
      if (url.pathname === '/api/contato' && req.method === 'POST') return await contato(req, res);
      if (url.pathname === '/api/imoveis' && req.method === 'GET') return cartoes(req, res, url);
      if (url.pathname.startsWith('/api/admin/') || url.pathname === '/api/admin') return await rotaAdmin(req, res, url);
      throw new Erro(404, 'Rota não encontrada.');
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) log.error('[api]', req.method, url.pathname, e.message);
      if (!res.headersSent) json(res, status, { erro: status >= 500 ? 'Algo deu errado do nosso lado. Tente de novo.' : e.message, campo: e.campo });
    }
  }

  return { tratar, sessoes, SITUACOES };
}

module.exports = { criarApi };
