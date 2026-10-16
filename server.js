'use strict';
// Servidor do site da imobiliária: páginas (montadas aqui), arquivos públicos, fotos enviadas, painel e API.
// Sem dependências: só Node 22.13+.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { abrir } = require('./src/db');
const { criarConfig, criarImoveis, criarLeads } = require('./src/imoveis');
const { criarApi } = require('./src/api');
const { criarBackup } = require('./src/backup');
const { semear } = require('./src/exemplos');
const pg = require('./src/paginas');
const { inteiro, texto, TIPOS } = require('./src/util');

const RAIZ = __dirname;
const PORTA = Number(process.env.PORT) || 8080;
const DADOS = process.env.DATA_DIR || path.join(RAIZ, 'dados');

const db = abrir(DADOS);
const config = criarConfig(db), imoveis = criarImoveis(db), leads = criarLeads(db);
if (!process.env.SEM_EXEMPLOS) { const n = semear(imoveis, db); if (n) console.log(`[site] ${n} imóveis de exemplo criados`); }
const backup = criarBackup({ dir: DADOS, bancos: { site: db } });
if (!process.env.SEM_BACKUP) backup.agendar();

const instalado = () => !!db.prepare('SELECT 1 FROM usuarios LIMIT 1').get();
const codigo = process.env.SETUP_CODE || crypto.randomBytes(5).toString('hex').toUpperCase();
if (!instalado()) console.log(`[painel] PRIMEIRO ACESSO · código de instalação: ${codigo} · abra /painel e use este código`);
const api = criarApi({ db, dir: DADOS, imoveis, leads, config, backup, codigoInstalacao: () => codigo, cartaoHtml: im => pg.cartao(im) });

// versão dos arquivos (muda a cada deploy) para o cache da Cloudflare não misturar versões
const hashDe = arqs => crypto.createHash('sha256').update(arqs.map(a => { try { return fs.readFileSync(path.join(RAIZ, a)); } catch { return ''; } }).join('|')).digest('hex').slice(0, 10);
const V_SITE = hashDe(['public/site.css', 'public/site.js']);
const V_PAINEL = hashDe(['painel/painel.css', 'painel/painel.js']);

const TIPOS_ARQ = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

function base(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? 'https' : 'http';
  const host = String(req.headers.host || 'localhost').replace(/[^\w.:-]/g, '');
  return `${proto}://${host}`;
}

function cabecalhos(res, tipo) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('X-Frame-Options', 'DENY');
  if (tipo === 'painel') {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  } else if (tipo === 'pagina') {
    const cfg = config.ler(), r = cfg.ga4 || cfg.pixel_meta;
    const scripts = r ? ' https://www.googletagmanager.com https://connect.facebook.net' : '';
    const conecta = r ? ' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com' : '';
    const imgs = r ? ' https://www.googletagmanager.com https://*.google-analytics.com https://www.facebook.com' : '';
    res.setHeader('Content-Security-Policy', `default-src 'self'; img-src 'self' data: https://i.ytimg.com${imgs}; style-src 'self'; script-src 'self'${scripts}; connect-src 'self'${conecta}; font-src 'self'; frame-src https://www.google.com https://maps.google.com https://www.youtube-nocookie.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'`);
  }
}

function html(req, res, status, corpo) {
  cabecalhos(res, 'pagina');
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : corpo);
}

// arquivos estáticos com caminho validado (nada fora da pasta, nada de arquivo oculto)
function servirArquivo(req, res, pasta, rel, { cache = 'public, max-age=3600', tipoCab = 'arquivo' } = {}) {
  if (!/^[\w./-]+$/.test(rel) || rel.split('/').some(p => p === '..' || p.startsWith('.'))) return false;
  const arq = path.join(pasta, rel);
  if (!arq.startsWith(pasta + path.sep)) return false;
  let st; try { st = fs.statSync(arq); } catch { return false; }
  if (!st.isFile()) return false;
  const tipo = TIPOS_ARQ[path.extname(arq).toLowerCase()]; if (!tipo) return false;
  cabecalhos(res, tipoCab);
  const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(), true; }
  res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': st.size, 'Cache-Control': cache, ETag: etag });
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(arq).pipe(res);
  return true;
}

function filtrosDe(url) {
  const q = url.searchParams, f = {};
  for (const k of ['finalidade', 'tipo', 'cidade', 'bairro', 'quartos', 'vagas', 'ordem', 'texto', 'pagina']) { const v = texto(q.get(k), 80); if (v) f[k] = v; }
  const faixa = q.get('faixa');
  if (faixa && /^\d*-\d*$/.test(faixa)) { const [a, b] = faixa.split('-'); if (Number(a)) f.min = a; if (b) f.max = b; }
  if (q.get('min')) f.min = String(inteiro(q.get('min')) || ''); if (q.get('max')) f.max = String(inteiro(q.get('max')) || '');
  if (f.finalidade && !['venda', 'aluguel'].includes(f.finalidade)) delete f.finalidade;
  if (f.tipo && !TIPOS[f.tipo]) delete f.tipo;
  return f;
}

