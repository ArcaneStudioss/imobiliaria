'use strict';
// Páginas do site, montadas no servidor (bom para o Google e rápido no celular).
const { esc, reais, num, soDigitos, TIPOS, SITUACOES } = require('./util');
const { idYoutube } = require('./imoveis');

const ICONES = {
  cama: '<path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 18v2m18-2v2M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m0 0V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>',
  banho: '<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Zm2 7-1 2m13-2 1 2M6 12V5a2 2 0 0 1 3.5-1.3M9 6h2"/>',
  carro: '<path d="M5 17h14M5 17a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0M3 17v-4l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4M3 13h18"/>',
  area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5m11-5v5h-5"/>',
  suite: '<path d="M7 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M4 21h16M14 12h.01"/>',
  coracao: '<path d="M12 20s-7-4.4-9-8.6C1.6 8.4 3.4 5 6.8 5c2 0 3.3 1.1 5.2 3 1.9-1.9 3.2-3 5.2-3 3.4 0 5.2 3.4 3.8 6.4C19 15.6 12 20 12 20Z"/>',
  whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z"/><path d="M9 9.5c0 2.8 2.7 5.5 5.5 5.5l1.2-1.3-1.8-1-1 .8a4 4 0 0 1-2-2l.8-1-1-1.8L9 9.5Z"/>',
  seta: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  voltar: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  baixo: '<path d="m6 9 6 6 6-6"/>',
  fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  telefone: '<path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.3 6.7h.01"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/>',
  play: '<path d="M8 5.5v13l11-6.5-11-6.5Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  compartilhar: '<path d="M12 3v12m0-12L8 7m4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4m8-4v4"/>',
  fotos: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  filtro: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chave: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8m-3 3 2 2m-4 0 1.5 1.5"/>',
  casa: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h4"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n] || ''}</svg>`;

const MARCA = `<svg class="marca-simbolo" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 34V18.5C8 11.6 13.4 6 20 6s12 5.6 12 12.5V34" /><path d="M14.5 34V21a5.5 5.5 0 0 1 11 0v13" /><path d="M4 34h32" /><circle cx="20" cy="15.2" r="1.4" class="cheio"/></svg>`;

function marca(cfg) {
  const [primeira, ...resto] = String(cfg.nome || '').split(' ');
  return `<a class="marca" href="/" aria-label="${esc(cfg.nome)}, página inicial">${MARCA}<span class="marca-texto"><span class="marca-nome">${esc(primeira)}</span>${resto.length ? `<span class="marca-sub">${esc(resto.join(' '))}</span>` : ''}</span></a>`;
}

const linkWhats = (cfg, msg) => { const n = soDigitos(cfg.whatsapp); if (!n) return ''; return `https://wa.me/${n.length <= 11 ? '55' + n : n}${msg ? '?text=' + encodeURIComponent(msg) : ''}`; };
const precoTexto = im => im.preco ? reais(im.preco) + (im.finalidade === 'aluguel' ? '<small>/mês</small>' : '') : 'Consulte';
const local = im => [im.bairro, im.cidade].filter(Boolean).join(', ');

function specs(im, curto = false) {
  const it = [];
  if (im.area_util) it.push(['area', `${num(im.area_util)} m²`, 'de área útil']);
  else if (im.area_total) it.push(['area', `${num(im.area_total >= 10000 ? im.area_total / 10000 : im.area_total)} ${im.area_total >= 10000 ? 'ha' : 'm²'}`, 'de área total']);
  if (im.quartos) it.push(['cama', `${im.quartos}`, im.quartos > 1 ? 'dormitórios' : 'dormitório']);
  if (im.suites && !curto) it.push(['suite', `${im.suites}`, im.suites > 1 ? 'suítes' : 'suíte']);
  if (im.banheiros && !curto) it.push(['banho', `${im.banheiros}`, im.banheiros > 1 ? 'banheiros' : 'banheiro']);
  if (im.vagas) it.push(['carro', `${im.vagas}`, im.vagas > 1 ? 'vagas' : 'vaga']);
  return it;
}

function cartao(im, { lazy = true, classe = '' } = {}) {
  const sp = specs(im, true).map(([i, v, r]) => `<li>${ic(i)}<span>${esc(v)}</span><span class="sr">${esc(r)}</span></li>`).join('');
  const selo = im.situacao === 'reservado' ? '<span class="selo selo-reservado">Reservado</span>' : im.situacao === 'vendido' ? '<span class="selo selo-fechado">Vendido</span>' : im.situacao === 'alugado' ? '<span class="selo selo-fechado">Alugado</span>' : '';
  return `<article class="cartao ${classe}" data-id="${im.id}">
    <a class="cartao-link" href="/imovel/${esc(im.slug)}">
      <div class="cartao-foto">${im.capa ? `<img src="${esc(im.capa)}" alt="${esc(im.titulo)}" ${lazy ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'} width="640" height="800">` : '<div class="sem-foto">Fotos em breve</div>'}
        <div class="cartao-selos"><span class="selo">${im.finalidade === 'aluguel' ? 'Aluguel' : 'Venda'}</span>${selo}${im.exemplo ? '<span class="selo selo-exemplo">Exemplo</span>' : ''}</div>
        ${im.total_fotos > 1 ? `<span class="cartao-qtd">${ic('fotos')}${im.total_fotos}</span>` : ''}
      </div>
      <div class="cartao-corpo">
        <p class="cartao-local">${esc(TIPOS[im.tipo] || '')}${local(im) ? ' · ' + esc(local(im)) : ''}</p>
        <h3 class="cartao-titulo">${esc(im.titulo)}</h3>
        <ul class="cartao-specs">${sp}</ul>
        <p class="cartao-preco">${precoTexto(im)}</p>
      </div>
    </a>
    <button class="favoritar" type="button" data-favoritar="${im.id}" aria-pressed="false" aria-label="Salvar nos favoritos">${ic('coracao')}</button>
  </article>`;
}

/* ---------- moldura comum ---------- */
function moldura({ cfg, v, titulo, descricao, canonico, og, corpo, classe = '', jsonld = [], dados = null, base }) {
  const tituloFinal = titulo ? `${titulo} · ${cfg.nome}` : `${cfg.nome} · ${cfg.slogan}`;
  const url = base + (canonico || '/');
  const whats = linkWhats(cfg, 'Olá! Vim pelo site e gostaria de falar sobre imóveis.');
  const ldBase = {
    '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: cfg.nome, url: base + '/', description: cfg.slogan,
    ...(cfg.telefone || cfg.whatsapp ? { telephone: cfg.telefone || cfg.whatsapp } : {}), ...(cfg.email ? { email: cfg.email } : {}),
    ...(cfg.endereco ? { address: { '@type': 'PostalAddress', streetAddress: cfg.endereco, addressRegion: 'RS', addressCountry: 'BR' } } : {}),
    image: base + cfg.hero_img_1, sameAs: [cfg.instagram && `https://instagram.com/${cfg.instagram}`, cfg.facebook && `https://facebook.com/${cfg.facebook}`].filter(Boolean),
  };
  const ld = [ldBase, ...jsonld].map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  const analytics = cfg.ga4 || cfg.pixel_meta ? `<script type="application/json" id="rastreio">${JSON.stringify({ ga4: cfg.ga4 || null, pixel: cfg.pixel_meta || null }).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(tituloFinal)}</title>
<meta name="description" content="${esc(descricao || cfg.sobre_texto.slice(0, 155))}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="#F3ECE1">
${cfg.verificacao_google ? `<meta name="google-site-verification" content="${esc(cfg.verificacao_google)}">` : ''}
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(cfg.nome)}"><meta property="og:title" content="${esc(tituloFinal)}">
<meta property="og:description" content="${esc(descricao || cfg.slogan)}"><meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(base + (og || cfg.hero_img_1))}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/Newsreader-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Newsreader-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css?v=${v}">
<script src="/js.js?v=1"></script>
<script src="/site.js?v=${v}" defer></script>
${ld}
${dados ? `<script type="application/json" id="dados-pagina">${JSON.stringify(dados).replace(/</g, '\\u003c')}</script>` : ''}
${analytics}
</head>
<body class="${classe}">
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo" data-topo>
  <div class="topo-in">
    ${marca(cfg)}
    <nav class="nav" aria-label="Principal">
      <a href="/imoveis?finalidade=venda">Comprar</a>
      <a href="/imoveis?finalidade=aluguel">Alugar</a>
      <a href="/anunciar">Anunciar</a>
      <a href="/#sobre">Quem somos</a>
      <a href="/#contato">Contato</a>
    </nav>
    <div class="topo-acoes">
      <a class="btn-icone fav-topo" href="/favoritos" aria-label="Favoritos">${ic('coracao')}<span class="fav-qtd" data-fav-qtd hidden>0</span></a>
      ${whats ? `<a class="btn btn-claro btn-pequeno topo-whats" href="${esc(whats)}" target="_blank" rel="noopener">${ic('whatsapp')}<span>Conversar</span></a>` : ''}
      <button class="btn-icone abre-menu" type="button" data-abre-menu aria-expanded="false" aria-controls="menu-movel" aria-label="Abrir menu">${ic('menu')}</button>
    </div>
  </div>
</header>
<div class="menu-movel" id="menu-movel" hidden>
  <nav aria-label="Menu">
    <a href="/imoveis?finalidade=venda">Comprar</a><a href="/imoveis?finalidade=aluguel">Alugar</a><a href="/anunciar">Anunciar meu imóvel</a>
    <a href="/favoritos">Favoritos</a><a href="/#sobre">Quem somos</a><a href="/#contato">Contato</a>
  </nav>
  ${whats ? `<a class="btn btn-escuro btn-largo" href="${esc(whats)}" target="_blank" rel="noopener">${ic('whatsapp')}Conversar no WhatsApp</a>` : ''}
</div>
<main id="conteudo" class="${esc(classe)}-main">
${corpo}
</main>
${rodape(cfg)}
${whats ? `<a class="whats-flutuante" href="${esc(whats)}" target="_blank" rel="noopener" data-whats-flutuante aria-label="Conversar no WhatsApp">${ic('whatsapp')}<span>Fale com a gente</span></a>` : ''}
<div class="avisos" data-avisos aria-live="polite"></div>
${cfg.ga4 || cfg.pixel_meta ? `<div class="cookies" data-cookies hidden><p>Usamos cookies para entender como o site é usado e melhorar sua visita. <a href="/privacidade">Saiba mais</a>.</p><div><button type="button" class="btn btn-fantasma btn-pequeno" data-cookies="nao">Agora não</button><button type="button" class="btn btn-escuro btn-pequeno" data-cookies="sim">Aceitar</button></div></div>` : ''}
</body>
</html>`;
}

function rodape(cfg) {
  const whats = linkWhats(cfg);
  const ano = new Date().getFullYear();
  return `<footer class="rodape">
  <div class="rodape-in">
    <div class="rodape-marca">${marca(cfg)}<p>${esc(cfg.slogan)}</p>${cfg.creci ? `<p class="rodape-creci">CRECI ${esc(cfg.creci)}</p>` : ''}</div>
    <div><h2>Imóveis</h2><ul><li><a href="/imoveis?finalidade=venda">À venda</a></li><li><a href="/imoveis?finalidade=aluguel">Para alugar</a></li><li><a href="/imoveis?tipo=chacara">Chácaras e sítios</a></li><li><a href="/anunciar">Anuncie seu imóvel</a></li></ul></div>
    <div><h2>Contato</h2><ul>
      ${whats ? `<li><a href="${esc(whats)}" target="_blank" rel="noopener">${ic('whatsapp')}WhatsApp</a></li>` : ''}
      ${cfg.telefone ? `<li><a href="tel:+55${soDigitos(cfg.telefone)}">${ic('telefone')}${esc(cfg.telefone)}</a></li>` : ''}
      ${cfg.email ? `<li><a href="mailto:${esc(cfg.email)}">${ic('email')}${esc(cfg.email)}</a></li>` : ''}
      ${cfg.endereco ? `<li>${ic('pin')}<span>${esc(cfg.endereco)}</span></li>` : ''}
      ${cfg.horario ? `<li>${ic('relogio')}<span>${esc(cfg.horario)}</span></li>` : ''}
    </ul></div>
    <div><h2>Redes</h2><ul>
      ${cfg.instagram ? `<li><a href="https://instagram.com/${esc(cfg.instagram)}" target="_blank" rel="noopener">${ic('instagram')}@${esc(cfg.instagram)}</a></li>` : ''}
      ${cfg.facebook ? `<li><a href="https://facebook.com/${esc(cfg.facebook)}" target="_blank" rel="noopener">${ic('facebook')}Facebook</a></li>` : ''}
      <li><a href="/favoritos">${ic('coracao')}Seus favoritos</a></li>
    </ul></div>
  </div>
  <div class="rodape-fim"><span>© ${ano} ${esc(cfg.nome)}</span><a href="/privacidade">Privacidade</a></div>
</footer>`;
}

/* ---------- formulários ---------- */
function campoSelect(nome, rotulo, opcoes, valor = '', { classe = '', vazio } = {}) {
  return `<label class="campo ${classe}"><span class="campo-rotulo">${esc(rotulo)}</span>
    <select name="${esc(nome)}" data-select>${vazio !== undefined ? `<option value="">${esc(vazio)}</option>` : ''}${opcoes.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(valor) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
}

const FAIXAS = {
  venda: [['', 'Qualquer valor'], ['0-400000', 'Até R$ 400 mil'], ['400000-700000', 'R$ 400 a 700 mil'], ['700000-1000000', 'R$ 700 mil a 1 milhão'], ['1000000-2000000', 'R$ 1 a 2 milhões'], ['2000000-', 'Acima de R$ 2 milhões']],
  aluguel: [['', 'Qualquer valor'], ['0-1500', 'Até R$ 1.500'], ['1500-2500', 'R$ 1.500 a 2.500'], ['2500-4000', 'R$ 2.500 a 4.000'], ['4000-', 'Acima de R$ 4.000']],
};

function formBusca(op, f = {}, { compacto = false } = {}) {
  const fin = f.finalidade === 'aluguel' ? 'aluguel' : 'venda';
  const tipos = Object.entries(TIPOS).filter(([k]) => !op.tipos.length || op.tipos.some(t => t.tipo === k));
  const faixa = f.min || f.max ? `${f.min || 0}-${f.max || ''}` : '';
  return `<form class="busca${compacto ? ' busca-compacta' : ''}" action="/imoveis" method="get" role="search" data-busca>
    <fieldset class="segmento" aria-label="O que você procura">
      <label><input type="radio" name="finalidade" value="venda"${fin === 'venda' ? ' checked' : ''}><span>Comprar</span></label>
      <label><input type="radio" name="finalidade" value="aluguel"${fin === 'aluguel' ? ' checked' : ''}><span>Alugar</span></label>
    </fieldset>
    <div class="busca-campos">
      ${campoSelect('tipo', 'Tipo de imóvel', tipos, f.tipo, { vazio: 'Todos os tipos' })}
      ${campoSelect('cidade', 'Cidade', op.cidades.map(c => [c.cidade, c.cidade]), f.cidade, { vazio: 'Todas as cidades' })}
      ${campoSelect('faixa', 'Valor', FAIXAS[fin], faixa, { classe: 'campo-faixa' })}
      <button class="btn btn-escuro busca-enviar" type="submit">${ic('lupa')}<span>Buscar imóveis</span></button>
    </div>
  </form>`;
}

function consentimento() {
  return `<label class="checagem"><input type="checkbox" name="consentimento" value="1" required><span class="checagem-caixa">${ic('check')}</span><span>Autorizo o contato por telefone, WhatsApp ou e-mail sobre este pedido. <a href="/privacidade" target="_blank">Política de privacidade</a>.</span></label>`;
}
const armadilha = () => `<div class="armadilha" aria-hidden="true"><label>Não preencha<input name="site" tabindex="-1" autocomplete="off"></label></div>`;

function formContato({ origem = 'contato', imovel = null, titulo = '', botao = 'Enviar mensagem', mensagem = '' } = {}) {
  return `<form class="form" data-form-lead novalidate>
    <input type="hidden" name="origem" value="${esc(origem)}">${imovel ? `<input type="hidden" name="imovel_id" value="${imovel.id}">` : ''}
    ${titulo ? `<h3 class="form-titulo">${titulo}</h3>` : ''}
    <div class="grade-2">
      <label class="campo"><span class="campo-rotulo">Seu nome</span><input name="nome" autocomplete="name" required maxlength="80" placeholder="Como podemos te chamar?"></label>
      <label class="campo"><span class="campo-rotulo">WhatsApp ou telefone</span><input name="telefone" type="tel" inputmode="tel" autocomplete="tel" required data-mascara="telefone" placeholder="(55) 99999-9999"></label>
    </div>
    <label class="campo"><span class="campo-rotulo">E-mail <em>opcional</em></span><input name="email" type="email" autocomplete="email" maxlength="120" placeholder="voce@email.com"></label>
    <label class="campo"><span class="campo-rotulo">Mensagem</span><textarea name="mensagem" rows="4" maxlength="2000" placeholder="Conte o que você procura">${esc(mensagem)}</textarea></label>
    ${consentimento()}${armadilha()}
    <button class="btn btn-escuro btn-largo" type="submit"><span>${esc(botao)}</span>${ic('seta')}</button>
  </form>`;
}

/* ---------- páginas ---------- */
function home({ cfg, v, base, op, destaques, contagens }) {
  const cenas = [1, 2, 3].map(n => ({ img: cfg['hero_img_' + n], frase: cfg['hero_' + n] }));
  const rotulos = ['Chegada', 'Sala', 'Varanda'];
  const hero = `<section class="hero" data-hero aria-label="Apresentação">
    <div class="hero-palco">
      ${cenas.map((c, i) => `<div class="cena cena-${i + 1}" data-cena="${i}"><picture>${/^\/img\/hero\/cena\d\.webp$/.test(c.img) ? `<source media="(max-width: 700px)" srcset="${esc(c.img.replace('.webp', '-m.webp'))}">` : ''}<img src="${esc(c.img)}" alt="" ${i === 0 ? 'fetchpriority="high"' : 'loading="eager"'} decoding="async"></picture></div>`).join('')}
      <div class="hero-veu"></div>
      <div class="hero-frases">
        ${cenas.map((c, i) => `<p class="frase frase-${i + 1}" data-frase="${i}">${fraseComItalico(c.frase)}</p>`).join('')}
      </div>
      <div class="hero-final" data-hero-final>
        <p class="hero-sobre">${esc(cfg.slogan)}</p>
        <h1 class="hero-titulo">Seu próximo endereço pode <em>começar aqui.</em></h1>
        ${formBusca(op, {})}
      </div>
      <div class="hero-trilha" aria-hidden="true">
        ${rotulos.map((r, i) => `<span data-trilha="${i}"><b>0${i + 1}</b>${r}</span>`).join('')}
        <i class="hero-barra"><i data-hero-barra></i></i>
      </div>
      <p class="hero-dica" aria-hidden="true">Role para entrar</p>
    </div>
  </section>`;

  const cats = [
    { titulo: 'Casas com pátio', texto: 'Para quem quer grama, cachorro e churrasco no domingo.', href: '/imoveis?finalidade=venda&tipo=casa', img: '/exemplo/e1.webp', n: contagens.casa },
    { titulo: 'Apartamentos no centro', texto: 'Tudo a pé: padaria, banco, praça.', href: '/imoveis?tipo=apartamento', img: '/exemplo/c1.webp', n: contagens.apartamento },
    { titulo: 'Chácaras e sítios', texto: 'Espaço de sobra, açude e silêncio.', href: '/imoveis?tipo=chacara', img: '/exemplo/f1.webp', n: contagens.chacara },
    { titulo: 'Para alugar', texto: 'Casas e apartamentos prontos para morar.', href: '/imoveis?finalidade=aluguel', img: '/exemplo/h1.webp', n: contagens.aluguel },
  ];
  const whats = linkWhats(cfg, 'Olá! Quero ajuda para encontrar um imóvel.');

  const corpo = `${hero}
  <div class="busca-movel envolve">${formBusca(op, {})}</div>

  <section class="secao destaques" aria-labelledby="t-destaques">
    <div class="envolve secao-cabeca">
      <div><p class="sobretitulo" data-revela>Em destaque</p><h2 id="t-destaques" class="titulo-secao" data-revela>Endereços que já <em>falam por si.</em></h2></div>
      <div class="carrossel-ctrl"><a class="link-seta" href="/imoveis">Ver todos os imóveis ${ic('seta')}</a>
        <button class="btn-icone" type="button" data-carrossel-ant aria-label="Anteriores">${ic('voltar')}</button><button class="btn-icone" type="button" data-carrossel-prox aria-label="Próximos">${ic('seta')}</button></div>
    </div>
    <div class="carrossel" data-carrossel tabindex="0" aria-label="Imóveis em destaque">
      ${destaques.map((im, i) => cartao(im, { lazy: i > 2, classe: 'cartao-carrossel' })).join('')}
    </div>
  </section>

  <section class="secao estilos envolve" aria-labelledby="t-estilos">
    <p class="sobretitulo" data-revela>Escolha pelo jeito de viver</p>
    <h2 id="t-estilos" class="titulo-secao" data-revela>Que tipo de <em>rotina</em> você quer ter?</h2>
    <div class="estilos-grade">
      ${cats.map((c, i) => `<a class="estilo estilo-${i + 1}" href="${c.href}" data-revela>
        <img src="${c.img}" alt="" loading="lazy" decoding="async" width="640" height="800">
        <span class="estilo-texto"><strong>${esc(c.titulo)}</strong><span>${esc(c.texto)}</span>${c.n ? `<em>${c.n} ${c.n > 1 ? 'opções' : 'opção'}</em>` : ''}</span>
        <span class="estilo-seta">${ic('seta')}</span></a>`).join('')}
    </div>
  </section>

  <section class="secao sobre" id="sobre" aria-labelledby="t-sobre">
    <div class="envolve sobre-grade">
      <figure class="sobre-foto" data-revela><img src="${esc(cfg.corretor_foto || '/exemplo/e2.webp')}" alt="${cfg.corretor_foto ? esc(cfg.corretor_nome || 'Corretor') : ''}" loading="lazy" decoding="async" width="900" height="1100">
        ${cfg.corretor_nome ? `<figcaption><strong>${esc(cfg.corretor_nome)}</strong>${cfg.creci ? `<span>CRECI ${esc(cfg.creci)}</span>` : ''}</figcaption>` : ''}</figure>
      <div class="sobre-texto">
        <p class="sobretitulo" data-revela>Quem somos</p>
        <h2 id="t-sobre" class="titulo-secao" data-revela>${fraseComItalico(cfg.sobre_titulo)}</h2>
        <p class="sobre-p" data-revela>${esc(cfg.sobre_texto)}</p>
        <ol class="pilares">
          <li data-revela><span>01</span><div><strong>Curadoria</strong><p>Só anunciamos o que visitamos. Fotos reais, descrição honesta e documentação conferida antes de publicar.</p></div></li>
          <li data-revela><span>02</span><div><strong>Papel em dia</strong><p>Matrícula, financiamento, contrato e escritura: a gente acompanha cada etapa com você.</p></div></li>
          <li data-revela><span>03</span><div><strong>Atendimento de perto</strong><p>Você fala com quem conhece o imóvel. Sem robô, sem pressa, no seu horário.</p></div></li>
        </ol>
      </div>
    </div>
  </section>

  <section class="secao anuncie" aria-labelledby="t-anuncie">
    <div class="anuncie-fundo"><img src="/exemplo/g2.webp" alt="" loading="lazy" decoding="async"></div>
    <div class="envolve anuncie-in" data-revela>
      <p class="sobretitulo">Para proprietários</p>
      <h2 id="t-anuncie" class="titulo-secao">Quer vender ou alugar? <em>A gente cuida de tudo.</em></h2>
      <p>Avaliação justa, fotos bonitas, anúncio no site e nos portais, visitas acompanhadas e contrato seguro.</p>
      <a class="btn btn-claro" href="/anunciar">Anunciar meu imóvel ${ic('seta')}</a>
    </div>
  </section>

  <section class="secao contato envolve" id="contato" aria-labelledby="t-contato">
    <div class="contato-texto">
      <p class="sobretitulo" data-revela>Contato</p>
      <h2 id="t-contato" class="titulo-secao" data-revela>Vamos encontrar <em>o lugar certo</em> pra você?</h2>
      <p data-revela>Conte o que você procura: bairro, quantos quartos, quanto quer investir. Respondemos no mesmo dia útil.</p>
      <ul class="contato-lista" data-revela>
        ${whats ? `<li><a href="${esc(whats)}" target="_blank" rel="noopener">${ic('whatsapp')}<span><strong>WhatsApp</strong>${esc(cfg.whatsapp)}</span></a></li>` : ''}
        ${cfg.telefone ? `<li><a href="tel:+55${soDigitos(cfg.telefone)}">${ic('telefone')}<span><strong>Telefone</strong>${esc(cfg.telefone)}</span></a></li>` : ''}
        ${cfg.email ? `<li><a href="mailto:${esc(cfg.email)}">${ic('email')}<span><strong>E-mail</strong>${esc(cfg.email)}</span></a></li>` : ''}
        ${cfg.endereco ? `<li><span class="li-sem-link">${ic('pin')}<span><strong>Endereço</strong>${esc(cfg.endereco)}</span></span></li>` : ''}
        ${cfg.horario ? `<li><span class="li-sem-link">${ic('relogio')}<span><strong>Horário</strong>${esc(cfg.horario)}</span></span></li>` : ''}
      </ul>
    </div>
    <div class="contato-form" data-revela>${formContato()}</div>
  </section>`;

  return moldura({ cfg, v, base, corpo, classe: 'pg-home', descricao: `${cfg.nome}: casas, apartamentos, chácaras e terrenos à venda e para alugar. ${cfg.slogan}.`,
    dados: { faixas: FAIXAS } });
}

function fraseComItalico(frase) {
  // a última parte da frase (depois da última vírgula ou as duas últimas palavras) vai em itálico
  const s = String(frase || '').trim();
  const iv = s.lastIndexOf(',');
  if (iv > 0 && iv < s.length - 3) return `${esc(s.slice(0, iv + 1))} <em>${esc(s.slice(iv + 1).trim())}</em>`;
  const p = s.split(' ');
  if (p.length < 3) return `<em>${esc(s)}</em>`;
  return `${esc(p.slice(0, -2).join(' '))} <em>${esc(p.slice(-2).join(' '))}</em>`;
}

function listagem({ cfg, v, base, op, f, r, canonico }) {
  const fin = f.finalidade === 'aluguel' ? 'aluguel' : f.finalidade === 'venda' ? 'venda' : '';
  const tipoNome = f.tipo && TIPOS[f.tipo] ? TIPOS[f.tipo] : '';
  const titulo = `${tipoNome ? (tipoNome.endsWith('ão') ? tipoNome.replace(/ão$/, 'ões') : tipoNome + 's') : 'Imóveis'}${fin === 'venda' ? ' à venda' : fin === 'aluguel' ? ' para alugar' : ''}${f.cidade ? ' em ' + f.cidade : ''}`;
  const qs = extra => { const u = new URLSearchParams(); for (const [k, val] of Object.entries({ ...f, ...extra })) if (val && k !== 'porPagina' && !(k === 'pagina' && Number(val) === 1)) u.set(k, val); const s = u.toString(); return '/imoveis' + (s ? '?' + s : ''); };
  const bairros = op.bairros.filter(b => !f.cidade || b.cidade.toLowerCase() === f.cidade.toLowerCase());
  const tipos = Object.entries(TIPOS).filter(([k]) => !op.tipos.length || op.tipos.some(t => t.tipo === k));
  const faixa = f.min || f.max ? `${f.min || 0}-${f.max || ''}` : '';
  const filtrosAtivos = ['tipo', 'cidade', 'bairro', 'quartos', 'vagas', 'min', 'max', 'texto'].filter(k => f[k]).length;
  const paginas = [];
  for (let i = 1; i <= r.paginas; i++) if (i === 1 || i === r.paginas || Math.abs(i - r.pagina) <= 1) paginas.push(i); else if (paginas[paginas.length - 1] !== '…') paginas.push('…');
  const corpo = `<section class="lista-topo envolve">
    <nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span>/</span><span aria-current="page">Imóveis</span></nav>
    <h1 class="titulo-pagina">${esc(titulo)}</h1>
    <p class="lista-total"><strong>${r.total}</strong> ${r.total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}</p>
  </section>
  <form class="filtros envolve" action="/imoveis" method="get" data-filtros>
    <fieldset class="segmento segmento-pequeno" aria-label="Finalidade">
      <label><input type="radio" name="finalidade" value=""${!fin ? ' checked' : ''}><span>Todos</span></label>
      <label><input type="radio" name="finalidade" value="venda"${fin === 'venda' ? ' checked' : ''}><span>Comprar</span></label>
      <label><input type="radio" name="finalidade" value="aluguel"${fin === 'aluguel' ? ' checked' : ''}><span>Alugar</span></label>
    </fieldset>
    ${campoSelect('tipo', 'Tipo', tipos, f.tipo, { vazio: 'Todos os tipos', classe: 'campo-filtro' })}
    ${campoSelect('cidade', 'Cidade', op.cidades.map(c => [c.cidade, c.cidade]), f.cidade, { vazio: 'Todas as cidades', classe: 'campo-filtro' })}
    <button class="btn btn-fantasma filtros-mais" type="button" data-abre-dialogo="mais-filtros">${ic('filtro')}Mais filtros${filtrosAtivos ? `<span class="bolinha">${filtrosAtivos}</span>` : ''}</button>
    ${campoSelect('ordem', 'Ordenar', [['destaque', 'Mais relevantes'], ['recentes', 'Mais recentes'], ['menor', 'Menor valor'], ['maior', 'Maior valor'], ['area', 'Maior área']], f.ordem || 'destaque', { classe: 'campo-filtro campo-ordem' })}
    <noscript><button class="btn btn-escuro" type="submit">Filtrar</button></noscript>
    <dialog class="dialogo dialogo-lado" id="mais-filtros" aria-labelledby="t-mais">
      <div class="dialogo-cabeca"><h2 id="t-mais">Mais filtros</h2><button class="btn-icone" type="button" data-fecha-dialogo aria-label="Fechar">${ic('fechar')}</button></div>
      <div class="dialogo-corpo">
        <label class="campo"><span class="campo-rotulo">Código ou palavra</span><input name="texto" value="${esc(f.texto || '')}" placeholder="Ex.: IM-0104 ou piscina" maxlength="60"></label>
        ${campoSelect('bairro', 'Bairro', bairros.map(b => [b.bairro, b.bairro]), f.bairro, { vazio: 'Todos os bairros' })}
        ${campoSelect('faixa', 'Valor', FAIXAS[fin || 'venda'], faixa, { classe: 'campo-faixa' })}
        <fieldset class="chips"><legend class="campo-rotulo">Dormitórios</legend>
          ${['', '1', '2', '3', '4'].map(q => `<label><input type="radio" name="quartos" value="${q}"${String(f.quartos || '') === q ? ' checked' : ''}><span>${q ? q + '+' : 'Tanto faz'}</span></label>`).join('')}</fieldset>
        <fieldset class="chips"><legend class="campo-rotulo">Vagas de garagem</legend>
          ${['', '1', '2', '3'].map(q => `<label><input type="radio" name="vagas" value="${q}"${String(f.vagas || '') === q ? ' checked' : ''}><span>${q ? q + '+' : 'Tanto faz'}</span></label>`).join('')}</fieldset>
      </div>
      <div class="dialogo-pe"><a class="btn btn-fantasma" href="/imoveis${fin ? '?finalidade=' + fin : ''}">Limpar</a><button class="btn btn-escuro" type="submit">Ver resultados</button></div>
    </dialog>
  </form>
  <section class="envolve lista-resultados" aria-label="Resultados">
    ${r.itens.length ? `<div class="grade-cartoes">${r.itens.map((im, i) => cartao(im, { lazy: i > 2 })).join('')}</div>` :
      `<div class="vazio"><h2>Nada por aqui com esses filtros.</h2><p>Tente tirar algum filtro, ou conte pra gente o que você procura: muitos imóveis chegam antes de ir para o site.</p><div class="vazio-acoes"><a class="btn btn-fantasma" href="/imoveis">Limpar filtros</a>${linkWhats(cfg) ? `<a class="btn btn-escuro" href="${esc(linkWhats(cfg, 'Olá! Procuro um imóvel e não achei no site. Podem me ajudar?'))}" target="_blank" rel="noopener">${ic('whatsapp')}Pedir ajuda</a>` : ''}</div></div>`}
    ${r.paginas > 1 ? `<nav class="paginacao" aria-label="Páginas">${r.pagina > 1 ? `<a href="${esc(qs({ pagina: r.pagina - 1 }))}" aria-label="Página anterior">${ic('voltar')}</a>` : ''}${paginas.map(p => p === '…' ? '<span>…</span>' : p === r.pagina ? `<span aria-current="page">${p}</span>` : `<a href="${esc(qs({ pagina: p }))}">${p}</a>`).join('')}${r.pagina < r.paginas ? `<a href="${esc(qs({ pagina: r.pagina + 1 }))}" aria-label="Próxima página">${ic('seta')}</a>` : ''}</nav>` : ''}
  </section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: r.itens.map((im, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/imovel/${im.slug}` })) };
  return moldura({ cfg, v, base, corpo, classe: 'pg-lista', titulo, canonico, descricao: `${titulo}: ${r.total} opções com fotos, valores e localização. ${cfg.nome}.`, jsonld: [ld], dados: { faixas: FAIXAS } });
}

function ficha({ cfg, v, base, im, fotos, semelhantes }) {
  const url = `${base}/imovel/${im.slug}`;
  const whatsMsg = `Olá! Tenho interesse no imóvel ${im.codigo}: ${im.titulo}. ${url}`;
  const whats = linkWhats(cfg, whatsMsg);
  const yt = idYoutube(im.video_url);
  const lugar = im.mostrar_endereco && im.endereco ? `${im.endereco}, ${im.bairro ? im.bairro + ', ' : ''}${im.cidade || ''} ${im.uf || ''}` : `${im.bairro ? im.bairro + ', ' : ''}${im.cidade || ''} ${im.uf || ''}`;
  const sp = specs(im).map(([i, val, r]) => `<li>${ic(i)}<strong>${esc(val)}</strong><span>${esc(r)}</span></li>`).join('');
  const custos = [im.condominio ? ['Condomínio', reais(im.condominio) + '/mês'] : null, im.iptu ? ['IPTU', reais(im.iptu) + (im.finalidade === 'aluguel' ? '/mês' : '/ano')] : null].filter(Boolean);
  const selo = im.situacao !== 'disponivel' ? `<span class="selo selo-${im.situacao === 'reservado' ? 'reservado' : 'fechado'}">${SITUACOES[im.situacao]}</span>` : '';
  const desc = String(im.descricao || '').split(/\n{2,}|\r\n\r\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const galeria = fotos.length ? `<div class="galeria galeria-${Math.min(fotos.length, 5)}" data-galeria>
      ${fotos.slice(0, 5).map((f, i) => `<button type="button" class="galeria-item" data-abre-foto="${i}" aria-label="Ampliar foto ${i + 1} de ${fotos.length}${f.legenda ? ': ' + esc(f.legenda) : ''}"><img src="${esc(i === 0 ? f.grande : f.pequena)}" alt="${esc(f.legenda || im.titulo)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></button>`).join('')}
      <button type="button" class="btn btn-claro btn-pequeno galeria-todas" data-abre-foto="0">${ic('fotos')}Ver as ${fotos.length} fotos</button>
    </div>
    <div class="galeria-movel" data-galeria-movel>
      <div class="galeria-trilho" data-trilho>${fotos.map((f, i) => `<button type="button" class="galeria-slide" data-abre-foto="${i}" aria-label="Ampliar foto ${i + 1}"><img src="${esc(f.pequena)}" alt="${esc(f.legenda || im.titulo)}" ${i > 1 ? 'loading="lazy"' : ''} decoding="async"></button>`).join('')}</div>
      <span class="galeria-contador" data-contador>1 / ${fotos.length}</span>
    </div>` : `<div class="galeria-vazia envolve">Fotos em breve.</div>`;

  const simulador = im.finalidade === 'venda' && im.preco ? `<section class="bloco simulador" aria-labelledby="t-sim" data-simulador data-preco="${im.preco}">
      <h2 id="t-sim" class="bloco-titulo">${ic('calc')}Simule o financiamento</h2>
      <div class="sim-grade">
        <label class="campo"><span class="campo-rotulo">Entrada</span><span class="campo-com-sufixo"><input type="range" min="20" max="80" step="5" value="30" name="entrada"><output data-saida="entrada">30%</output></span></label>
        <label class="campo"><span class="campo-rotulo">Prazo</span><span class="campo-com-sufixo"><input type="range" min="60" max="420" step="12" value="360" name="prazo"><output data-saida="prazo">30 anos</output></span></label>
        <label class="campo"><span class="campo-rotulo">Juros ao ano</span><span class="campo-com-sufixo"><input type="range" min="8" max="14" step="0.25" value="11" name="juros"><output data-saida="juros">11%</output></span></label>
      </div>
      <div class="sim-resultado"><div><span>Primeira parcela (SAC)</span><strong data-saida="parcela">…</strong></div><div><span>Valor financiado</span><strong data-saida="financiado">…</strong></div></div>
      <p class="nota">Simulação aproximada, sem seguros e taxas. Os valores reais dependem da análise do banco.</p>
    </section>` : '';

  const visita = `<dialog class="dialogo" id="agendar" aria-labelledby="t-agendar">
    <div class="dialogo-cabeca"><div><p class="sobretitulo">${esc(im.codigo)}</p><h2 id="t-agendar">Agendar uma visita</h2></div><button class="btn-icone" type="button" data-fecha-dialogo aria-label="Fechar">${ic('fechar')}</button></div>
    <form class="form dialogo-corpo" data-form-lead novalidate>
      <input type="hidden" name="origem" value="visita"><input type="hidden" name="imovel_id" value="${im.id}">
      <div class="grade-2">
        <label class="campo"><span class="campo-rotulo">Dia preferido</span><input type="date" name="data" required data-data-minima></label>
        <fieldset class="chips chips-cheios"><legend class="campo-rotulo">Período</legend>
          <label><input type="radio" name="periodo" value="manhã" checked><span>Manhã</span></label><label><input type="radio" name="periodo" value="tarde"><span>Tarde</span></label></fieldset>
      </div>
      <div class="grade-2">
        <label class="campo"><span class="campo-rotulo">Seu nome</span><input name="nome" autocomplete="name" required maxlength="80"></label>
        <label class="campo"><span class="campo-rotulo">WhatsApp</span><input name="telefone" type="tel" inputmode="tel" autocomplete="tel" required data-mascara="telefone" placeholder="(55) 99999-9999"></label>
      </div>
      <label class="campo"><span class="campo-rotulo">Algum recado? <em>opcional</em></span><textarea name="mensagem" rows="2" maxlength="600"></textarea></label>
      ${consentimento()}${armadilha()}
      <button class="btn btn-escuro btn-largo" type="submit"><span>Pedir agendamento</span>${ic('calendario')}</button>
      <p class="nota">A gente confirma o horário com você pelo WhatsApp.</p>
    </form>
  </dialog>`;

  const corpo = `${galeria}
  <div class="envolve ficha">
    <div class="ficha-principal">
      <nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span>/</span><a href="/imoveis?finalidade=${im.finalidade}">${im.finalidade === 'aluguel' ? 'Alugar' : 'Comprar'}</a><span>/</span><span aria-current="page">${esc(im.codigo)}</span></nav>
      <div class="ficha-selos"><span class="selo">${im.finalidade === 'aluguel' ? 'Aluguel' : 'Venda'}</span><span class="selo selo-claro">${esc(TIPOS[im.tipo] || '')}</span>${selo}${im.exemplo ? '<span class="selo selo-exemplo">Imóvel de exemplo</span>' : ''}</div>
      <h1 class="ficha-titulo">${esc(im.titulo)}</h1>
      <p class="ficha-local">${ic('pin')}${esc(lugar.trim())}</p>
      ${sp ? `<ul class="ficha-specs">${sp}</ul>` : ''}
      ${im.resumo ? `<p class="ficha-resumo">${esc(im.resumo)}</p>` : ''}
      ${desc ? `<section class="bloco" aria-labelledby="t-desc"><h2 id="t-desc" class="bloco-titulo">Sobre o imóvel</h2><div class="texto-longo" data-texto-longo>${desc}</div></section>` : ''}
      ${im.caracteristicas.length ? `<section class="bloco" aria-labelledby="t-car"><h2 id="t-car" class="bloco-titulo">O que tem</h2><ul class="caracteristicas">${im.caracteristicas.map(c => `<li>${ic('check')}${esc(c)}</li>`).join('')}${im.financiamento ? `<li>${ic('check')}Aceita financiamento</li>` : ''}${im.permuta ? `<li>${ic('check')}Aceita permuta</li>` : ''}</ul></section>` : ''}
      ${yt ? `<section class="bloco" aria-labelledby="t-video"><h2 id="t-video" class="bloco-titulo">Vídeo</h2><button type="button" class="video-capa" data-video="${esc(yt)}" aria-label="Assistir ao vídeo do imóvel"><img src="https://i.ytimg.com/vi/${esc(yt)}/hqdefault.jpg" alt="" loading="lazy"><span>${ic('play')}</span></button></section>` : ''}
      <section class="bloco" aria-labelledby="t-mapa"><h2 id="t-mapa" class="bloco-titulo">Localização</h2>
        <p class="nota">${im.mostrar_endereco ? esc(lugar) : `Região aproximada: ${esc(lugar.trim())}. O endereço exato é passado no agendamento da visita.`}</p>
        <button type="button" class="mapa-capa" data-mapa="${esc(lugar.trim())}"><span>${ic('pin')}Ver no mapa</span></button></section>
      ${simulador}
    </div>
    <aside class="ficha-lado" aria-label="Valores e contato">
      <div class="cartao-preco-lado" data-revela>
        <p class="sobretitulo">${im.finalidade === 'aluguel' ? 'Aluguel' : 'Valor de venda'}</p>
        <p class="preco-grande">${precoTexto(im)}</p>
        ${custos.length ? `<dl class="custos">${custos.map(([k, val]) => `<div><dt>${k}</dt><dd>${val}</dd></div>`).join('')}</dl>` : ''}
        <div class="lado-acoes">
          <button class="btn btn-escuro btn-largo" type="button" data-abre-dialogo="agendar">${ic('calendario')}Agendar visita</button>
          ${whats ? `<a class="btn btn-fantasma btn-largo" href="${esc(whats)}" target="_blank" rel="noopener" data-whats-imovel="${im.id}">${ic('whatsapp')}Conversar no WhatsApp</a>` : ''}
        </div>
        <div class="lado-mini">
          <button type="button" class="link-acao" data-favoritar="${im.id}" aria-pressed="false">${ic('coracao')}<span>Salvar</span></button>
          <button type="button" class="link-acao" data-compartilhar data-titulo="${esc(im.titulo)}">${ic('compartilhar')}<span>Compartilhar</span></button>
          <span class="codigo">Cód. ${esc(im.codigo)}</span>
        </div>
      </div>
      <div class="lado-form">${formContato({ origem: 'contato', imovel: im, titulo: 'Quer mais informações?', botao: 'Quero saber mais', mensagem: `Olá! Quero mais informações sobre o imóvel ${im.codigo}.` })}</div>
    </aside>
  </div>
  ${semelhantes.length ? `<section class="secao envolve" aria-labelledby="t-sem"><h2 id="t-sem" class="titulo-secao">Você também pode <em>gostar.</em></h2><div class="grade-cartoes">${semelhantes.map(s => cartao(s)).join('')}</div></section>` : ''}
  <div class="barra-ficha" data-barra-ficha>
    <div><span>${im.finalidade === 'aluguel' ? 'Aluguel' : 'Venda'}</span><strong>${precoTexto(im)}</strong></div>
    ${whats ? `<a class="btn-icone btn-icone-cheio" href="${esc(whats)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('whatsapp')}</a>` : ''}
    <button class="btn btn-escuro btn-pequeno" type="button" data-abre-dialogo="agendar">Agendar visita</button>
  </div>
  ${visita}
  <dialog class="visor" id="visor" aria-label="Fotos do imóvel" data-visor>
    <div class="visor-topo"><span data-visor-contador>1 / ${fotos.length}</span><span class="visor-legenda" data-visor-legenda></span><button class="btn-icone btn-icone-claro" type="button" data-fecha-dialogo aria-label="Fechar fotos">${ic('fechar')}</button></div>
    <div class="visor-palco" data-visor-palco><img alt="" data-visor-img></div>
    <button class="visor-nav visor-ant" type="button" data-visor-ant aria-label="Foto anterior">${ic('voltar')}</button>
    <button class="visor-nav visor-prox" type="button" data-visor-prox aria-label="Próxima foto">${ic('seta')}</button>
    <div class="visor-miniaturas" data-visor-mini>${fotos.map((f, i) => `<button type="button" data-ir-foto="${i}" aria-label="Foto ${i + 1}"><img src="${esc(f.pequena)}" alt="" loading="lazy"></button>`).join('')}</div>
  </dialog>`;

  const ld = {
    '@context': 'https://schema.org', '@type': 'RealEstateListing', name: im.titulo, url, description: im.resumo || String(im.descricao || '').slice(0, 300),
    datePosted: im.criado_em.slice(0, 10), image: fotos.slice(0, 8).map(f => base + f.grande),
    offers: { '@type': 'Offer', price: im.preco || undefined, priceCurrency: 'BRL', availability: im.situacao === 'disponivel' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', businessFunction: im.finalidade === 'aluguel' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell' },
    about: { '@type': im.tipo === 'apartamento' || im.tipo === 'cobertura' ? 'Apartment' : im.tipo === 'terreno' ? 'Place' : 'SingleFamilyResidence',
      ...(im.quartos ? { numberOfRooms: im.quartos, numberOfBedrooms: im.quartos } : {}), ...(im.banheiros ? { numberOfBathroomsTotal: im.banheiros } : {}),
      ...(im.area_util ? { floorSize: { '@type': 'QuantitativeValue', value: im.area_util, unitCode: 'MTK' } } : {}),
      address: { '@type': 'PostalAddress', addressLocality: im.cidade || undefined, addressRegion: im.uf || undefined, addressCountry: 'BR' } },
  };
  const migalhas = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: base + '/' },
    { '@type': 'ListItem', position: 2, name: im.finalidade === 'aluguel' ? 'Alugar' : 'Comprar', item: `${base}/imoveis?finalidade=${im.finalidade}` },
    { '@type': 'ListItem', position: 3, name: im.titulo, item: url }] };
  return moldura({ cfg, v, base, corpo, classe: 'pg-ficha', titulo: `${im.titulo}${im.bairro ? ' · ' + im.bairro : ''}`, canonico: `/imovel/${im.slug}`,
    descricao: `${TIPOS[im.tipo] || 'Imóvel'} ${im.finalidade === 'aluguel' ? 'para alugar' : 'à venda'}${im.bairro ? ' no ' + im.bairro : ''}${im.cidade ? ', ' + im.cidade : ''}. ${specs(im, true).map(s => s[1] + ' ' + s[2]).join(', ')}. ${im.resumo || ''}`.slice(0, 160),
    og: fotos[0]?.grande, jsonld: [ld, migalhas], dados: { fotos: fotos.map(f => ({ g: f.grande, p: f.pequena, l: f.legenda || '' })) } });
}

function anunciar({ cfg, v, base }) {
  const tipos = Object.entries(TIPOS);
  const corpo = `<section class="anunciar envolve">
    <div class="anunciar-texto">
      <nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span>/</span><span aria-current="page">Anunciar</span></nav>
      <h1 class="titulo-pagina">Seu imóvel merece <em>ser bem apresentado.</em></h1>
      <p class="anunciar-lead">Preencha o básico. A gente liga para combinar uma visita de avaliação, sem compromisso.</p>
      <ol class="passos">
        <li><span>1</span><div><strong>Avaliação</strong><p>Visitamos o imóvel e sugerimos um valor com base no mercado da região.</p></div></li>
        <li><span>2</span><div><strong>Fotos e anúncio</strong><p>Fazemos fotos caprichadas e publicamos no site e nos principais portais.</p></div></li>
        <li><span>3</span><div><strong>Visitas e contrato</strong><p>Filtramos os interessados, acompanhamos as visitas e cuidamos da papelada.</p></div></li>
      </ol>
    </div>
    <form class="form form-cartao" data-form-lead novalidate>
      <input type="hidden" name="origem" value="anunciar">
      <fieldset class="segmento segmento-pequeno"><legend class="campo-rotulo">Você quer</legend>
        <label><input type="radio" name="finalidade" value="vender" checked><span>Vender</span></label><label><input type="radio" name="finalidade" value="alugar"><span>Alugar</span></label></fieldset>
      <div class="grade-2">
        ${campoSelect('tipo', 'Tipo de imóvel', tipos, 'casa')}
        <label class="campo"><span class="campo-rotulo">Dormitórios</span><input name="quartos" inputmode="numeric" maxlength="2" placeholder="Ex.: 3"></label>
      </div>
      <div class="grade-2">
        <label class="campo"><span class="campo-rotulo">Cidade</span><input name="cidade" maxlength="80" autocomplete="address-level2"></label>
        <label class="campo"><span class="campo-rotulo">Bairro</span><input name="bairro" maxlength="80"></label>
      </div>
      <div class="grade-2">
        <label class="campo"><span class="campo-rotulo">Área aproximada <em>opcional</em></span><input name="area" inputmode="numeric" maxlength="12" placeholder="Ex.: 180 m²"></label>
        <label class="campo"><span class="campo-rotulo">Valor que imagina <em>opcional</em></span><input name="valor" inputmode="numeric" data-mascara="dinheiro" maxlength="20" placeholder="R$"></label>
      </div>
      <hr>
      <div class="grade-2">
        <label class="campo"><span class="campo-rotulo">Seu nome</span><input name="nome" autocomplete="name" required maxlength="80"></label>
        <label class="campo"><span class="campo-rotulo">WhatsApp</span><input name="telefone" type="tel" inputmode="tel" autocomplete="tel" required data-mascara="telefone" placeholder="(55) 99999-9999"></label>
      </div>
      <label class="campo"><span class="campo-rotulo">E-mail <em>opcional</em></span><input name="email" type="email" autocomplete="email" maxlength="120"></label>
      <label class="campo"><span class="campo-rotulo">Algo mais que a gente deva saber? <em>opcional</em></span><textarea name="mensagem" rows="3" maxlength="2000" placeholder="Reformas, documentação, se está ocupado..."></textarea></label>
      ${consentimento()}${armadilha()}
      <button class="btn btn-escuro btn-largo" type="submit"><span>Quero uma avaliação</span>${ic('seta')}</button>
    </form>
  </section>`;
  return moldura({ cfg, v, base, corpo, classe: 'pg-anunciar', titulo: 'Anuncie seu imóvel', canonico: '/anunciar', descricao: `Venda ou alugue seu imóvel com a ${cfg.nome}: avaliação, fotos, anúncio e contrato.` });
}

function favoritos({ cfg, v, base }) {
  const corpo = `<section class="envolve lista-topo">
    <nav class="trilha" aria-label="Você está em"><a href="/">Início</a><span>/</span><span aria-current="page">Favoritos</span></nav>
    <h1 class="titulo-pagina">Seus <em>favoritos</em></h1>
    <p class="lista-total">Ficam guardados neste aparelho. Toque no coração de qualquer imóvel para salvar.</p>
  </section>
  <section class="envolve lista-resultados"><div class="grade-cartoes" data-lista-favoritos></div>
    <div class="vazio" data-favoritos-vazio hidden><h2>Nenhum favorito ainda.</h2><p>Quando um imóvel chamar sua atenção, toque no coração para encontrar ele aqui depois.</p><div class="vazio-acoes"><a class="btn btn-escuro" href="/imoveis">Ver imóveis</a></div></div>
    <noscript><p class="vazio">Os favoritos precisam do JavaScript ligado.</p></noscript></section>`;
  return moldura({ cfg, v, base, corpo, classe: 'pg-favoritos', titulo: 'Favoritos', canonico: '/favoritos' });
}

function privacidade({ cfg, v, base }) {
  const corpo = `<article class="envolve texto-pagina">
    <h1 class="titulo-pagina">Política de <em>privacidade</em></h1>
    <p>Esta página explica, de forma simples, como a ${esc(cfg.nome)} trata os seus dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
    <h2>Quais dados coletamos</h2><p>Somente o que você informa nos formulários: nome, telefone, e-mail e a mensagem. Quando você agenda uma visita ou pede informações, guardamos também qual imóvel despertou o seu interesse.</p>
    <h2>Para que usamos</h2><p>Para responder ao seu pedido, agendar visitas e enviar opções de imóveis parecidas com o que você procura. Não vendemos nem repassamos seus dados para terceiros.</p>
    <h2>Cookies e estatísticas</h2><p>Os favoritos ficam guardados apenas no seu aparelho. ${cfg.ga4 || cfg.pixel_meta ? 'Ferramentas de estatística (como o Google Analytics) só são carregadas se você aceitar no aviso de cookies.' : 'Este site não usa ferramentas de rastreamento.'}</p>
    <h2>Por quanto tempo</h2><p>Mantemos os contatos enquanto houver atendimento em andamento e por até 2 anos depois, salvo obrigação legal.</p>
    <h2>Seus direitos</h2><p>Você pode pedir a qualquer momento para ver, corrigir ou apagar seus dados${cfg.email ? ` pelo e-mail <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>` : ''}${cfg.whatsapp ? ' ou pelo WhatsApp' : ''}.</p>
  </article>`;
  return moldura({ cfg, v, base, corpo, classe: 'pg-texto', titulo: 'Privacidade', canonico: '/privacidade' });
}

function naoEncontrado({ cfg, v, base }) {
  const corpo = `<section class="envolve nao-achou"><p class="sobretitulo">Erro 404</p><h1 class="titulo-pagina">Essa porta <em>não abre.</em></h1><p>A página pode ter mudado de endereço ou o imóvel já encontrou dono.</p><div class="vazio-acoes"><a class="btn btn-escuro" href="/imoveis">Ver imóveis disponíveis</a><a class="btn btn-fantasma" href="/">Voltar ao início</a></div></section>`;
  return moldura({ cfg, v, base, corpo, classe: 'pg-404', titulo: 'Página não encontrada' });
}

module.exports = { cartao, home, listagem, ficha, anunciar, favoritos, privacidade, naoEncontrado, FAIXAS, ic };
