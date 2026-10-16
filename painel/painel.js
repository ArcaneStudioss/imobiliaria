/* Painel da imobiliária: imóveis, fotos, contatos, conteúdo do site e backup. Sem bibliotecas. */
(() => {
  'use strict';
  const d = document, app = d.getElementById('app');
  const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reais = n => n == null || n === '' ? '' : 'R$ ' + Math.round(Number(n)).toLocaleString('pt-BR');
  const quando = iso => { const dt = new Date(iso), h = new Date(); const dia = dt.toDateString() === h.toDateString() ? 'Hoje' : dt.toDateString() === new Date(Date.now() - 864e5).toDateString() ? 'Ontem' : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); return `${dia}, ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; };
  const TIPOS = { casa: 'Casa', sobrado: 'Sobrado', apartamento: 'Apartamento', cobertura: 'Cobertura', chacara: 'Chácara', sitio: 'Sítio', terreno: 'Terreno', comercial: 'Sala comercial', galpao: 'Galpão' };
  const SITUACOES = { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido', alugado: 'Alugado' };
  const LEAD_SIT = { novo: 'Novo', em_atendimento: 'Em atendimento', concluido: 'Concluído', descartado: 'Descartado' };
  const ORIGENS = { contato: 'Contato', visita: 'Visita', anunciar: 'Quer anunciar', whatsapp: 'WhatsApp' };
  const CARACTERISTICAS = ['Piscina', 'Churrasqueira', 'Lareira', 'Área gourmet', 'Jardim', 'Pátio', 'Varanda', 'Sacada', 'Ar-condicionado', 'Aquecimento a gás', 'Energia solar', 'Mobiliado', 'Semimobiliado', 'Closet', 'Escritório', 'Lavanderia', 'Despensa', 'Portão eletrônico', 'Câmeras', 'Elevador', 'Portaria 24h', 'Salão de festas', 'Academia', 'Playground', 'Aceita pet', 'Vista panorâmica', 'Poço artesiano', 'Pomar'];
  const I = {
    inicio: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z"/>',
    imoveis: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    contatos: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5v-8Z"/>',
    site: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z"/>',
    conta: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5"/>',
    mais: '<path d="M12 5v14M5 12h14"/>', fechar: '<path d="M6 6l12 12M18 6 6 18"/>', seta: '<path d="M5 12h14m-6-6 6 6-6 6"/>', voltar: '<path d="M19 12H5m6 6-6-6 6-6"/>',
    lixo: '<path d="M5 7h14M10 7V4.5h4V7m-7 0 1 12.5h8L17 7"/>', editar: '<path d="M5 19h4L19.5 8.5a2.1 2.1 0 0 0-3-3L6 16v3Z"/>', olho: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    estrela: '<path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7L12 4Z"/>', foto: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10.5" r="1.8"/><path d="m21 16-5-5-8 8"/>',
    nuvem: '<path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.5 4.5 0 0 0 7 18Z"/><path d="M12 11v5m-2.2-2.8L12 11l2.2 2.2"/>', whats: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z"/><path d="M9 9.5c0 2.8 2.7 5.5 5.5 5.5l1.2-1.3-1.8-1-1 .8a4 4 0 0 1-2-2l.8-1-1-1.8L9 9.5Z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', alerta: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5m0 3h.01"/>', baixar: '<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14"/>', sair: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
    escudo: '<path d="M12 3.5 5 6v5.5c0 4.3 3 7.8 7 9 4-1.2 7-4.7 7-9V6l-7-2.5Z"/>', capa: '<path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7L12 4Z"/>', esq: '<path d="m14.5 6-6 6 6 6"/>', dir: '<path d="m9.5 6 6 6-6 6"/>', link: '<path d="M14 4h6v6m0-6-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  };
  const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;

  /* ---------- comunicação com o servidor ---------- */
  async function api(metodo, caminho, corpo) {
    const op = { method: metodo, headers: { 'X-Painel': '1' }, credentials: 'same-origin' };
    if (corpo !== undefined) { op.headers['Content-Type'] = 'application/json'; op.body = JSON.stringify(corpo); }
    let r; try { r = await fetch('/api/admin' + caminho, op); } catch { throw Object.assign(new Error('Sem conexão com o servidor. Confira a internet.'), { status: 0 }); }
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && caminho !== '/entrar') { estado.usuario = null; ir('#/entrar'); }
    if (!r.ok) throw Object.assign(new Error(j.erro || 'Algo deu errado.'), { status: r.status, campo: j.campo });
    return j;
  }

  /* ---------- avisos e janelas próprias ---------- */
  function avisar(msg, tipo = 'ok') {
    const el = d.createElement('div'); el.className = 'aviso' + (tipo === 'erro' ? ' aviso-erro' : ''); el.setAttribute('role', 'status');
    el.innerHTML = ic(tipo === 'erro' ? 'alerta' : 'check'); const s = d.createElement('span'); s.textContent = msg; el.append(s);
    $('#avisos').append(el); setTimeout(() => { el.classList.add('saindo'); setTimeout(() => el.remove(), 300); }, 3800);
  }
  function janela({ titulo, sub = '', corpo, acoes = '', larga = false, aoAbrir }) {
    const dlg = d.createElement('dialog'); dlg.className = 'janela' + (larga ? ' janela-larga' : '');
    dlg.innerHTML = `<form method="dialog" class="janela-form" novalidate><div class="janela-cabeca"><div>${sub ? `<p class="sobre">${sub}</p>` : ''}<h2>${titulo}</h2></div><button type="button" class="btn-icone" data-fechar aria-label="Fechar">${ic('fechar')}</button></div><div class="janela-corpo">${corpo}</div>${acoes ? `<div class="janela-pe">${acoes}</div>` : ''}</form>`;
    d.body.append(dlg);
    const fechar = () => { dlg.classList.add('fechando'); setTimeout(() => { dlg.close(); dlg.remove(); }, 200); };
    dlg.addEventListener('cancel', e => { e.preventDefault(); fechar(); });
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-fechar]')) fechar(); });
    dlg.showModal(); aoAbrir?.(dlg, fechar);
    const p = $('input:not([type=hidden]):not([type=checkbox]), textarea', dlg); if (p && matchMedia('(pointer: fine)').matches) setTimeout(() => p.focus(), 50);
    return { dlg, fechar, form: $('form', dlg) };
  }
  function confirmar({ titulo, texto, botao = 'Confirmar', perigo = false }) {
    return new Promise(ok => {
      const { dlg, fechar } = janela({ titulo, corpo: `<p class="texto-janela">${texto}</p>`, acoes: `<button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button><button type="button" class="btn ${perigo ? 'btn-perigo' : 'btn-escuro'}" data-sim>${botao}</button>` });
      let r = false; $('[data-sim]', dlg).addEventListener('click', () => { r = true; fechar(); });
      dlg.addEventListener('close', () => ok(r));
    });
  }
  function erroCampo(form, e) {
    $$('.erro', form).forEach(c => { c.classList.remove('erro'); $('.campo-erro', c)?.remove(); });
    const el = e.campo && form.elements[e.campo];
    if (el && el.closest('.campo')) { const c = el.closest('.campo'); c.classList.add('erro'); const s = d.createElement('span'); s.className = 'campo-erro'; s.textContent = e.message; c.append(s); el.focus?.(); }
    else avisar(e.message, 'erro');
  }
  async function ocupado(btn, fn) {
    if (!btn) return fn(); const antes = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="giro giro-p"></span>';
    try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = antes; }
  }

  /* ---------- campos ---------- */
  const campo = (nome, rotulo, valor = '', { tipo = 'text', dica = '', ph = '', max = 200, attrs = '', classe = '' } = {}) =>
    `<label class="campo ${classe}"><span class="rotulo">${rotulo}</span>${tipo === 'textarea' ? `<textarea name="${nome}" rows="5" maxlength="${max}" placeholder="${esc(ph)}" ${attrs}>${esc(valor)}</textarea>` : `<input name="${nome}" type="${tipo}" value="${esc(valor)}" maxlength="${max}" placeholder="${esc(ph)}" ${attrs}>`}${dica ? `<span class="dica">${dica}</span>` : ''}</label>`;
  const escolha = (nome, rotulo, opcoes, valor) => `<label class="campo"><span class="rotulo">${rotulo}</span><select name="${nome}">${Object.entries(opcoes).map(([v, t]) => `<option value="${v}"${v === valor ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const chave = (nome, rotulo, ligado, dica = '') => `<label class="chave"><input type="checkbox" name="${nome}" ${ligado ? 'checked' : ''}><span class="chave-trilho"><span></span></span><span class="chave-texto"><strong>${rotulo}</strong>${dica ? `<small>${dica}</small>` : ''}</span></label>`;
  const dadosForm = form => { const o = {}; for (const el of form.elements) { if (!el.name) continue; o[el.name] = el.type === 'checkbox' ? el.checked : el.value; } return o; };
  d.addEventListener('input', e => {
    const el = e.target; el.closest('.campo.erro')?.classList.remove('erro');
    if (el.dataset.dinheiro !== undefined) { const n = el.value.replace(/\D/g, '').slice(0, 11); el.value = n ? Number(n).toLocaleString('pt-BR') : ''; }
    if (el.dataset.fone !== undefined) { const n = el.value.replace(/\D/g, '').slice(0, 11); el.value = n.length > 10 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : n.length > 6 ? `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}` : n.length > 2 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : n; }
  });

  /* ---------- fotos: reduz no aparelho antes de enviar ---------- */
  async function reduzir(arquivo, max, qualidade) {
    let fonte;
    try { fonte = await createImageBitmap(arquivo, { imageOrientation: 'from-image' }); }
    catch { fonte = await new Promise((ok, falha) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => falha(new Error('Não deu para abrir essa imagem.')); im.src = URL.createObjectURL(arquivo); }); }
    const w = fonte.width, h = fonte.height, k = Math.min(1, max / Math.max(w, h));
    const c = d.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(fonte, 0, 0, c.width, c.height);
    let url = c.toDataURL('image/webp', qualidade);
    if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', qualidade);
    return { url, largura: c.width, altura: c.height };
  }

  /* ---------- estado e rotas ---------- */
  const estado = { usuario: null, instalado: true, site: '', novos: 0 };
  const ir = h => { if (location.hash !== h) location.hash = h; else rotear(); };
  addEventListener('hashchange', rotear);

  function moldura(ativa, conteudo) {
    const itens = [['inicio', '#/', 'Início'], ['imoveis', '#/imoveis', 'Imóveis'], ['contatos', '#/contatos', 'Contatos'], ['site', '#/site', 'Site'], ['conta', '#/conta', 'Conta']];
    return `<div class="casca">
      <aside class="lateral"><a class="marca" href="#/"><span class="marca-ic">${ic('inicio')}</span><span><strong>${esc(estado.site)}</strong><small>Painel</small></span></a>
        <nav>${itens.map(([k, h, t]) => `<a href="${h}" class="${k === ativa ? 'ativo' : ''}">${ic(k)}<span>${t}</span>${k === 'contatos' && estado.novos ? `<b class="contador">${estado.novos}</b>` : ''}</a>`).join('')}</nav>
        <a class="ver-site" href="/" target="_blank" rel="noopener">${ic('link')}Ver o site</a></aside>
      <main class="principal">${conteudo}</main>
      <nav class="abas">${itens.map(([k, h, t]) => `<a href="${h}" class="${k === ativa ? 'ativo' : ''}">${ic(k)}<span>${t}</span>${k === 'contatos' && estado.novos ? `<b class="contador">${estado.novos}</b>` : ''}</a>`).join('')}</nav>
    </div>`;
  }
  const titulo = (t, sub = '', acoes = '') => `<header class="cabeca"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${acoes ? `<div class="cabeca-acoes">${acoes}</div>` : ''}</header>`;

  async function rotear() {
    const h = location.hash || '#/';
    app.classList.remove('carregando');
    try {
      if (!estado.carregado) { const e = await api('GET', '/estado'); Object.assign(estado, e, { carregado: true }); }
      if (!estado.instalado) return telaInstalar();
      if (!estado.usuario) return telaEntrar();
      if (h === '#/entrar' || h === '#/instalar') return ir('#/');
      let m;
      if (h === '#/') return telaInicio();
      if (h === '#/imoveis') return telaImoveis();
      if ((m = /^#\/imoveis\/(\d+)$/.exec(h))) return telaEditor(Number(m[1]));
      if (h === '#/contatos') return telaContatos();
      if (h === '#/site') return telaSite();
      if (h === '#/conta') return telaConta();
      ir('#/');
    } catch (e) { if (e.status !== 401) app.innerHTML = `<div class="tela-erro"><h1>Não foi possível carregar.</h1><p>${esc(e.message)}</p><button class="btn btn-escuro" type="button" data-recarregar>Tentar de novo</button></div>`; }
  }
  d.addEventListener('click', e => { if (e.target.closest('[data-recarregar]')) location.reload(); });

  /* ---------- entrar / instalar ---------- */
  function telaAcesso(tituloT, sub, corpo, aoEnviar) {
    app.innerHTML = `<div class="acesso"><div class="acesso-cartao"><span class="marca-ic marca-ic-g">${ic('inicio')}</span><h1>${tituloT}</h1><p class="acesso-sub">${sub}</p><form novalidate>${corpo}</form></div></div>`;
    const form = $('form', app);
    form.addEventListener('submit', async e => { e.preventDefault(); const btn = $('button[type=submit]', form); try { await ocupado(btn, () => aoEnviar(dadosForm(form))); } catch (er) { erroCampo(form, er); } });
    $('input', form)?.focus();
  }
  function telaEntrar() {
    telaAcesso(`Painel ${esc(estado.site)}`, 'Entre para cuidar dos imóveis, contatos e do site.',
      `${campo('email', 'E-mail', '', { tipo: 'email', attrs: 'autocomplete="username" required', max: 120 })}${campo('senha', 'Senha', '', { tipo: 'password', attrs: 'autocomplete="current-password" required' })}<button class="btn btn-escuro btn-largo" type="submit">Entrar</button>`,
      async v => { await api('POST', '/entrar', v); estado.carregado = false; ir('#/'); });
  }
  function telaInstalar() {
    telaAcesso('Primeiro acesso', 'Crie a conta de quem vai administrar o site. O código de instalação aparece no registro (log) do servidor.',
      `${campo('codigo', 'Código de instalação', '', { attrs: 'autocomplete="off" required', max: 20, ph: 'Ex.: 3FA9C1B27E' })}${campo('nome', 'Seu nome', '', { attrs: 'autocomplete="name" required', max: 80 })}${campo('email', 'E-mail', '', { tipo: 'email', attrs: 'autocomplete="username" required', max: 120 })}${campo('senha', 'Crie uma senha', '', { tipo: 'password', attrs: 'autocomplete="new-password" required', dica: 'Pelo menos 10 caracteres. Uma frase curta funciona bem.' })}<button class="btn btn-escuro btn-largo" type="submit">Criar conta e entrar</button>`,
      async v => { await api('POST', '/instalar', v); estado.carregado = false; ir('#/'); });
  }

  /* ---------- início ---------- */
  async function telaInicio() {
    const [r, cfg] = await Promise.all([api('GET', '/resumo'), api('GET', '/config')]);
    estado.novos = r.leadsNovos;
    const falta = [
      [!cfg.whatsapp, 'Informe o WhatsApp', 'É o principal canal: aparece em todos os imóveis.', '#/site'],
      [!cfg.creci, 'Coloque o CRECI', 'Passa confiança e é exigido em anúncios.', '#/site'],
      [r.exemplos > 0, `Apague os ${r.exemplos} imóveis de exemplo`, 'Eles servem só para mostrar como o site fica.', '#/imoveis'],
      [!cfg.email && !cfg.telefone, 'Adicione telefone ou e-mail', 'Para quem prefere outro canal.', '#/site'],
      [!cfg.corretor_foto, 'Envie uma foto sua ou da equipe', 'Aparece na seção "Quem somos".', '#/site'],
      [!cfg.ga4, 'Ligue o Google Analytics', 'Para saber de onde vêm as visitas (opcional).', '#/site'],
    ].filter(x => x[0]);
    const b = r.backup;
    app.innerHTML = moldura('inicio', `${titulo(`Olá, ${esc(estado.usuario.nome.split(' ')[0])}`, 'Um resumo do seu site hoje.')}
      <section class="numeros">
        <a class="numero ${r.leadsNovos ? 'numero-destaque' : ''}" href="#/contatos"><span>Contatos novos</span><strong>${r.leadsNovos}</strong><small>${r.leads30} nos últimos 30 dias</small></a>
        <a class="numero" href="#/imoveis"><span>Imóveis no site</span><strong>${r.publicados}</strong><small>de ${r.imoveis} cadastrados</small></a>
        <a class="numero ${r.semFoto ? 'numero-alerta' : ''}" href="#/imoveis"><span>Sem fotos</span><strong>${r.semFoto}</strong><small>${r.semFoto ? 'Imóvel sem foto quase não recebe contato' : 'Tudo com foto'}</small></a>
        <a class="numero ${b && b.ok ? '' : 'numero-alerta'}" href="#/conta"><span>Último backup</span><strong class="numero-texto">${b ? (b.ok ? quando(b.quando) : 'Falhou') : 'Ainda não'}</strong><small>${b && b.ok ? 'Cópia diária automática' : 'Abra a Conta para conferir'}</small></a>
      </section>
      <div class="duas">
        <section class="cartao"><div class="cartao-cabeca"><h2>Últimos contatos</h2><a class="link" href="#/contatos">Ver todos ${ic('seta')}</a></div>
          ${r.ultimosLeads.length ? `<ul class="lista-simples">${r.ultimosLeads.map(l => `<li><span class="bolota bolota-${l.situacao}"></span><div><strong>${esc(l.nome)}</strong><small>${ORIGENS[l.origem]}${l.imovel_codigo ? ' · ' + esc(l.imovel_codigo) : ''} · ${quando(l.criado_em)}</small></div></li>`).join('')}</ul>` : '<p class="vazio-p">Quando alguém mandar mensagem pelo site, aparece aqui.</p>'}
        </section>
        <section class="cartao">${falta.length ? `<div class="cartao-cabeca"><h2>Para o site ficar completo</h2><span class="etiqueta">${falta.length} ${falta.length > 1 ? 'itens' : 'item'}</span></div>
          <ul class="tarefas">${falta.map(([, t, s, h]) => `<li><a href="${h}"><span class="tarefa-bola"></span><div><strong>${t}</strong><small>${s}</small></div>${ic('seta')}</a></li>`).join('')}</ul>` :
          `<div class="cartao-cabeca"><h2>Mais vistos</h2></div><ul class="lista-simples">${r.maisVistos.map(m => `<li><span class="num">${m.visitas}</span><div><strong>${esc(m.titulo)}</strong><small>${esc(m.codigo)} · visitas na página</small></div></li>`).join('')}</ul>`}
        </section>
      </div>`);
  }

  /* ---------- imóveis ---------- */
  let buscaImoveis = { texto: '', finalidade: '' };
  async function telaImoveis() {
    const q = new URLSearchParams(buscaImoveis).toString();
    const [r, res] = await Promise.all([api('GET', '/imoveis?' + q), api('GET', '/resumo')]);
    estado.novos = res.leadsNovos;
    app.innerHTML = moldura('imoveis', `${titulo('Imóveis', `${res.imoveis} cadastrados · ${res.publicados} aparecendo no site`, `<button class="btn btn-escuro" type="button" data-novo>${ic('mais')}Novo imóvel</button>`)}
      ${res.exemplos ? `<div class="faixa-aviso">${ic('alerta')}<div><strong>Há ${res.exemplos} imóveis de exemplo.</strong><span>Eles mostram como o site fica. Apague quando cadastrar os seus.</span></div><button class="btn btn-fantasma btn-p" type="button" data-apagar-exemplos>Apagar exemplos</button></div>` : ''}
      <form class="barra-busca" data-busca>
        <label class="busca-campo">${ic('olho')}<input name="texto" type="search" placeholder="Buscar por título, código ou bairro" value="${esc(buscaImoveis.texto)}" maxlength="60"></label>
        <div class="pilulas">${[['', 'Todos'], ['venda', 'Venda'], ['aluguel', 'Aluguel']].map(([v, t]) => `<label><input type="radio" name="finalidade" value="${v}"${buscaImoveis.finalidade === v ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
      </form>
      ${r.itens.length ? `<ul class="lista-imoveis">${r.itens.map(linhaImovel).join('')}</ul>` : `<div class="vazio"><span class="vazio-ic">${ic('imoveis')}</span><h2>${buscaImoveis.texto || buscaImoveis.finalidade ? 'Nada encontrado' : 'Nenhum imóvel ainda'}</h2><p>${buscaImoveis.texto || buscaImoveis.finalidade ? 'Tente outra busca.' : 'Cadastre o primeiro: leva uns 3 minutos com as fotos.'}</p></div>`}`);
    const fb = $('[data-busca]'); let t;
    fb.addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { buscaImoveis = { texto: fb.elements.texto.value.trim(), finalidade: fb.elements.finalidade.value }; telaImoveis().then(() => { const i = $('[data-busca] input[name=texto]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, e.target.type === 'radio' ? 0 : 350); });
    fb.addEventListener('submit', e => e.preventDefault());
    $('[data-novo]').addEventListener('click', novoImovel);
    $('[data-apagar-exemplos]')?.addEventListener('click', async () => {
      if (!await confirmar({ titulo: 'Apagar imóveis de exemplo?', texto: `Os ${res.exemplos} imóveis marcados como exemplo e as fotos deles saem do site. Seus imóveis não são afetados.`, botao: 'Apagar exemplos', perigo: true })) return;
      const x = await api('DELETE', '/exemplos'); avisar(`${x.apagados} exemplos apagados.`); telaImoveis();
    });
    $$('[data-alternar]').forEach(b => b.addEventListener('change', async () => {
      try { await api('PATCH', `/imoveis/${b.dataset.id}`, { [b.dataset.alternar]: b.checked }); avisar(b.dataset.alternar === 'publicado' ? (b.checked ? 'Imóvel visível no site.' : 'Imóvel escondido do site.') : (b.checked ? 'Imóvel em destaque na página inicial.' : 'Saiu dos destaques.')); }
      catch (e) { b.checked = !b.checked; avisar(e.message, 'erro'); }
    }));
  }
  const linhaImovel = i => `<li class="imovel-linha${i.publicado ? '' : ' escondido'}">
    <a class="imovel-capa" href="#/imoveis/${i.id}">${i.capa ? `<img src="${esc(i.capa)}" alt="" loading="lazy">` : `<span>${ic('foto')}</span>`}${i.total_fotos ? `<b>${i.total_fotos}</b>` : ''}</a>
    <a class="imovel-info" href="#/imoveis/${i.id}">
      <span class="imovel-meta"><span class="etiqueta">${esc(i.codigo)}</span><span class="etiqueta etiqueta-${i.situacao}">${SITUACOES[i.situacao]}</span>${i.exemplo ? '<span class="etiqueta etiqueta-exemplo">Exemplo</span>' : ''}</span>
      <strong>${esc(i.titulo)}</strong>
      <small>${i.finalidade === 'aluguel' ? 'Aluguel' : 'Venda'} · ${TIPOS[i.tipo] || ''}${i.bairro ? ' · ' + esc(i.bairro) : ''}${i.cidade ? ', ' + esc(i.cidade) : ''}</small>
      <span class="imovel-preco">${i.preco ? reais(i.preco) + (i.finalidade === 'aluguel' ? '/mês' : '') : 'Sem valor'}</span>
    </a>
    <div class="imovel-acoes">
      <label class="mini-chave" title="Aparece no site"><input type="checkbox" data-alternar="publicado" data-id="${i.id}" ${i.publicado ? 'checked' : ''}><span class="chave-trilho"><span></span></span><span>No site</span></label>
      <label class="mini-chave" title="Destaque na página inicial"><input type="checkbox" data-alternar="destaque" data-id="${i.id}" ${i.destaque ? 'checked' : ''}><span class="chave-trilho"><span></span></span><span>Destaque</span></label>
    </div></li>`;

  function novoImovel() {
    const { form, fechar } = janela({ titulo: 'Novo imóvel', sub: 'Comece pelo básico',
      corpo: `${campo('titulo', 'Título do anúncio', '', { max: 120, ph: 'Ex.: Casa com pátio e piscina no Centro', dica: 'Fale do que o imóvel tem de melhor. Evite só "Casa à venda".', attrs: 'required' })}
        <div class="grade-2">${escolha('finalidade', 'Finalidade', { venda: 'Venda', aluguel: 'Aluguel' }, 'venda')}${escolha('tipo', 'Tipo', TIPOS, 'casa')}</div>`,
      acoes: `<button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button><button type="submit" class="btn btn-escuro">Continuar ${ic('seta')}</button>` });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      try { const im = await ocupado($('[type=submit]', form), () => api('POST', '/imoveis', { ...dadosForm(form), publicado: false })); fechar(); ir(`#/imoveis/${im.id}`); avisar('Imóvel criado. Agora as fotos e os detalhes.'); }
      catch (er) { erroCampo(form, er); }
    });
  }

  async function telaEditor(id) {
    const im = await api('GET', `/imoveis/${id}`);
    const num = (n, r, v, o = {}) => campo(n, r, v ?? '', { attrs: `inputmode="numeric" ${o.attrs || ''}`, max: 14, ...o });
    const din = (n, r, v, dica) => campo(n, r, v ? Number(v).toLocaleString('pt-BR') : '', { attrs: 'inputmode="numeric" data-dinheiro', max: 16, ph: 'R$', dica });
    const extras = im.caracteristicas.filter(c => !CARACTERISTICAS.includes(c));
    app.innerHTML = moldura('imoveis', `<div class="editor">
      <header class="cabeca"><div><a class="voltar" href="#/imoveis">${ic('voltar')}Imóveis</a><h1>${esc(im.titulo)}</h1><p>${esc(im.codigo)}${im.exemplo ? ' · imóvel de exemplo' : ''} · atualizado ${quando(im.atualizado_em)}</p></div>
        <div class="cabeca-acoes">${im.publicado ? `<a class="btn btn-fantasma" href="/imovel/${esc(im.slug)}" target="_blank" rel="noopener">${ic('link')}Ver no site</a>` : ''}</div></header>
      <section class="cartao" id="fotos"><div class="cartao-cabeca"><div><h2>Fotos</h2><p class="cartao-sub">A primeira é a capa. Arraste para mudar a ordem. Até 60 fotos.</p></div><span class="etiqueta" data-qtd-fotos>${im.fotos.length}</span></div>
        <label class="soltar" data-soltar><input type="file" accept="image/*" multiple hidden data-arquivos>${ic('nuvem')}<strong>Arraste as fotos aqui ou toque para escolher</strong><small>Pode mandar várias de uma vez, direto do celular. A gente reduz o tamanho sem perder qualidade.</small></label>
        <ul class="fotos" data-fotos></ul>
      </section>
      <form class="editor-form" novalidate data-editor>
        <section class="cartao"><div class="cartao-cabeca"><h2>Anúncio</h2></div>
          ${campo('titulo', 'Título', im.titulo, { max: 120, attrs: 'required' })}
          ${campo('resumo', 'Frase de destaque', im.resumo, { max: 220, ph: 'Uma frase que faça a pessoa querer ver mais', dica: 'Aparece em itálico logo abaixo das medidas.' })}
          <div class="grade-3">${escolha('finalidade', 'Finalidade', { venda: 'Venda', aluguel: 'Aluguel' }, im.finalidade)}${escolha('tipo', 'Tipo', TIPOS, im.tipo)}${escolha('situacao', 'Situação', SITUACOES, im.situacao)}</div>
          ${campo('codigo', 'Código', im.codigo, { max: 20, dica: 'Usado nas mensagens de WhatsApp. Pode usar o mesmo do seu sistema.' })}
        </section>
        <section class="cartao"><div class="cartao-cabeca"><h2>Valores</h2></div>
          <div class="grade-3">${din('preco', 'Valor', im.preco, im.finalidade === 'aluguel' ? 'Por mês' : 'Deixe em branco para "Consulte"')}${din('condominio', 'Condomínio', im.condominio, 'Por mês')}${din('iptu', 'IPTU', im.iptu, im.finalidade === 'aluguel' ? 'Por mês' : 'Por ano')}</div>
          <div class="chaves">${chave('financiamento', 'Aceita financiamento', im.financiamento, 'Mostra o simulador na página.')}${chave('permuta', 'Aceita permuta', im.permuta)}</div>
        </section>
        <section class="cartao"><div class="cartao-cabeca"><h2>Medidas e cômodos</h2></div>
          <div class="grade-3">${num('area_util', 'Área útil (m²)', im.area_util)}${num('area_total', 'Área do terreno (m²)', im.area_total, { dica: '1 hectare = 10.000 m²' })}${num('quartos', 'Dormitórios', im.quartos)}${num('suites', 'Suítes', im.suites)}${num('banheiros', 'Banheiros', im.banheiros)}${num('vagas', 'Vagas', im.vagas)}</div>
        </section>
        <section class="cartao"><div class="cartao-cabeca"><h2>Localização</h2></div>
          <div class="grade-3">${campo('cidade', 'Cidade', im.cidade, { max: 80 })}${campo('bairro', 'Bairro', im.bairro, { max: 80 })}${campo('uf', 'UF', im.uf || 'RS', { max: 2 })}</div>
          ${campo('endereco', 'Endereço', im.endereco, { max: 160, ph: 'Rua e número', dica: 'Só aparece no site se você ligar a opção abaixo.' })}
          <div class="chaves">${chave('mostrar_endereco', 'Mostrar endereço exato no site', im.mostrar_endereco, 'Desligado, o mapa mostra só o bairro. Mais seguro para o proprietário.')}</div>
        </section>
        <section class="cartao"><div class="cartao-cabeca"><h2>Descrição</h2></div>
          ${campo('descricao', 'Texto do anúncio', im.descricao, { tipo: 'textarea', max: 6000, dica: 'Deixe uma linha em branco entre os parágrafos.', ph: 'Conte como é viver ali: a luz, o pátio, a vizinhança...' })}
          <div class="campo"><span class="rotulo">O que tem</span><div class="marcadores">${[...CARACTERISTICAS, ...extras].map(c => `<label><input type="checkbox" name="car" value="${esc(c)}" ${im.caracteristicas.includes(c) ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>
            <div class="adicionar-car"><input type="text" placeholder="Outra característica" maxlength="40" data-nova-car><button type="button" class="btn btn-fantasma btn-p" data-add-car>${ic('mais')}Adicionar</button></div></div>
          ${campo('video_url', 'Vídeo do YouTube', im.video_url, { max: 200, ph: 'https://youtu.be/...', dica: 'Opcional. Um tour em vídeo aumenta muito o interesse.' })}
        </section>
        <section class="cartao"><div class="cartao-cabeca"><h2>No site</h2></div>
          <div class="chaves">${chave('publicado', 'Aparece no site', im.publicado, 'Desligado, fica guardado só aqui no painel.')}${chave('destaque', 'Destaque na página inicial', im.destaque, 'Os destaques entram no carrossel do início.')}</div>
        </section>
        <div class="zona-perigo"><div><strong>Apagar imóvel</strong><small>Remove o imóvel e todas as fotos. Não dá para desfazer.</small></div><button type="button" class="btn btn-perigo-claro" data-apagar>${ic('lixo')}Apagar</button></div>
        <div class="barra-salvar"><span data-status-salvar>Tudo salvo</span><button type="submit" class="btn btn-escuro">${ic('check')}Salvar alterações</button></div>
      </form></div>`);

    // fotos
    let fotos = im.fotos;
    const lista = $('[data-fotos]');
    const pintarFotos = () => {
      lista.innerHTML = fotos.map((f, i) => `<li class="foto${i === 0 ? ' foto-capa' : ''}" draggable="true" data-id="${f.id}">
        <img src="${esc(f.pequena)}" alt="" loading="lazy">${i === 0 ? '<span class="foto-selo">Capa</span>' : ''}
        <div class="foto-acoes">
          <button type="button" class="btn-icone btn-icone-p" data-mover="-1" aria-label="Mover para a esquerda" ${i === 0 ? 'disabled' : ''}>${ic('esq')}</button>
          ${i ? `<button type="button" class="btn-icone btn-icone-p" data-capa aria-label="Usar como capa" title="Usar como capa">${ic('capa')}</button>` : ''}
          <button type="button" class="btn-icone btn-icone-p" data-legenda aria-label="Escrever legenda" title="Legenda">${ic('editar')}</button>
          <button type="button" class="btn-icone btn-icone-p" data-tirar aria-label="Apagar foto" title="Apagar">${ic('lixo')}</button>
          <button type="button" class="btn-icone btn-icone-p" data-mover="1" aria-label="Mover para a direita" ${i === fotos.length - 1 ? 'disabled' : ''}>${ic('dir')}</button>
        </div>${f.legenda ? `<span class="foto-legenda">${esc(f.legenda)}</span>` : ''}</li>`).join('');
      $('[data-qtd-fotos]').textContent = fotos.length;
    };
    pintarFotos();
    const salvarOrdem = async () => { try { fotos = await api('PUT', `/imoveis/${id}/fotos/ordem`, { ids: fotos.map(f => f.id) }); pintarFotos(); } catch (e) { avisar(e.message, 'erro'); } };
    lista.addEventListener('click', async e => {
      const li = e.target.closest('.foto'); if (!li) return; const fid = Number(li.dataset.id), i = fotos.findIndex(f => f.id === fid);
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.mover) { const j = i + Number(b.dataset.mover); if (j < 0 || j >= fotos.length) return; [fotos[i], fotos[j]] = [fotos[j], fotos[i]]; pintarFotos(); salvarOrdem(); }
      if (b.hasAttribute('data-capa')) { fotos.unshift(...fotos.splice(i, 1)); pintarFotos(); salvarOrdem(); avisar('Nova capa definida.'); }
      if (b.hasAttribute('data-tirar')) { if (!await confirmar({ titulo: 'Apagar esta foto?', texto: 'Ela sai do site e do painel.', botao: 'Apagar foto', perigo: true })) return; await api('DELETE', `/imoveis/${id}/fotos/${fid}`); fotos.splice(i, 1); pintarFotos(); }
      if (b.hasAttribute('data-legenda')) {
        const { form, fechar } = janela({ titulo: 'Legenda da foto', corpo: campo('legenda', 'Legenda', fotos[i].legenda, { max: 120, ph: 'Ex.: Suíte com sacada', dica: 'Aparece na tela de fotos e ajuda o Google a entender a imagem.' }), acoes: '<button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button><button type="submit" class="btn btn-escuro">Salvar</button>' });
        form.addEventListener('submit', async ev => { ev.preventDefault(); const v = form.elements.legenda.value.trim(); await api('PATCH', `/imoveis/${id}/fotos/${fid}`, { legenda: v }); fotos[i].legenda = v; pintarFotos(); fechar(); });
      }
    });
    // arrastar para reordenar (mouse)
    let arrastando = null;
    lista.addEventListener('dragstart', e => { arrastando = e.target.closest('.foto'); arrastando?.classList.add('arrastando'); e.dataTransfer.effectAllowed = 'move'; });
    lista.addEventListener('dragover', e => {
      if (!arrastando) return; e.preventDefault();
      const alvo = e.target.closest('.foto'); if (!alvo || alvo === arrastando) return;
      const r = alvo.getBoundingClientRect(); alvo.parentNode.insertBefore(arrastando, (e.clientX - r.left) > r.width / 2 ? alvo.nextSibling : alvo);
    });
    lista.addEventListener('dragend', () => {
      if (!arrastando) return; arrastando.classList.remove('arrastando'); arrastando = null;
      const ordem = $$('.foto', lista).map(li => Number(li.dataset.id)); fotos = ordem.map(fid => fotos.find(f => f.id === fid)); pintarFotos(); salvarOrdem();
    });
    // enviar
    const zona = $('[data-soltar]'), entrada = $('[data-arquivos]');
    async function enviar(arquivos) {
      const lista2 = [...arquivos].filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
      if (!lista2.length) return avisar('Escolha arquivos de imagem.', 'erro');
      const pend = lista2.map(f => { const li = d.createElement('li'); li.className = 'foto foto-enviando'; li.innerHTML = `<span class="giro"></span><small>${esc(f.name.slice(0, 24))}</small>`; lista.append(li); return [f, li]; });
      let ok = 0;
      for (const [f, li] of pend) {
        try {
          if (f.size > 40e6) throw new Error('Arquivo grande demais (máx. 40 MB).');
          const g = await reduzir(f, 2000, 0.82), p = await reduzir(f, 720, 0.74);
          const nova = await api('POST', `/imoveis/${id}/fotos`, { grande: g.url, pequena: p.url, largura: g.largura, altura: g.altura });
          fotos.push(nova); ok++; li.remove(); pintarFotos(); $$('.foto-enviando', lista).forEach(x => lista.append(x));
        } catch (e) { li.classList.add('foto-falhou'); li.innerHTML = `${ic('alerta')}<small>${esc(e.message)}</small>`; setTimeout(() => li.remove(), 6000); }
      }
      if (ok) avisar(ok > 1 ? `${ok} fotos enviadas.` : 'Foto enviada.');
    }
    entrada.addEventListener('change', () => { enviar(entrada.files); entrada.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => zona.addEventListener(ev, e => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); zona.classList.add('sobre-zona'); } }));
    ['dragleave', 'drop'].forEach(ev => zona.addEventListener(ev, () => zona.classList.remove('sobre-zona')));
    zona.addEventListener('drop', e => { if (e.dataTransfer?.files.length) { e.preventDefault(); enviar(e.dataTransfer.files); } });

    // dados
    const form = $('[data-editor]'), status = $('[data-status-salvar]');
    let sujo = false;
    form.addEventListener('input', () => { sujo = true; status.textContent = 'Alterações não salvas'; status.classList.add('pendente'); });
    form.addEventListener('change', () => { sujo = true; status.textContent = 'Alterações não salvas'; status.classList.add('pendente'); });
    $('[data-add-car]').addEventListener('click', () => {
      const inp = $('[data-nova-car]'), v = inp.value.trim(); if (!v) return;
      const l = d.createElement('label'); l.innerHTML = `<input type="checkbox" name="car" value="${esc(v)}" checked><span>${esc(v)}</span>`; $('.marcadores', form).append(l); inp.value = ''; sujo = true;
    });
    $('[data-nova-car]').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('[data-add-car]').click(); } });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const v = dadosForm(form); delete v.car;
      v.caracteristicas = $$('input[name=car]:checked', form).map(c => c.value);
      for (const k of ['preco', 'condominio', 'iptu']) v[k] = v[k].replace(/\D/g, '');
      try {
        const novo = await ocupado($('[type=submit]', form), () => api('PUT', `/imoveis/${id}`, v));
        sujo = false; status.textContent = 'Tudo salvo'; status.classList.remove('pendente'); avisar('Imóvel salvo.');
        $('.editor h1').textContent = novo.titulo;
      } catch (er) { erroCampo(form, er); }
    });
    $('[data-apagar]').addEventListener('click', async () => {
      if (!await confirmar({ titulo: 'Apagar este imóvel?', texto: `"${esc(im.titulo)}" e as ${fotos.length} fotos saem do site e do painel. Não dá para desfazer.`, botao: 'Apagar de vez', perigo: true })) return;
      await api('DELETE', `/imoveis/${id}`); sujo = false; avisar('Imóvel apagado.'); ir('#/imoveis');
    });
    const sair = e => { if (sujo) { e.preventDefault(); e.returnValue = ''; } };
    addEventListener('beforeunload', sair);
    addEventListener('hashchange', () => removeEventListener('beforeunload', sair), { once: true });
  }

  /* ---------- contatos ---------- */
  let filtroLeads = 'novo';
  async function telaContatos() {
    const r = await api('GET', '/leads?' + (filtroLeads ? 'situacao=' + filtroLeads : ''));
    estado.novos = r.novos;
    const cfgWhats = n => { const x = String(n || '').replace(/\D/g, ''); return x ? `https://wa.me/${x.length <= 11 ? '55' + x : x}` : ''; };
    app.innerHTML = moldura('contatos', `${titulo('Contatos', 'Quem pediu informação, visita ou avaliação pelo site.', `<a class="btn btn-fantasma" href="/api/admin/leads.csv" download>${ic('baixar')}Baixar planilha</a>`)}
      <div class="pilulas pilulas-abas">${[['novo', 'Novos'], ['em_atendimento', 'Em atendimento'], ['concluido', 'Concluídos'], ['', 'Todos']].map(([v, t]) => `<label><input type="radio" name="fl" value="${v}"${filtroLeads === v ? ' checked' : ''}><span>${t}${v === 'novo' && r.novos ? ` <b>${r.novos}</b>` : ''}</span></label>`).join('')}</div>
      ${r.itens.length ? `<ul class="leads">${r.itens.map(l => {
        const extra = Object.entries(l.dados || {}).map(([k, v]) => `<span><em>${esc({ data: 'Dia', periodo: 'Período', tipo: 'Tipo', finalidade: 'Quer', bairro: 'Bairro', cidade: 'Cidade', valor: 'Valor', quartos: 'Dormitórios', area: 'Área' }[k] || k)}</em>${esc(k === 'data' ? new Date(v + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : v)}</span>`).join('');
        const w = cfgWhats(l.telefone);
        return `<li class="lead lead-${l.situacao}" data-id="${l.id}">
          <div class="lead-topo"><span class="etiqueta etiqueta-origem-${l.origem}">${ORIGENS[l.origem]}</span><time>${quando(l.criado_em)}</time></div>
          <h3>${esc(l.nome)}</h3>
          <p class="lead-contato">${l.telefone ? esc(l.telefone) : ''}${l.email ? ` · <a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : ''}</p>
          ${l.imovel_titulo ? `<a class="lead-imovel" href="/imovel/${esc(l.imovel_slug)}" target="_blank" rel="noopener">${ic('imoveis')}<span>${esc(l.imovel_codigo)} · ${esc(l.imovel_titulo)}</span></a>` : ''}
          ${extra ? `<div class="lead-dados">${extra}</div>` : ''}
          ${l.mensagem ? `<p class="lead-msg">${esc(l.mensagem)}</p>` : ''}
          <div class="lead-acoes">
            ${w ? `<a class="btn btn-escuro btn-p" href="${esc(w + '?text=' + encodeURIComponent(`Olá, ${l.nome.split(' ')[0]}! Aqui é da ${estado.site}. Recebi seu contato pelo site${l.imovel_codigo ? ' sobre o imóvel ' + l.imovel_codigo : ''}.`))}" target="_blank" rel="noopener" data-responder>${ic('whats')}Responder</a>` : ''}
            <select class="select-p" data-situacao aria-label="Situação">${Object.entries(LEAD_SIT).map(([k, t]) => `<option value="${k}"${k === l.situacao ? ' selected' : ''}>${t}</option>`).join('')}</select>
            <button type="button" class="btn-icone" data-apagar-lead aria-label="Apagar contato">${ic('lixo')}</button>
          </div></li>`;
      }).join('')}</ul>` : `<div class="vazio"><span class="vazio-ic">${ic('contatos')}</span><h2>${filtroLeads === 'novo' ? 'Nenhum contato novo' : 'Nada por aqui'}</h2><p>${filtroLeads === 'novo' ? 'Tudo respondido. Bom trabalho!' : 'Os contatos do site aparecem aqui.'}</p></div>`}`);
    $$('input[name=fl]').forEach(rd => rd.addEventListener('change', () => { filtroLeads = rd.value; telaContatos(); }));
    $$('.lead').forEach(li => {
      const id = li.dataset.id;
      $('[data-situacao]', li).addEventListener('change', async e => { await api('PATCH', `/leads/${id}`, { situacao: e.target.value }); avisar('Situação atualizada.'); if (filtroLeads && e.target.value !== filtroLeads) { li.classList.add('saindo'); setTimeout(telaContatos, 250); } });
      $('[data-responder]', li)?.addEventListener('click', async () => { if ($('[data-situacao]', li).value === 'novo') { await api('PATCH', `/leads/${id}`, { situacao: 'em_atendimento' }).catch(() => {}); setTimeout(telaContatos, 800); } });
      $('[data-apagar-lead]', li).addEventListener('click', async () => { if (!await confirmar({ titulo: 'Apagar este contato?', texto: 'Use quando a pessoa pedir para remover os dados dela (LGPD) ou for spam.', botao: 'Apagar', perigo: true })) return; await api('DELETE', `/leads/${id}`); telaContatos(); });
    });
  }

  /* ---------- site ---------- */
  async function telaSite() {
    const cfg = await api('GET', '/config');
    const ok = v => v ? `<span class="estado estado-ok">${ic('check')}Preenchido</span>` : '<span class="estado">Falta preencher</span>';
    const linha = (k, t) => `<div class="resumo-linha"><dt>${t}</dt><dd>${cfg[k] ? esc(cfg[k]) : '<em>vazio</em>'}</dd></div>`;
    const blocos = [
      { k: 'identidade', t: 'Identidade', s: 'Nome, frase e CRECI', estado: ok(cfg.nome && cfg.creci), resumo: linha('nome', 'Nome') + linha('slogan', 'Frase') + linha('creci', 'CRECI') + linha('corretor_nome', 'Corretor(a)'),
        campos: () => `${campo('nome', 'Nome da imobiliária', cfg.nome, { max: 60 })}${campo('slogan', 'Frase curta', cfg.slogan, { max: 120, dica: 'Aparece no topo e no Google.' })}<div class="grade-2">${campo('creci', 'CRECI', cfg.creci, { max: 30, ph: 'Ex.: 12345-J' })}${campo('corretor_nome', 'Nome do corretor(a)', cfg.corretor_nome, { max: 80 })}</div>${imagemCampo('corretor_foto', 'Foto do corretor ou da equipe', cfg.corretor_foto, 'Vertical fica melhor. Aparece em "Quem somos".')}` },
      { k: 'contatos', t: 'Contatos', s: 'WhatsApp, telefone, e-mail e horário', estado: ok(cfg.whatsapp), resumo: linha('whatsapp', 'WhatsApp') + linha('telefone', 'Telefone') + linha('email', 'E-mail') + linha('endereco', 'Endereço'),
        campos: () => `<div class="grade-2">${campo('whatsapp', 'WhatsApp', cfg.whatsapp, { tipo: 'tel', attrs: 'data-fone inputmode="tel"', max: 20, dica: 'Recebe as mensagens dos botões do site.' })}${campo('telefone', 'Telefone fixo', cfg.telefone, { tipo: 'tel', attrs: 'data-fone inputmode="tel"', max: 20 })}</div>${campo('email', 'E-mail', cfg.email, { tipo: 'email', max: 120 })}${campo('endereco', 'Endereço do escritório', cfg.endereco, { max: 200 })}${campo('horario', 'Horário de atendimento', cfg.horario, { max: 160 })}` },
      { k: 'redes', t: 'Redes sociais', s: 'Instagram e Facebook', estado: ok(cfg.instagram || cfg.facebook), resumo: linha('instagram', 'Instagram') + linha('facebook', 'Facebook'),
        campos: () => `${campo('instagram', 'Instagram', cfg.instagram, { max: 60, ph: '@suaimobiliaria' })}${campo('facebook', 'Facebook', cfg.facebook, { max: 80, ph: 'endereço da página' })}` },
      { k: 'topo', t: 'Abertura do site', s: 'As 3 cenas que aparecem ao rolar', estado: ok(true), resumo: linha('hero_1', 'Cena 1') + linha('hero_2', 'Cena 2') + linha('hero_3', 'Cena 3'),
        campos: () => `<p class="texto-janela">No computador, as três fotos viram uma caminhada para dentro da casa conforme a pessoa rola a página. No celular, elas se alternam sozinhas. Use fotos horizontais e bem iluminadas: fachada, sala e área externa.</p>${[1, 2, 3].map(n => `<div class="cena-campo"><span class="cena-n">0${n}</span><div>${campo('hero_' + n, 'Frase', cfg['hero_' + n], { max: 80 })}${imagemCampo('hero_img_' + n, 'Foto', cfg['hero_img_' + n], n === 1 ? 'Fachada' : n === 2 ? 'Ambiente interno' : 'Área externa')}</div></div>`).join('')}`, larga: true },
      { k: 'sobre', t: 'Quem somos', s: 'Título e texto de apresentação', estado: ok(cfg.sobre_texto), resumo: linha('sobre_titulo', 'Título'),
        campos: () => `${campo('sobre_titulo', 'Título', cfg.sobre_titulo, { max: 160 })}${campo('sobre_texto', 'Texto', cfg.sobre_texto, { tipo: 'textarea', max: 1500, dica: 'Fale da história, da região e de como vocês atendem. Sem números inventados.' })}` },
      { k: 'google', t: 'Google e anúncios', s: 'Analytics, Search Console e Pixel da Meta', estado: ok(cfg.ga4), resumo: linha('ga4', 'Google Analytics') + `<div class="resumo-linha"><dt>Search Console</dt><dd>${cfg.verificacao_google ? 'Verificado' : '<em>vazio</em>'}</dd></div>` + linha('pixel_meta', 'Pixel da Meta'),
        campos: () => `${campo('ga4', 'Google Analytics 4', cfg.ga4, { max: 20, ph: 'G-XXXXXXXXXX', dica: 'Em analytics.google.com, Administrador, Fluxos de dados.' })}${campo('verificacao_google', 'Verificação do Google Search Console', cfg.verificacao_google, { max: 200, ph: 'Cole a tag meta ou só o código', dica: 'Escolha o método "Tag HTML" no Search Console.' })}${campo('pixel_meta', 'Pixel da Meta (Facebook/Instagram)', cfg.pixel_meta, { max: 20, ph: 'Só números' })}<p class="dica">Essas ferramentas só carregam depois que o visitante aceita o aviso de cookies (LGPD).</p>` },
    ];
    app.innerHTML = moldura('site', `${titulo('Site', 'O que aparece para os visitantes. Clique em um bloco para editar.', `<a class="btn btn-fantasma" href="/" target="_blank" rel="noopener">${ic('link')}Ver o site</a>`)}
      <div class="blocos">${blocos.map(b => `<article class="bloco"><div class="bloco-cabeca"><div><h2>${b.t}</h2><p>${b.s}</p></div>${b.estado}</div><dl class="resumo">${b.resumo}</dl><button type="button" class="btn btn-fantasma btn-p" data-editar="${b.k}">${ic('editar')}Editar</button></article>`).join('')}
        <article class="bloco bloco-info"><div class="bloco-cabeca"><div><h2>Google</h2><p>O que já vem pronto</p></div></div><ul class="lista-check"><li>${ic('check')}Mapa do site para o Google em <code>/sitemap.xml</code></li><li>${ic('check')}Dados estruturados em cada imóvel</li><li>${ic('check')}Prévia bonita ao compartilhar no WhatsApp</li><li>${ic('check')}Páginas rápidas no celular</li></ul></article></div>`);
    $$('[data-editar]').forEach(b => b.addEventListener('click', () => {
      const bl = blocos.find(x => x.k === b.dataset.editar);
      const { form, dlg, fechar } = janela({ titulo: bl.t, sub: 'Editar', corpo: bl.campos(), larga: bl.larga, acoes: '<button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button><button type="submit" class="btn btn-escuro">Salvar</button>' });
      ligarImagens(dlg);
      form.addEventListener('submit', async e => { e.preventDefault(); try { const novo = await ocupado($('[type=submit]', form), () => api('PUT', '/config', dadosForm(form))); estado.site = novo.nome; avisar('Salvo. Já está no site.'); fechar(); telaSite(); } catch (er) { erroCampo(form, er); } });
    }));
  }
  const imagemCampo = (nome, rotulo, valor, dica) => `<div class="campo campo-imagem"><span class="rotulo">${rotulo}</span><div class="img-escolha"><span class="img-previa">${valor ? `<img src="${esc(valor)}" alt="">` : ic('foto')}</span><div><label class="btn btn-fantasma btn-p"><input type="file" accept="image/*" hidden data-img="${nome}">${ic('nuvem')}Trocar foto</label>${dica ? `<span class="dica">${dica}</span>` : ''}</div></div><input type="hidden" name="${nome}" value="${esc(valor)}"></div>`;
  function ligarImagens(raiz) {
    $$('[data-img]', raiz).forEach(inp => inp.addEventListener('change', async () => {
      const f = inp.files[0]; if (!f) return; const caixa = inp.closest('.campo-imagem'), previa = $('.img-previa', caixa);
      previa.innerHTML = '<span class="giro"></span>';
      try { const r = await reduzir(f, 2400, 0.82); const { url } = await api('POST', '/imagem', { dados: r.url }); $(`input[name=${inp.dataset.img}]`, caixa).value = url; previa.innerHTML = `<img src="${esc(url)}" alt="">`; }
      catch (e) { previa.innerHTML = ic('alerta'); avisar(e.message, 'erro'); }
    }));
  }

  /* ---------- conta e backup ---------- */
  async function telaConta() {
    const b = await api('GET', '/backup');
    const u = b.status.ultimo, ext = b.externo;
    app.innerHTML = moldura('conta', `${titulo('Conta', esc(estado.usuario.email), `<button class="btn btn-fantasma" type="button" data-sair>${ic('sair')}Sair</button>`)}
      <div class="blocos">
        <article class="bloco"><div class="bloco-cabeca"><div><h2>Senha</h2><p>Troque se alguém mais souber.</p></div><span class="estado estado-ok">${ic('escudo')}Protegida</span></div><button type="button" class="btn btn-fantasma btn-p" data-senha>${ic('editar')}Trocar senha</button></article>
        <article class="bloco"><div class="bloco-cabeca"><div><h2>Backup</h2><p>Cópia criptografada de imóveis, fotos e contatos, todo dia.</p></div>${u ? (u.ok ? `<span class="estado estado-ok">${ic('check')}Em dia</span>` : `<span class="estado estado-erro">${ic('alerta')}Falhou</span>`) : '<span class="estado">Aguardando o primeiro</span>'}</div>
          <dl class="resumo"><div class="resumo-linha"><dt>Último</dt><dd>${u ? quando(u.quando) + (u.ok ? ` · ${(u.bytes / 1048576).toFixed(1)} MB` : ' · ' + esc(u.erro)) : '<em>nenhum ainda</em>'}</dd></div>
          <div class="resumo-linha"><dt>Fora do servidor</dt><dd>${ext.configurado ? `${esc(ext.bucket)} ${b.status.offsite ? (b.status.offsite.ok ? '· enviado' : '· <strong class="txt-erro">falhou</strong>') : ''}` : '<em>não configurado (peça ao suporte)</em>'}</dd></div></dl>
          <div class="botoes"><button type="button" class="btn btn-escuro btn-p" data-backup>${ic('nuvem')}Fazer backup agora</button><button type="button" class="btn btn-fantasma btn-p" data-chave>${ic('escudo')}Chave de recuperação</button></div>
          ${b.arquivos.length ? `<ul class="arquivos">${b.arquivos.slice(0, 6).map(a => `<li><span>${quando(a.quando)}</span><small>${(a.bytes / 1048576).toFixed(1)} MB</small><a class="link" href="/api/admin/backup/${a.id}" download>${ic('baixar')}Baixar</a></li>`).join('')}</ul>` : ''}
        </article>
      </div>`);
    $('[data-sair]').addEventListener('click', async () => { await api('POST', '/sair').catch(() => {}); estado.usuario = null; estado.carregado = false; ir('#/entrar'); });
    $('[data-backup]').addEventListener('click', e => ocupado(e.currentTarget, async () => { try { await api('POST', '/backup'); avisar('Backup feito e conferido.'); telaConta(); } catch (er) { avisar(er.message, 'erro'); } }));
    $('[data-senha]').addEventListener('click', () => {
      const { form, fechar } = janela({ titulo: 'Trocar senha', corpo: `${campo('atual', 'Senha atual', '', { tipo: 'password', attrs: 'autocomplete="current-password"' })}${campo('nova', 'Nova senha', '', { tipo: 'password', attrs: 'autocomplete="new-password"', dica: 'Pelo menos 10 caracteres. Os outros aparelhos conectados saem da conta.' })}`, acoes: '<button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button><button type="submit" class="btn btn-escuro">Trocar senha</button>' });
      form.addEventListener('submit', async e => { e.preventDefault(); try { await ocupado($('[type=submit]', form), () => api('POST', '/senha', dadosForm(form))); fechar(); avisar('Senha trocada.'); } catch (er) { erroCampo(form, er); } });
    });
    $('[data-chave]').addEventListener('click', () => {
      const { form, dlg } = janela({ titulo: 'Chave de recuperação', sub: 'Guarde fora do computador', corpo: `<p class="texto-janela">Sem esta chave, ninguém abre os arquivos de backup, nem a gente. Anote num lugar seguro (gerenciador de senhas ou papel guardado).</p>${campo('senha', 'Confirme sua senha', '', { tipo: 'password', attrs: 'autocomplete="current-password"' })}<div class="chave-caixa" hidden data-caixa><code data-codigo></code><button type="button" class="btn btn-fantasma btn-p" data-copiar>Copiar</button></div>`, acoes: '<button type="button" class="btn btn-fantasma" data-fechar>Fechar</button><button type="submit" class="btn btn-escuro">Mostrar chave</button>' });
      form.addEventListener('submit', async e => { e.preventDefault(); try { const r = await ocupado($('[type=submit]', form), () => api('POST', '/backup/chave', dadosForm(form))); $('[data-codigo]', dlg).textContent = r.chave; $('[data-caixa]', dlg).hidden = false; $('[type=submit]', form).hidden = true; $('.campo', form).hidden = true; } catch (er) { erroCampo(form, er); } });
      $('[data-copiar]', dlg).addEventListener('click', async () => { try { await navigator.clipboard.writeText($('[data-codigo]', dlg).textContent); avisar('Chave copiada.'); } catch { avisar('Selecione e copie manualmente.', 'erro'); } });
    });
  }

  rotear();
})();
