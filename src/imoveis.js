'use strict';
// Regras de imóveis, fotos, leads e configuração do site.
const { slugify, texto, inteiro, decimal, TIPOS, SITUACOES } = require('./util');
const { transacao } = require('./db');

const agora = () => new Date().toISOString();

/* ---------- configuração (chave/valor) ---------- */
const PADRAO = {
  nome: 'Lumiar Imóveis',
  slogan: 'Casas com alma no interior gaúcho',
  creci: '',
  corretor_nome: '',
  corretor_foto: '',
  whatsapp: '',
  telefone: '',
  email: '',
  endereco: '',
  cidade_base: 'Interior do RS',
  horario: 'Segunda a sexta, das 8h30 às 18h. Sábado, das 9h às 12h.',
  instagram: '',
  facebook: '',
  hero_1: 'Para quem repara nos detalhes.',
  hero_2: 'Bem-vindo de volta pra casa.',
  hero_3: 'Aqui, os dias passam sem pressa.',
  hero_img_1: '/img/hero/cena1.webp',
  hero_img_2: '/img/hero/cena2.webp',
  hero_img_3: '/img/hero/cena3.webp',
  sobre_titulo: 'Imóvel bom é aquele que já parece seu na primeira visita.',
  sobre_texto: 'Somos uma imobiliária de cidade pequena, do jeito que tem que ser: a gente conhece as ruas, os vizinhos e a história de cada casa. Ajudamos você a comprar, vender ou alugar com calma, papel em dia e conversa franca do começo ao fim.',
  ga4: '',
  verificacao_google: '',
  pixel_meta: '',
  aviso_cookies: '1',
};
const CHAVES = Object.keys(PADRAO);

function criarConfig(db) {
  let cache = null;
  const ler = () => {
    if (cache) return cache;
    const c = { ...PADRAO };
    for (const r of db.prepare('SELECT chave, valor FROM config').all()) if (CHAVES.includes(r.chave)) c[r.chave] = r.valor;
    return (cache = c);
  };
  function salvar(dados) {
    const lim = { sobre_texto: 1500, sobre_titulo: 160, slogan: 120, horario: 160, endereco: 200 };
    const ins = db.prepare('INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor');
    transacao(db, () => {
      for (const k of CHAVES) if (k in dados) {
        let v = texto(dados[k], lim[k] || 300);
        if (k === 'whatsapp' || k === 'telefone') v = v.replace(/[^\d+()\s-]/g, '');
        if (k === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw Object.assign(new Error('E-mail inválido.'), { status: 400, campo: 'email' });
        if (k === 'ga4' && v && !/^G-[A-Z0-9]{4,15}$/i.test(v)) throw Object.assign(new Error('O código do Google Analytics começa com G- (ex.: G-AB12CD34EF).'), { status: 400, campo: 'ga4' });
        if (k === 'pixel_meta' && v && !/^\d{6,20}$/.test(v)) throw Object.assign(new Error('O Pixel da Meta é só números.'), { status: 400, campo: 'pixel_meta' });
        if (k === 'verificacao_google' && v) { const m = /content="([^"]+)"/.exec(v); v = (m ? m[1] : v).replace(/[^\w-]/g, '').slice(0, 100); }
        if ((k === 'instagram' || k === 'facebook') && v) v = v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//, '').replace(/[^\w.-]/g, '');
        if (/^hero_img_|^corretor_foto$/.test(k) && v && !/^\/(img\/hero\/[\w.-]+|uploads\/[\w.-]+)$/.test(v)) continue;
        ins.run(k, v);
      }
    });
    cache = null; return ler();
  }
  return { ler, salvar, PADRAO };
}

/* ---------- imóveis ---------- */
const CAMPOS_LISTA = `i.id, i.codigo, i.slug, i.titulo, i.finalidade, i.tipo, i.situacao, i.preco, i.condominio, i.area_util, i.area_total,
  i.quartos, i.suites, i.banheiros, i.vagas, i.bairro, i.cidade, i.uf, i.destaque, i.publicado, i.exemplo, i.resumo, i.visitas, i.atualizado_em,
  (SELECT pequena FROM fotos f WHERE f.imovel_id = i.id ORDER BY ordem, id LIMIT 1) AS capa,
  (SELECT grande FROM fotos f WHERE f.imovel_id = i.id ORDER BY ordem, id LIMIT 1) AS capa_grande,
  (SELECT COUNT(*) FROM fotos f WHERE f.imovel_id = i.id) AS total_fotos`;

function decodificar(i) {
  if (!i) return i;
  try { i.caracteristicas = JSON.parse(i.caracteristicas || '[]'); } catch { i.caracteristicas = []; }
  return i;
}