function sitemap(req, res) {
  const b = base(req);
  const itens = db.prepare("SELECT slug, atualizado_em FROM imoveis WHERE publicado = 1 AND situacao IN ('disponivel','reservado') ORDER BY atualizado_em DESC").all();
  const urls = [['/', null], ['/imoveis?finalidade=venda', null], ['/imoveis?finalidade=aluguel', null], ['/anunciar', null], ...itens.map(i => [`/imovel/${i.slug}`, i.atualizado_em])];
  const esc = s => s.replace(/&/g, '&amp;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `<url><loc>${esc(b + u)}</loc>${d ? `<lastmod>${d.slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
  res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }); res.end(xml);
}

async function rotear(req, res) {
  const url = new URL(req.url, 'http://x');
  let p; try { p = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
  const cfg = config.ler(), b = base(req), v = V_SITE;

  if (p.startsWith('/api/')) { cabecalhos(res, 'painel'); return api.tratar(req, res, url); }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }

  // painel (uma página só; o resto é JavaScript)
  if (p === '/painel' || p === '/painel/') {
    const pagina = fs.readFileSync(path.join(RAIZ, 'painel', 'index.html'), 'utf8').replace(/__V__/g, V_PAINEL);
    cabecalhos(res, 'painel'); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(pagina);
  }
  if (p.startsWith('/painel/')) { if (servirArquivo(req, res, path.join(RAIZ, 'painel'), p.slice(8), { cache: 'public, max-age=31536000, immutable', tipoCab: 'painel' })) return; }

  if (p.startsWith('/uploads/')) { if (servirArquivo(req, res, path.join(DADOS, 'uploads'), p.slice(9), { cache: 'public, max-age=31536000, immutable' })) return; return html(req, res, 404, pg.naoEncontrado({ cfg, v, base: b })); }
  if (p.startsWith('/exemplo/')) { if (servirArquivo(req, res, path.join(RAIZ, 'exemplo'), p.slice(9), { cache: 'public, max-age=2592000' })) return; }

  if (p === '/') {
    const op = imoveis.opcoes();
    let destaques = imoveis.buscar({ destaque: 1, porPagina: 10 }).itens;
    if (destaques.length < 4) destaques = imoveis.buscar({ porPagina: 10 }).itens;
    const conta = f => imoveis.buscar({ ...f, porPagina: 1 }).total;
    return html(req, res, 200, pg.home({ cfg, v, base: b, op, destaques, contagens: { casa: conta({ tipo: 'casa', finalidade: 'venda' }), apartamento: conta({ tipo: 'apartamento' }), chacara: conta({ tipo: 'chacara' }), aluguel: conta({ finalidade: 'aluguel' }) } }));
  }
  if (p === '/imoveis') {
    const f = filtrosDe(url), r = imoveis.buscar(f);
    const canon = '/imoveis' + (f.finalidade ? `?finalidade=${f.finalidade}` : '');
    return html(req, res, 200, pg.listagem({ cfg, v, base: b, op: imoveis.opcoes(), f, r, canonico: canon }));
  }
  let m;
  if ((m = /^\/imovel\/([a-z0-9-]{1,100})$/.exec(p))) {
    const im = imoveis.porSlug(m[1]);
    if (!im) return html(req, res, 404, pg.naoEncontrado({ cfg, v, base: b }));
    if (!/bot|crawl|spider|preview/i.test(String(req.headers['user-agent'] || '')) && req.method === 'GET') imoveis.contarVisita(im.id);
    return html(req, res, 200, pg.ficha({ cfg, v, base: b, im, fotos: imoveis.fotos(im.id), semelhantes: imoveis.semelhantes(im) }));
  }
  if (p === '/anunciar') return html(req, res, 200, pg.anunciar({ cfg, v, base: b }));
  if (p === '/favoritos') return html(req, res, 200, pg.favoritos({ cfg, v, base: b }));
  if (p === '/privacidade') return html(req, res, 200, pg.privacidade({ cfg, v, base: b }));
  if (p === '/sitemap.xml') return sitemap(req, res);
  if (p === '/robots.txt') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end(`User-agent: *\nAllow: /\nDisallow: /painel\nDisallow: /api/\nSitemap: ${b}/sitemap.xml\n`); }
  if (p === '/saude') { res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); return res.end('ok'); }

  // arquivos públicos (css, js, fontes, imagens do site)
  const longo = url.searchParams.has('v') || p.startsWith('/fonts/') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400';
  if (servirArquivo(req, res, path.join(RAIZ, 'public'), p.replace(/^\//, ''), { cache: longo })) return;

  // endereço antigo com barra no fim
  if (p.length > 1 && p.endsWith('/') && !p.startsWith('//') && !p.includes('\\')) { res.writeHead(301, { Location: p.slice(0, -1).replace(/^\/+/, '/') + url.search }); return res.end(); }
  return html(req, res, 404, pg.naoEncontrado({ cfg, v, base: b }));
}

const servidor = http.createServer((req, res) => {
  rotear(req, res).catch(e => {
    console.error('[site] erro:', e);
    if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Erro interno.'); }
  });
});
servidor.headersTimeout = 20e3; servidor.requestTimeout = 120e3;
if (require.main === module) servidor.listen(PORTA, () => console.log(`[site] no ar na porta ${PORTA}`));

module.exports = { servidor, db, backup };
