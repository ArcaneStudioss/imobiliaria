'use strict';
// Senhas (scrypt com sal) e sessões por cookie HttpOnly. No banco fica só o hash do token.
const crypto = require('node:crypto');

const N = 16384, R = 8, P = 1, LEN = 32;
function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(senha, sal, LEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${sal.toString('base64')}$${h.toString('base64')}`;
}
function confereSenha(senha, guardado) {
  try {
    const [alg, n, r, p, sal, h] = String(guardado).split('$');
    if (alg !== 'scrypt') return false;
    const esperado = Buffer.from(h, 'base64');
    const calc = crypto.scryptSync(String(senha), Buffer.from(sal, 'base64'), esperado.length, { N: +n, r: +r, p: +p });
    return crypto.timingSafeEqual(calc, esperado);
  } catch { return false; }
}
const HASH_FALSO = hashSenha(crypto.randomBytes(12).toString('hex'));
const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');

const COMUNS = new Set(['1234567890', '12345678910', 'senha12345', 'password12', 'qwertyuiop', 'imobiliaria', 'imoveis123', '0123456789', 'abcdefghij']);
function senhaFraca(senha, email = '') {
  const s = String(senha || '');
  if (s.length < 10) return 'Use pelo menos 10 caracteres.';
  if (s.length > 200) return 'Senha longa demais.';
  if (COMUNS.has(s.toLowerCase()) || /^(.)\1+$/.test(s)) return 'Essa senha é fácil de adivinhar. Escolha outra.';
  const usuario = String(email).split('@')[0].toLowerCase();
  if (usuario.length >= 4 && s.toLowerCase().includes(usuario)) return 'A senha não pode conter o seu e-mail.';
  return null;
}

const DURACAO = 14 * 864e5;
function criarSessoes(db) {
  const seguro = req => req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted || process.env.COOKIE_SEGURO === '1';
  const nome = req => seguro(req) ? '__Host-lumiar' : 'lumiar_sessao';
  const ler = req => {
    const c = String(req.headers.cookie || ''); const n = nome(req);
    for (const parte of c.split(';')) { const [k, ...v] = parte.trim().split('='); if (k === n) return v.join('='); }
    return null;
  };
  function criar(req, res, usuarioId) {
    const t = crypto.randomBytes(32).toString('base64url'), agora = new Date();
    db.prepare('INSERT INTO sessoes (id_hash, usuario_id, expira_em, criado_em, ip, ua) VALUES (?,?,?,?,?,?)')
      .run(sha(t), usuarioId, new Date(Date.now() + DURACAO).toISOString(), agora.toISOString(), String(req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '').slice(0, 64), String(req.headers['user-agent'] || '').slice(0, 200));
    res.setHeader('Set-Cookie', `${nome(req)}=${t}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DURACAO / 1000}${seguro(req) ? '; Secure' : ''}`);
  }
  function usuario(req) {
    const t = ler(req); if (!t || t.length > 100) return null;
    const s = db.prepare('SELECT s.id_hash, s.expira_em, u.id, u.email, u.nome FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.id_hash = ?').get(sha(t));
    if (!s) return null;
    if (Date.parse(s.expira_em) < Date.now()) { db.prepare('DELETE FROM sessoes WHERE id_hash = ?').run(s.id_hash); return null; }
    // renova quando passou da metade
    if (Date.parse(s.expira_em) - Date.now() < DURACAO / 2) db.prepare('UPDATE sessoes SET expira_em = ? WHERE id_hash = ?').run(new Date(Date.now() + DURACAO).toISOString(), s.id_hash);
    return { id: s.id, email: s.email, nome: s.nome, sessao: s.id_hash };
  }
  function encerrar(req, res) {
    const t = ler(req); if (t) db.prepare('DELETE FROM sessoes WHERE id_hash = ?').run(sha(t));
    res.setHeader('Set-Cookie', `${nome(req)}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${seguro(req) ? '; Secure' : ''}`);
  }
  const encerrarOutras = (usuarioId, manter) => db.prepare('DELETE FROM sessoes WHERE usuario_id = ? AND id_hash <> ?').run(usuarioId, manter || '');
  setInterval(() => { try { db.prepare('DELETE FROM sessoes WHERE expira_em < ?').run(new Date().toISOString()); } catch {} }, 36e5).unref();
  return { criar, usuario, encerrar, encerrarOutras };
}

module.exports = { hashSenha, confereSenha, HASH_FALSO, senhaFraca, criarSessoes, sha };
