'use strict';
// Utilidades comuns: escape de HTML, formatação brasileira, leitura de corpo e limite de tentativas.

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'imovel';

const reais = n => n == null || n === '' ? '' : 'R$ ' + Math.round(Number(n)).toLocaleString('pt-BR');
const num = n => n == null || n === '' ? '' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const soDigitos = s => String(s || '').replace(/\D/g, '');

const TIPOS = {
  casa: 'Casa', sobrado: 'Sobrado', apartamento: 'Apartamento', cobertura: 'Cobertura',
  chacara: 'Chácara', sitio: 'Sítio', terreno: 'Terreno', comercial: 'Sala comercial', galpao: 'Galpão',
};
const SITUACOES = { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido', alugado: 'Alugado' };
const CARACTERISTICAS = [
  'Piscina', 'Churrasqueira', 'Lareira', 'Área gourmet', 'Jardim', 'Pátio', 'Varanda', 'Sacada',
  'Ar-condicionado', 'Aquecimento a gás', 'Energia solar', 'Mobiliado', 'Semimobiliado', 'Closet',
  'Escritório', 'Lavanderia', 'Despensa', 'Portão eletrônico', 'Câmeras', 'Elevador', 'Portaria 24h',
  'Salão de festas', 'Academia', 'Playground', 'Aceita pet', 'Vista panorâmica', 'Poço artesiano', 'Pomar',
];

function lerCorpo(req, limite = 1e6) {
  return new Promise((ok, falha) => {
    let tam = 0; const partes = [];
    req.on('data', c => { tam += c.length; if (tam > limite) { falha(Object.assign(new Error('Conteúdo grande demais.'), { status: 413 })); req.destroy(); } else partes.push(c); });
    req.on('end', () => ok(Buffer.concat(partes)));
    req.on('error', falha);
  });
}
async function lerJson(req, limite) {
  const tipo = String(req.headers['content-type'] || '');
  if (!tipo.startsWith('application/json')) throw Object.assign(new Error('Envie JSON.'), { status: 415 });
  const b = await lerCorpo(req, limite);
  try { return JSON.parse(b.toString('utf8') || '{}'); } catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
}

// limite por chave (ip, e-mail...) em janela deslizante simples
function limitador({ max, janelaMs }) {
  const mapa = new Map();
  setInterval(() => { const t = Date.now(); for (const [k, v] of mapa) if (v.ate < t) mapa.delete(k); }, 60e3).unref();
  return {
    excedeu(k) { const v = mapa.get(k); return !!v && v.ate > Date.now() && v.n >= max; },
    registrar(k) { const t = Date.now(), v = mapa.get(k); if (!v || v.ate < t) mapa.set(k, { n: 1, ate: t + janelaMs }); else v.n++; },
    limpar(k) { mapa.delete(k); },
  };
}

const ipDe = req => String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

// texto livre: corta, tira caracteres de controle
const texto = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
// número inteiro no jeito brasileiro: '450.000' e '450.000,00' viram 450000
const inteiro = (v, min = 0, max = 1e12) => { if (v === '' || v == null) return null; if (typeof v === 'number') return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null; const s = String(v).split(',')[0].replace(/[^\d-]/g, ''); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null; };
const decimal = (v, min = 0, max = 1e9) => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null; };

module.exports = { esc, slugify, reais, num, soDigitos, TIPOS, SITUACOES, CARACTERISTICAS, lerCorpo, lerJson, limitador, ipDe, texto, inteiro, decimal };