function criarImoveis(db) {
  function buscar(f = {}, { admin = false } = {}) {
    const onde = [], p = [];
    if (!admin) onde.push('i.publicado = 1');
    if (f.finalidade === 'venda' || f.finalidade === 'aluguel') { onde.push('i.finalidade = ?'); p.push(f.finalidade); }
    if (f.tipo && TIPOS[f.tipo]) { onde.push('i.tipo = ?'); p.push(f.tipo); }
    if (f.cidade) { onde.push('i.cidade = ? COLLATE NOCASE'); p.push(texto(f.cidade, 80)); }
    if (f.bairro) { onde.push('i.bairro = ? COLLATE NOCASE'); p.push(texto(f.bairro, 80)); }
    const min = inteiro(f.min), max = inteiro(f.max);
    if (min) { onde.push('i.preco >= ?'); p.push(min); }
    if (max) { onde.push('i.preco <= ?'); p.push(max); }
    const q = inteiro(f.quartos, 0, 10); if (q) { onde.push('i.quartos >= ?'); p.push(q); }
    const v = inteiro(f.vagas, 0, 10); if (v) { onde.push('i.vagas >= ?'); p.push(v); }
    if (f.destaque) onde.push('i.destaque = 1');
    if (!admin && !f.incluirFechados) onde.push("i.situacao IN ('disponivel','reservado')");
    if (f.texto) {
      const t = '%' + texto(f.texto, 60).replace(/[%_\\]/g, m => '\\' + m) + '%';
      onde.push("(i.titulo LIKE ? ESCAPE '\\' OR i.codigo LIKE ? ESCAPE '\\' OR i.bairro LIKE ? ESCAPE '\\' OR i.cidade LIKE ? ESCAPE '\\')"); p.push(t, t, t, t);
    }
    if (Array.isArray(f.ids)) { const ids = f.ids.map(Number).filter(Number.isInteger).slice(0, 60); onde.push(`i.id IN (${ids.map(() => '?').join(',') || 'NULL'})`); p.push(...ids); }
    const ordens = { recentes: 'i.criado_em DESC', menor: 'i.preco IS NULL, i.preco ASC', maior: 'i.preco DESC', area: 'i.area_util DESC', destaque: 'i.destaque DESC, i.criado_em DESC' };
    const ordem = ordens[f.ordem] || ordens.destaque;
    const where = onde.length ? 'WHERE ' + onde.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) n FROM imoveis i ${where}`).get(...p).n;
    const porPagina = Math.min(60, inteiro(f.porPagina, 1, 60) || 12), pagina = Math.max(1, inteiro(f.pagina, 1, 1000) || 1);
    const itens = db.prepare(`SELECT ${CAMPOS_LISTA} FROM imoveis i ${where} ORDER BY ${ordem}, i.id DESC LIMIT ? OFFSET ?`).all(...p, porPagina, (pagina - 1) * porPagina);
    return { total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)), itens };
  }

  function opcoes() {
    const cidades = db.prepare("SELECT cidade, COUNT(*) n FROM imoveis WHERE publicado = 1 AND cidade <> '' GROUP BY cidade COLLATE NOCASE ORDER BY n DESC").all();
    const bairros = db.prepare("SELECT cidade, bairro, COUNT(*) n FROM imoveis WHERE publicado = 1 AND bairro <> '' GROUP BY cidade, bairro COLLATE NOCASE ORDER BY bairro").all();
    const tipos = db.prepare('SELECT tipo, COUNT(*) n FROM imoveis WHERE publicado = 1 GROUP BY tipo ORDER BY n DESC').all();
    const fins = db.prepare('SELECT finalidade, COUNT(*) n FROM imoveis WHERE publicado = 1 GROUP BY finalidade').all();
    return { cidades, bairros, tipos, finalidades: fins };
  }

  const porSlug = slug => decodificar(db.prepare('SELECT * FROM imoveis WHERE slug = ? AND publicado = 1').get(String(slug)));
  const porId = id => decodificar(db.prepare('SELECT * FROM imoveis WHERE id = ?').get(Number(id)));
  const fotos = id => db.prepare('SELECT id, grande, pequena, largura, altura, legenda, ordem FROM fotos WHERE imovel_id = ? ORDER BY ordem, id').all(Number(id));
  const contarVisita = id => db.prepare('UPDATE imoveis SET visitas = visitas + 1 WHERE id = ?').run(Number(id));

  function semelhantes(im, n = 3) {
    return db.prepare(`SELECT ${CAMPOS_LISTA} FROM imoveis i WHERE i.publicado = 1 AND i.id <> ? AND i.finalidade = ? AND i.situacao IN ('disponivel','reservado')
      ORDER BY (i.tipo = ?) DESC, (i.cidade = ?) DESC, ABS(COALESCE(i.preco,0) - ?) ASC LIMIT ?`).all(im.id, im.finalidade, im.tipo, im.cidade || '', im.preco || 0, n);
  }

  function normalizar(d, atual = {}) {
    const o = {};
    o.titulo = texto(d.titulo ?? atual.titulo, 120);
    if (!o.titulo) throw Object.assign(new Error('Dê um título ao imóvel.'), { status: 400, campo: 'titulo' });
    o.finalidade = d.finalidade === 'aluguel' ? 'aluguel' : 'venda';
    o.tipo = TIPOS[d.tipo] ? d.tipo : 'casa';
    o.situacao = SITUACOES[d.situacao] ? d.situacao : 'disponivel';
    o.preco = inteiro(d.preco, 0, 1e11); o.condominio = inteiro(d.condominio, 0, 1e8); o.iptu = inteiro(d.iptu, 0, 1e8);
    o.area_util = decimal(d.area_util, 0, 1e7); o.area_total = decimal(d.area_total, 0, 1e9);
    for (const k of ['quartos', 'suites', 'banheiros', 'vagas']) o[k] = inteiro(d[k], 0, 99);
    o.endereco = texto(d.endereco, 160); o.bairro = texto(d.bairro, 80); o.cidade = texto(d.cidade, 80); o.uf = texto(d.uf, 2).toUpperCase().replace(/[^A-Z]/g, '');
    o.mostrar_endereco = d.mostrar_endereco ? 1 : 0;
    o.resumo = texto(d.resumo, 220); o.descricao = texto(d.descricao, 6000);
    o.caracteristicas = JSON.stringify((Array.isArray(d.caracteristicas) ? d.caracteristicas : []).map(c => texto(c, 40)).filter(Boolean).slice(0, 40));
    const v = texto(d.video_url, 200);
    o.video_url = v && idYoutube(v) ? v : '';
    if (v && !o.video_url) throw Object.assign(new Error('Use um link do YouTube (youtube.com ou youtu.be).'), { status: 400, campo: 'video_url' });
    for (const k of ['financiamento', 'permuta', 'destaque']) o[k] = d[k] ? 1 : 0;
    o.publicado = d.publicado === false || d.publicado === 0 ? 0 : 1;
    return o;
  }

  function slugLivre(base, id) {
    let s = slugify(base), n = 1;
    while (db.prepare('SELECT 1 FROM imoveis WHERE slug = ? AND id <> ?').get(s, id || 0)) s = `${slugify(base)}-${++n}`;
    return s;
  }
  function proximoCodigo() {
    const r = db.prepare("SELECT codigo FROM imoveis WHERE codigo LIKE 'IM-%' ORDER BY CAST(SUBSTR(codigo, 4) AS INTEGER) DESC LIMIT 1").get();
    const n = r ? Number(r.codigo.slice(3)) + 1 : 101;
    return 'IM-' + String(n).padStart(4, '0');
  }

  function criar(d, extra = {}) {
    const o = normalizar(d); const t = agora();
    o.codigo = texto(d.codigo, 20).replace(/[^\w-]/g, '').toUpperCase() || proximoCodigo();
    if (db.prepare('SELECT 1 FROM imoveis WHERE codigo = ?').get(o.codigo)) throw Object.assign(new Error('Já existe um imóvel com esse código.'), { status: 409, campo: 'codigo' });
    o.slug = slugLivre(`${o.titulo} ${o.bairro || o.cidade || ''}`);
    o.exemplo = extra.exemplo ? 1 : 0; o.criado_em = extra.criado_em || t; o.atualizado_em = t;
    const ks = Object.keys(o);
    const r = db.prepare(`INSERT INTO imoveis (${ks.join(',')}) VALUES (${ks.map(() => '?').join(',')})`).run(...ks.map(k => o[k]));
    return porId(r.lastInsertRowid);
  }
  function atualizar(id, d) {
    const atual = porId(id); if (!atual) throw Object.assign(new Error('Imóvel não encontrado.'), { status: 404 });
    const o = normalizar(d, atual);
    if (d.codigo != null) {
      const c = texto(d.codigo, 20).replace(/[^\w-]/g, '').toUpperCase();
      if (c && c !== atual.codigo) { if (db.prepare('SELECT 1 FROM imoveis WHERE codigo = ? AND id <> ?').get(c, atual.id)) throw Object.assign(new Error('Já existe um imóvel com esse código.'), { status: 409, campo: 'codigo' }); o.codigo = c; }
    }
    if (o.titulo !== atual.titulo || o.bairro !== atual.bairro) o.slug = slugLivre(`${o.titulo} ${o.bairro || o.cidade || ''}`, atual.id);
    o.atualizado_em = agora();
    const ks = Object.keys(o);
    db.prepare(`UPDATE imoveis SET ${ks.map(k => k + ' = ?').join(', ')} WHERE id = ?`).run(...ks.map(k => o[k]), atual.id);
    return porId(atual.id);
  }
  const alternar = (id, campo, valor) => {
    if (!['destaque', 'publicado'].includes(campo)) throw new Error('campo inválido');
    db.prepare(`UPDATE imoveis SET ${campo} = ?, atualizado_em = ? WHERE id = ?`).run(valor ? 1 : 0, agora(), Number(id));
  };
  const apagar = id => db.prepare('DELETE FROM imoveis WHERE id = ?').run(Number(id));

  function adicionarFoto(imovelId, f) {
    const ordem = (db.prepare('SELECT MAX(ordem) m FROM fotos WHERE imovel_id = ?').get(imovelId).m ?? -1) + 1;
    const r = db.prepare('INSERT INTO fotos (imovel_id, grande, pequena, largura, altura, legenda, ordem, criado_em) VALUES (?,?,?,?,?,?,?,?)')
      .run(imovelId, f.grande, f.pequena, f.largura || null, f.altura || null, texto(f.legenda, 120), ordem, agora());
    db.prepare('UPDATE imoveis SET atualizado_em = ? WHERE id = ?').run(agora(), imovelId);
    return db.prepare('SELECT * FROM fotos WHERE id = ?').get(r.lastInsertRowid);
  }
  function ordenarFotos(imovelId, ids) {
    transacao(db, () => ids.forEach((fid, i) => db.prepare('UPDATE fotos SET ordem = ? WHERE id = ? AND imovel_id = ?').run(i, Number(fid), Number(imovelId))));
  }
  const legendaFoto = (imovelId, fid, legenda) => db.prepare('UPDATE fotos SET legenda = ? WHERE id = ? AND imovel_id = ?').run(texto(legenda, 120), Number(fid), Number(imovelId));
  function removerFoto(imovelId, fid) {
    const f = db.prepare('SELECT * FROM fotos WHERE id = ? AND imovel_id = ?').get(Number(fid), Number(imovelId));
    if (f) db.prepare('DELETE FROM fotos WHERE id = ?').run(f.id);
    return f;
  }

  return { buscar, opcoes, porSlug, porId, fotos, contarVisita, semelhantes, criar, atualizar, alternar, apagar, adicionarFoto, ordenarFotos, legendaFoto, removerFoto };
}

/* ---------- leads ---------- */
function criarLeads(db) {
  function registrar(d) {
    const r = db.prepare('INSERT INTO leads (origem, nome, telefone, email, mensagem, imovel_id, dados, criado_em) VALUES (?,?,?,?,?,?,?,?)')
      .run(d.origem, d.nome, d.telefone || null, d.email || null, d.mensagem || null, d.imovel_id || null, JSON.stringify(d.dados || {}), agora());
    return r.lastInsertRowid;
  }
  function listar({ situacao, origem, pagina = 1 } = {}) {
    const onde = [], p = [];
    if (situacao) { onde.push('l.situacao = ?'); p.push(situacao); }
    if (origem) { onde.push('l.origem = ?'); p.push(origem); }
    const w = onde.length ? 'WHERE ' + onde.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) n FROM leads l ${w}`).get(...p).n;
    const itens = db.prepare(`SELECT l.*, i.titulo AS imovel_titulo, i.codigo AS imovel_codigo, i.slug AS imovel_slug FROM leads l LEFT JOIN imoveis i ON i.id = l.imovel_id ${w} ORDER BY l.criado_em DESC LIMIT 50 OFFSET ?`).all(...p, (Math.max(1, pagina) - 1) * 50);
    for (const l of itens) { try { l.dados = JSON.parse(l.dados); } catch { l.dados = {}; } }
    return { total, itens, novos: db.prepare("SELECT COUNT(*) n FROM leads WHERE situacao = 'novo'").get().n };
  }
  const mudar = (id, situacao) => db.prepare('UPDATE leads SET situacao = ? WHERE id = ?').run(situacao, Number(id));
  const apagar = id => db.prepare('DELETE FROM leads WHERE id = ?').run(Number(id));
  return { registrar, listar, mudar, apagar };
}

function idYoutube(url) {
  const m = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(String(url || ''));
  return m ? m[1] : null;
}

module.exports = { criarConfig, criarImoveis, criarLeads, idYoutube, PADRAO };
