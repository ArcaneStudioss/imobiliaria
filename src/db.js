'use strict';
// Banco do site (node:sqlite, sem dependências). Um arquivo só: dados/site.db
const fs = require('node:fs');
const path = require('node:path');

const MIGRACOES = [
  `
  CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, nome TEXT NOT NULL, senha_hash TEXT NOT NULL,
    criado_em TEXT NOT NULL, ultimo_login TEXT
  );
  CREATE TABLE sessoes (
    id_hash TEXT PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em TEXT NOT NULL, criado_em TEXT NOT NULL, ip TEXT, ua TEXT
  );
  CREATE TABLE imoveis (
    id INTEGER PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    finalidade TEXT NOT NULL DEFAULT 'venda' CHECK (finalidade IN ('venda','aluguel')),
    tipo TEXT NOT NULL DEFAULT 'casa',
    situacao TEXT NOT NULL DEFAULT 'disponivel' CHECK (situacao IN ('disponivel','reservado','vendido','alugado')),
    preco INTEGER, condominio INTEGER, iptu INTEGER,
    area_util REAL, area_total REAL,
    quartos INTEGER, suites INTEGER, banheiros INTEGER, vagas INTEGER,
    endereco TEXT, bairro TEXT, cidade TEXT, uf TEXT, mostrar_endereco INTEGER NOT NULL DEFAULT 0,
    resumo TEXT, descricao TEXT,
    caracteristicas TEXT NOT NULL DEFAULT '[]',
    video_url TEXT,
    financiamento INTEGER NOT NULL DEFAULT 0, permuta INTEGER NOT NULL DEFAULT 0,
    destaque INTEGER NOT NULL DEFAULT 0, publicado INTEGER NOT NULL DEFAULT 1, exemplo INTEGER NOT NULL DEFAULT 0,
    visitas INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL
  );
  CREATE INDEX imoveis_busca ON imoveis(publicado, finalidade, tipo, cidade);
  CREATE TABLE fotos (
    id INTEGER PRIMARY KEY, imovel_id INTEGER NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
    grande TEXT NOT NULL, pequena TEXT NOT NULL, largura INTEGER, altura INTEGER,
    legenda TEXT, ordem INTEGER NOT NULL DEFAULT 0, criado_em TEXT NOT NULL
  );
  CREATE INDEX fotos_imovel ON fotos(imovel_id, ordem);
  CREATE TABLE leads (
    id INTEGER PRIMARY KEY,
    origem TEXT NOT NULL CHECK (origem IN ('contato','visita','anunciar','whatsapp')),
    nome TEXT NOT NULL, telefone TEXT, email TEXT, mensagem TEXT,
    imovel_id INTEGER REFERENCES imoveis(id) ON DELETE SET NULL,
    dados TEXT NOT NULL DEFAULT '{}',
    situacao TEXT NOT NULL DEFAULT 'novo' CHECK (situacao IN ('novo','em_atendimento','concluido','descartado')),
    criado_em TEXT NOT NULL
  );
  CREATE INDEX leads_data ON leads(criado_em);
  CREATE TABLE config (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
  `,
];

function abrir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(path.join(dir, 'site.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 4000;');
  db.exec('CREATE TABLE IF NOT EXISTS _versao (v INTEGER NOT NULL)');
  const atual = (db.prepare('SELECT v FROM _versao').get() || { v: 0 }).v;
  if (!db.prepare('SELECT v FROM _versao').get()) db.prepare('INSERT INTO _versao (v) VALUES (0)').run();
  for (let i = atual; i < MIGRACOES.length; i++) {
    db.exec('BEGIN');
    try { db.exec(MIGRACOES[i]); db.prepare('UPDATE _versao SET v = ?').run(i + 1); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  }
  return db;
}

// transação simples (node:sqlite não tem helper)
function transacao(db, fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { abrir, transacao };
