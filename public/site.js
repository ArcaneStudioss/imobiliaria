/* Site da imobiliária · comportamento. Sem bibliotecas. Tudo funciona sem JS; isto só melhora. */
(() => {
  'use strict';
  const d = document, raiz = d.documentElement;
  raiz.classList.add('js');
  const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const carregou = Date.now();
  const dadosPagina = (() => { try { return JSON.parse($('#dados-pagina')?.textContent || '{}'); } catch { return {}; } })();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const faixa = (p, a, b) => clamp((p - a) / (b - a));
  const suave = t => 1 - Math.pow(1 - t, 3);
  const ICONE = n => ({
    check: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    erro: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v5m0 3h.01"/></svg>',
    baixo: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  })[n];

  /* ---------- avisos (sem alert nativo) ---------- */
  function avisar(msg, tipo = 'ok') {
    const caixa = $('[data-avisos]'); if (!caixa) return;
    const el = d.createElement('div'); el.className = 'aviso' + (tipo === 'erro' ? ' aviso-erro' : ''); el.setAttribute('role', 'status');
    el.innerHTML = ICONE(tipo === 'erro' ? 'erro' : 'check'); const t = d.createElement('span'); t.textContent = msg; el.append(t);
    caixa.append(el);
    setTimeout(() => { el.classList.add('saindo'); setTimeout(() => el.remove(), 320); }, 3800);
  }

  /* ---------- topo ---------- */
  const topo = $('[data-topo]');
  let heroFim = 0;
  function atualizarTopo() {
    const y = scrollY;
    const naHero = d.body.classList.contains('pg-home') && y < heroFim - 90;
    topo?.classList.toggle('solido', !naHero && y > 10 || !d.body.classList.contains('pg-home'));
    const fl = $('[data-whats-flutuante]'); fl?.classList.toggle('visivel', y > (heroFim || 500) - 200);
  }
  let ultimoY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (topo && !d.body.classList.contains('menu-aberto')) topo.classList.toggle('escondido', y > ultimoY + 4 && y > Math.max(heroFim, 400));
    if (y < ultimoY - 4) topo?.classList.remove('escondido');
    ultimoY = y; atualizarTopo();
  }, { passive: true });

  // menu do celular
  const btnMenu = $('[data-abre-menu]'), menu = $('#menu-movel');
  btnMenu?.addEventListener('click', () => {
    const abrir = menu.hidden; menu.hidden = !abrir; btnMenu.setAttribute('aria-expanded', String(abrir));
    d.body.classList.toggle('menu-aberto', abrir);
  });
  menu?.addEventListener('click', e => { if (e.target.closest('a')) { menu.hidden = true; d.body.classList.remove('menu-aberto'); btnMenu.setAttribute('aria-expanded', 'false'); } });

  /* ---------- hero ---------- */
  const hero = $('[data-hero]');
  if (hero) {
    const cenas = $$('[data-cena]', hero), frases = $$('[data-frase]', hero), final = $('[data-hero-final]', hero);
    const trilha = $$('[data-trilha]', hero), barra = $('[data-hero-barra]', hero), veu = $('.hero-veu', hero);
    const computador = matchMedia('(min-width: 900px) and (pointer: fine)');
    let modo = null, alvo = 0, atual = 0, rodando = false, timer = null;

    const medir = () => { heroFim = hero.offsetTop + hero.offsetHeight - innerHeight; if (modo !== 'rolagem') heroFim = hero.offsetHeight; };
    function quadro() {
      atual += (alvo - atual) * 0.14;
      if (Math.abs(alvo - atual) < 0.0005) atual = alvo;
      pintar(atual);
      if (atual !== alvo) requestAnimationFrame(quadro); else rodando = false;
    }
    function pintar(p) {
      // cena 1: aproxima da porta e some
      const a1 = suave(faixa(p, 0, 0.36));
      cenas[0].style.transform = `scale(${1 + a1 * 0.95})`;
      cenas[0].style.opacity = 1 - faixa(p, 0.27, 0.37);
      // cena 2: entra vindo de perto, depois aproxima da janela
      const e2 = faixa(p, 0.27, 0.42), a2 = suave(faixa(p, 0.44, 0.68));
      cenas[1].style.opacity = faixa(p, 0.27, 0.37) * (1 - faixa(p, 0.58, 0.68));
      cenas[1].style.transform = `scale(${1.2 - suave(e2) * 0.2 + a2 * 0.75})`;
      // cena 3: a varanda, mais devagar
      cenas[2].style.opacity = faixa(p, 0.58, 0.68);
      cenas[2].style.transform = `scale(${1.22 - suave(faixa(p, 0.58, 0.92)) * 0.22})`;
      // frases: entram e saem com desfoque
      const janelas = [[-1, 0, 0.13, 0.21], [0.33, 0.39, 0.5, 0.57], [0.65, 0.71, 0.79, 0.85]];
      frases.forEach((f, i) => {
        const [ia, ib, oa, ob] = janelas[i];
        const entra = ia < 0 ? 1 : suave(faixa(p, ia, ib)), sai = faixa(p, oa, ob);
        const o = entra * (1 - sai);
        f.style.opacity = o;
        f.style.transform = `translateY(${(1 - entra) * 40 - sai * 60}px) scale(${1 + sai * 0.06})`;
        f.style.filter = o < 0.99 ? `blur(${(1 - o) * 10}px)` : 'none';
      });
      // final: título e busca
      const fin = suave(faixa(p, 0.84, 0.96));
      final.style.opacity = fin; final.style.transform = `translateY(${(1 - fin) * 40}px)`;
      final.classList.toggle('visivel', fin > 0.5);
      veu.style.opacity = 1 + faixa(p, 0.84, 1) * 0.0;
      const idx = p < 0.33 ? 0 : p < 0.64 ? 1 : 2;
      trilha.forEach((t, i) => t.classList.toggle('ativa', i === idx));
      if (barra) barra.style.transform = `scaleY(${p})`;
      $('.hero-dica', hero).style.opacity = 1 - faixa(p, 0, 0.06);
    }
    const aoRolar = () => {
      const total = hero.offsetHeight - innerHeight;
      alvo = clamp((scrollY - hero.offsetTop) / total);
      if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
    };
    function modoAuto() {
      let i = 0; const sobre = $('.hero-sobre', hero), original = sobre.textContent;
      const textos = frases.map(f => f.textContent.trim());
      cenas[0].classList.add('ativa');
      timer = setInterval(() => {
        cenas[i].classList.remove('ativa'); i = (i + 1) % cenas.length; cenas[i].classList.add('ativa');
        sobre.style.opacity = 0; setTimeout(() => { sobre.textContent = textos[i] || original; sobre.style.opacity = 1; }, 500);
      }, 6000);
    }
    function definirModo() {
      const novo = reduzido ? 'parado' : computador.matches ? 'rolagem' : 'auto';
      if (novo === modo) return;
      modo = novo; clearInterval(timer);
      removeEventListener('scroll', aoRolar);
      hero.classList.remove('hero-rolagem', 'hero-auto');
      [...cenas, ...frases, final].forEach(el => { el.style.cssText = ''; el.classList.remove('ativa'); });
      if (modo === 'rolagem') { hero.classList.add('hero-rolagem'); addEventListener('scroll', aoRolar, { passive: true }); aoRolar(); atual = alvo; pintar(atual); }
      else if (modo === 'auto') { hero.classList.add('hero-auto'); modoAuto(); }
      medir(); atualizarTopo();
    }
    computador.addEventListener('change', definirModo);
    addEventListener('resize', () => { medir(); if (modo === 'rolagem') aoRolar(); });
    // as próximas cenas carregam depois da primeira
    definirModo();
  }
  atualizarTopo();

  /* ---------- select próprio ---------- */
  let selAberto = null;
  function melhorarSelect(sel) {
    if (sel._melhorado) return; sel._melhorado = true;
    const caixa = d.createElement('div'); caixa.className = 'sel';
    sel.parentNode.insertBefore(caixa, sel);
    const botao = d.createElement('button'); botao.type = 'button'; botao.className = 'sel-botao';
    botao.setAttribute('aria-haspopup', 'listbox'); botao.setAttribute('aria-expanded', 'false');
    const texto = d.createElement('span'); botao.append(texto); botao.insertAdjacentHTML('beforeend', ICONE('baixo'));
    const lista = d.createElement('ul'); lista.className = 'sel-lista'; lista.setAttribute('role', 'listbox'); lista.tabIndex = -1;
    lista.id = 'sl-' + Math.random().toString(36).slice(2, 8); botao.setAttribute('aria-controls', lista.id);
    caixa.append(botao, sel, lista);
    sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    const rotulo = sel.closest('label')?.querySelector('.campo-rotulo')?.textContent;
    if (rotulo) botao.setAttribute('aria-label', rotulo);
    let foco = 0, busca = '', buscaT;
    function montar() {
      lista.innerHTML = '';
      [...sel.options].forEach((o, i) => {
        const li = d.createElement('li'); li.setAttribute('role', 'option'); li.textContent = o.textContent; li.dataset.i = i; li.id = lista.id + '-' + i;
        li.setAttribute('aria-selected', String(o.selected)); lista.append(li);
      });
      texto.textContent = sel.options[sel.selectedIndex]?.textContent || '';
    }
    sel._recriar = montar; montar();
    const itens = () => $$('li', lista);
    function marcarFoco(i) { const its = itens(); foco = clamp(i, 0, its.length - 1); its.forEach((li, j) => li.classList.toggle('foco', j === foco)); its[foco]?.scrollIntoView({ block: 'nearest' }); lista.setAttribute('aria-activedescendant', its[foco]?.id || ''); }
    function posicionar() {
      caixa.classList.remove('para-cima');
      const r = botao.getBoundingClientRect(), altura = Math.min(300, lista.scrollHeight + 12);
      const cima = r.bottom + altura > innerHeight - 12 && r.top > altura;
      if (getComputedStyle(lista).position === 'fixed') {
        lista.style.left = Math.min(r.left, innerWidth - lista.offsetWidth - 12) + 'px';
        lista.style.top = cima ? (r.top - altura - 8) + 'px' : (r.bottom + 8) + 'px'; lista.style.bottom = 'auto';
      } else caixa.classList.toggle('para-cima', cima);
    }
    function abrir() {
      if (selAberto && selAberto !== fechar) selAberto();
      caixa.classList.add('aberto'); botao.setAttribute('aria-expanded', 'true'); posicionar(); marcarFoco(sel.selectedIndex); lista.focus({ preventScroll: true }); selAberto = fechar;
    }
    function fechar(volta = true) { caixa.classList.remove('aberto'); botao.setAttribute('aria-expanded', 'false'); if (selAberto === fechar) selAberto = null; if (volta && caixa.contains(d.activeElement)) botao.focus({ preventScroll: true }); }
    function escolher(i) {
      if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      montar(); fechar();
    }
    botao.addEventListener('click', e => { e.preventDefault(); caixa.classList.contains('aberto') ? fechar() : abrir(); });
    botao.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); abrir(); } });
    lista.addEventListener('click', e => { e.preventDefault(); const li = e.target.closest('li'); if (li) escolher(Number(li.dataset.i)); });
    lista.addEventListener('mousemove', e => { const li = e.target.closest('li'); if (li && Number(li.dataset.i) !== foco) marcarFoco(Number(li.dataset.i)); });
    lista.addEventListener('keydown', e => {
      const n = itens().length;
      if (e.key === 'ArrowDown') { e.preventDefault(); marcarFoco(foco + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcarFoco(foco - 1); }
      else if (e.key === 'Home') { e.preventDefault(); marcarFoco(0); }
      else if (e.key === 'End') { e.preventDefault(); marcarFoco(n - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(foco); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(); }
      else if (e.key === 'Tab') fechar(false);
      else if (e.key.length === 1) {
        busca += e.key.toLowerCase(); clearTimeout(buscaT); buscaT = setTimeout(() => (busca = ''), 600);
        const i = itens().findIndex(li => li.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').startsWith(busca)); if (i >= 0) marcarFoco(i);
      }
    });
    sel.addEventListener('change', montar);
    d.addEventListener('pointerdown', e => { if (!caixa.contains(e.target) && caixa.classList.contains('aberto')) fechar(false); });
    addEventListener('scroll', () => { if (caixa.classList.contains('aberto') && getComputedStyle(lista).position === 'fixed') fechar(false); }, { passive: true });
  }
  $$('select[data-select]').forEach(melhorarSelect);

  /* ---------- busca: faixa de valor muda com comprar/alugar ---------- */
  function ligarFaixa(form) {
    const sel = $('select[name=faixa]', form); if (!sel || !dadosPagina.faixas) return;
    $$('input[name=finalidade]', form).forEach(r => r.addEventListener('change', () => {
      const lista = dadosPagina.faixas[r.value === 'aluguel' ? 'aluguel' : 'venda'];
      sel.innerHTML = ''; lista.forEach(([v, t]) => sel.add(new Option(t, v)));
      sel._recriar?.();
    }));
  }
  $$('[data-busca]').forEach(f => {
    ligarFaixa(f);
    f.addEventListener('submit', () => { $$('select, input', f).forEach(el => { if (!el.value && el.name) el.disabled = true; }); setTimeout(() => $$('select, input', f).forEach(el => (el.disabled = false)), 50); });
  });
  const filtros = $('[data-filtros]');
  if (filtros) {
    ligarFaixa(filtros);
    const enviar = () => { $$('select, input', filtros).forEach(el => { if (!el.value && el.name && el.type !== 'radio') el.disabled = true; if (el.type === 'radio' && el.checked && !el.value) el.disabled = true; }); filtros.submit(); };
    filtros.addEventListener('change', e => { if (!e.target.closest('dialog')) enviar(); });
    filtros.addEventListener('submit', e => { e.preventDefault(); enviar(); });
  }

  /* ---------- diálogos ---------- */
  function abrirDialogo(dlg) {
    if (!dlg || dlg.open) return;
    dlg.showModal(); d.body.classList.add('travado');
    const primeiro = $('input:not([type=hidden]):not([type=radio]), textarea, .sel-botao', dlg);
    if (primeiro && matchMedia('(pointer: fine)').matches) setTimeout(() => primeiro.focus(), 60);
  }
  function fecharDialogo(dlg) {
    if (!dlg?.open) return;
    if (reduzido) { dlg.close(); return; }
    dlg.classList.add('fechando');
    setTimeout(() => { dlg.classList.remove('fechando'); dlg.close(); }, 220);
  }
  $$('dialog').forEach(dlg => {
    dlg.addEventListener('close', () => { if (!$('dialog[open]')) d.body.classList.remove('travado'); });
    dlg.addEventListener('cancel', e => { e.preventDefault(); if (selAberto) return selAberto(); fecharDialogo(dlg); });
    dlg.addEventListener('click', e => { if (e.target === dlg && !dlg.classList.contains('visor')) fecharDialogo(dlg); });
  });
  d.addEventListener('click', e => {
    const a = e.target.closest('[data-abre-dialogo]'); if (a) { e.preventDefault(); abrirDialogo(d.getElementById(a.dataset.abreDialogo)); }
    const f = e.target.closest('[data-fecha-dialogo]'); if (f) fecharDialogo(f.closest('dialog'));
  });

  /* ---------- máscaras ---------- */
  d.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset?.mascara === 'telefone') {
      const n = el.value.replace(/\D/g, '').slice(0, 11);
      el.value = n.length > 10 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : n.length > 6 ? `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}` : n.length > 2 ? `(${n.slice(0, 2)}) ${n.slice(2)}` : n;
    } else if (el.dataset?.mascara === 'dinheiro') {
      const n = el.value.replace(/\D/g, '').slice(0, 11); el.value = n ? 'R$ ' + Number(n).toLocaleString('pt-BR') : '';
    }
    if (el.closest('.campo.erro, .checagem.erro')) limparErro(el);
  });
  $$('[data-data-minima]').forEach(el => { const t = new Date(Date.now() + 864e5); el.min = t.toISOString().slice(0, 10); });

  /* ---------- formulários de contato ---------- */
  function limparErro(el) { const c = el.closest('.campo, .checagem'); c?.classList.remove('erro'); c?.querySelector('.campo-erro')?.remove(); }
  function mostrarErro(form, nome, msg) {
    const el = form.elements[nome]; if (!el) return avisar(msg, 'erro');
    const alvo = el.length && !el.tagName ? el[0] : el;
    const c = alvo.closest('.campo, .checagem'); if (!c) return avisar(msg, 'erro');
    c.classList.add('erro'); c.querySelector('.campo-erro')?.remove();
    const s = d.createElement('span'); s.className = 'campo-erro'; s.textContent = msg; c.append(s);
    alvo.focus?.({ preventScroll: false });
  }
  $$('[data-form-lead]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      $$('.erro', form).forEach(c => { c.classList.remove('erro'); c.querySelector('.campo-erro')?.remove(); });
      const fd = new FormData(form), val = k => String(fd.get(k) || '').trim();
      if (val('nome').length < 2) return mostrarErro(form, 'nome', 'Conte como podemos te chamar.');
      if (val('telefone').replace(/\D/g, '').length < 10) return mostrarErro(form, 'telefone', 'Informe um telefone com DDD.');
      if (val('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) return mostrarErro(form, 'email', 'Esse e-mail parece incompleto.');
      if (form.elements.data && form.elements.data.required && !val('data')) return mostrarErro(form, 'data', 'Escolha um dia.');
      if (!fd.get('consentimento')) return mostrarErro(form, 'consentimento', 'Marque para podermos responder.');
      const dados = {}; for (const k of ['data', 'periodo', 'tipo', 'finalidade', 'bairro', 'cidade', 'valor', 'quartos', 'area']) if (val(k)) dados[k] = val(k);
      const corpo = { origem: val('origem'), nome: val('nome'), telefone: val('telefone'), email: val('email'), mensagem: val('mensagem'), imovel_id: val('imovel_id') || null, consentimento: true, site: val('site'), t: carregou, dados };
      const btn = $('button[type=submit]', form); btn.disabled = true; const rot = $('span', btn); const antes = rot.textContent; rot.textContent = 'Enviando...';
      try {
        const r = await fetch('/api/contato', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { if (j.campo) mostrarErro(form, j.campo, j.erro); else avisar(j.erro || 'Não foi possível enviar agora.', 'erro'); return; }
        rastrear('generate_lead', { origem: corpo.origem });
        const ok = d.createElement('div'); ok.className = 'form-ok';
        ok.innerHTML = `<div class="selo-ok">${ICONE('check')}</div><h3>Recebemos, ${corpo.nome.split(' ')[0].replace(/[<>&"]/g, '')}!</h3><p>${corpo.origem === 'visita' ? 'Vamos confirmar o horário da visita pelo WhatsApp.' : corpo.origem === 'anunciar' ? 'Em breve entramos em contato para combinar a avaliação.' : 'Respondemos o quanto antes, normalmente no mesmo dia útil.'}</p>`;
        form.replaceChildren(ok);
      } catch { avisar('Sem conexão. Confira a internet e tente de novo.', 'erro'); }
      finally { if (btn.isConnected) { btn.disabled = false; rot.textContent = antes; } }
    });
  });

  /* ---------- favoritos (ficam no aparelho) ---------- */
  const CHAVE = 'imoveis-favoritos';
  const lerFav = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || '[]').filter(Number.isInteger); } catch { return []; } };
  const gravarFav = l => { try { localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, 60))); } catch {} };
  function pintarFav() {
    const l = lerFav();
    $$('[data-favoritar]').forEach(b => { const on = l.includes(Number(b.dataset.favoritar)); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Tirar dos favoritos' : 'Salvar nos favoritos'); const s = $('span', b); if (s) s.textContent = on ? 'Salvo' : 'Salvar'; });
    $$('[data-fav-qtd]').forEach(q => { q.textContent = l.length; q.hidden = !l.length; });
  }
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-favoritar]'); if (!b) return;
    e.preventDefault(); const id = Number(b.dataset.favoritar); let l = lerFav();
    const on = !l.includes(id); l = on ? [id, ...l] : l.filter(x => x !== id); gravarFav(l); pintarFav();
    b.classList.remove('pulsa'); void b.offsetWidth; if (on) b.classList.add('pulsa');
    avisar(on ? 'Salvo nos favoritos.' : 'Removido dos favoritos.');
    if (on) rastrear('add_to_wishlist', { id });
  });
  pintarFav();
  const listaFav = $('[data-lista-favoritos]');
  if (listaFav) {
    const ids = lerFav();
    if (!ids.length) $('[data-favoritos-vazio]').hidden = false;
    else fetch('/api/imoveis?ids=' + ids.join(',')).then(r => r.json()).then(j => {
      const mapa = new Map(j.itens.map(i => [i.id, i.html]));
      listaFav.innerHTML = ids.filter(i => mapa.has(i)).map(i => mapa.get(i)).join('');
      if (!listaFav.children.length) $('[data-favoritos-vazio]').hidden = false;
      pintarFav();
    }).catch(() => avisar('Não foi possível carregar os favoritos.', 'erro'));
  }

  /* ---------- carrossel ---------- */
  $$('[data-carrossel]').forEach(c => {
    const passo = () => (c.firstElementChild?.offsetWidth || 300) + 24;
    const sec = c.closest('section');
    $('[data-carrossel-ant]', sec)?.addEventListener('click', () => c.scrollBy({ left: -passo(), behavior: 'smooth' }));
    $('[data-carrossel-prox]', sec)?.addEventListener('click', () => c.scrollBy({ left: passo(), behavior: 'smooth' }));
    // arrastar com o mouse
    let x0 = 0, s0 = 0, arrastou = false, apertado = false;
    c.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('button')) return; apertado = true; arrastou = false; x0 = e.clientX; s0 = c.scrollLeft; });
    addEventListener('pointermove', e => { if (!apertado) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { arrastou = true; c.classList.add('arrastando'); } c.scrollLeft = s0 - dx; });
    addEventListener('pointerup', () => { if (!apertado) return; apertado = false; c.classList.remove('arrastando'); });
    c.addEventListener('click', e => { if (arrastou) { e.preventDefault(); e.stopPropagation(); arrastou = false; } }, true);
  });

  /* ---------- revelar ao rolar ---------- */
  const reveladores = $$('[data-revela]');
  if ('IntersectionObserver' in window && !reduzido) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    reveladores.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  } else reveladores.forEach(el => el.classList.add('visto'));

  /* ---------- ficha: galeria e visor ---------- */
  const fotos = dadosPagina.fotos || [];
  const visor = $('[data-visor]');
  if (visor && fotos.length) {
    const img = $('[data-visor-img]', visor), cont = $('[data-visor-contador]', visor), leg = $('[data-visor-legenda]', visor), minis = $$('[data-ir-foto]', visor);
    let atual = 0;
    const precarregar = i => { const f = fotos[(i + fotos.length) % fotos.length]; if (f) { const im = new Image(); im.src = f.g; } };
    function mostrar(i, animar = true) {
      atual = (i + fotos.length) % fotos.length; const f = fotos[atual];
      const troca = () => { img.src = f.g; img.alt = f.l || `Foto ${atual + 1}`; img.classList.remove('trocando'); };
      if (animar && !reduzido && img.src) { img.classList.add('trocando'); setTimeout(troca, 160); } else troca();
      cont.textContent = `${atual + 1} / ${fotos.length}`; leg.textContent = f.l;
      minis.forEach((m, j) => m.setAttribute('aria-current', String(j === atual)));
      minis[atual]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
      precarregar(atual + 1); precarregar(atual - 1);
    }
    d.addEventListener('click', e => { const b = e.target.closest('[data-abre-foto]'); if (b) { mostrar(Number(b.dataset.abreFoto), false); abrirDialogo(visor); } });
    $('[data-visor-ant]', visor).addEventListener('click', () => mostrar(atual - 1));
    $('[data-visor-prox]', visor).addEventListener('click', () => mostrar(atual + 1));
    minis.forEach(m => m.addEventListener('click', () => mostrar(Number(m.dataset.irFoto))));
    visor.addEventListener('keydown', e => { if (e.key === 'ArrowRight') mostrar(atual + 1); if (e.key === 'ArrowLeft') mostrar(atual - 1); });
    const palco = $('[data-visor-palco]', visor); let tx = null, ty = 0;
    palco.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    palco.addEventListener('touchend', e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) mostrar(atual + (dx < 0 ? 1 : -1)); else if (dy > 110) fecharDialogo(visor); tx = null; });
    palco.addEventListener('click', e => { if (e.target === palco) fecharDialogo(visor); });
  }
  const trilho = $('[data-trilho]');
  if (trilho) {
    const cont = $('[data-contador]'); let t;
    trilho.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { cont.textContent = `${Math.round(trilho.scrollLeft / trilho.clientWidth) + 1} / ${trilho.children.length}`; }, 60); }, { passive: true });
  }

  // vídeo e mapa só carregam quando a pessoa pede (página mais leve e sem rastreio antecipado)
  d.addEventListener('click', e => {
    const v = e.target.closest('[data-video]');
    if (v) { const f = d.createElement('iframe'); f.className = 'quadro'; f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.dataset.video)}?autoplay=1&rel=0`; f.title = 'Vídeo do imóvel'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; v.replaceWith(f); }
    const m = e.target.closest('[data-mapa]');
    if (m) { const f = d.createElement('iframe'); f.className = 'quadro quadro-mapa'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.title = 'Mapa da região do imóvel'; f.src = `https://www.google.com/maps?q=${encodeURIComponent(m.dataset.mapa)}&z=14&output=embed`; m.replaceWith(f); }
  });

  // compartilhar
  d.addEventListener('click', async e => {
    const b = e.target.closest('[data-compartilhar]'); if (!b) return;
    const dados = { title: b.dataset.titulo || d.title, url: location.href.split('#')[0] };
    if (navigator.share) { try { await navigator.share(dados); } catch {} return; }
    try { await navigator.clipboard.writeText(dados.url); avisar('Link copiado. É só colar onde quiser.'); } catch { avisar('Copie o endereço da barra do navegador.', 'erro'); }
  });

  // descrição longa recolhida
  $$('[data-texto-longo]').forEach(t => {
    if (t.scrollHeight < 320) return;
    t.classList.add('recolhido');
    const b = d.createElement('button'); b.type = 'button'; b.className = 'ver-mais'; b.textContent = 'Ler descrição completa';
    b.addEventListener('click', () => { const r = t.classList.toggle('recolhido'); b.textContent = r ? 'Ler descrição completa' : 'Mostrar menos'; });
    t.after(b);
  });

  // simulador (sistema SAC: a primeira parcela é a maior)
  const sim = $('[data-simulador]');
  if (sim) {
    const preco = Number(sim.dataset.preco), brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
    const saida = k => $(`[data-saida=${k}]`, sim);
    const calc = () => {
      const ent = Number(sim.querySelector('[name=entrada]').value), meses = Number(sim.querySelector('[name=prazo]').value), juros = Number(sim.querySelector('[name=juros]').value);
      $$('input[type=range]', sim).forEach(r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'));
      const fin = preco * (1 - ent / 100), i = Math.pow(1 + juros / 100, 1 / 12) - 1;
      saida('entrada').textContent = ent + '%'; saida('prazo').textContent = Math.round(meses / 12) + ' anos';
      saida('juros').textContent = juros.toLocaleString('pt-BR') + '%';
      saida('financiado').textContent = brl(fin); saida('parcela').textContent = brl(fin / meses + fin * i);
    };
    sim.addEventListener('input', calc); calc();
  }

  // barra fixa no celular
  const barra = $('[data-barra-ficha]'), ladoPreco = $('.cartao-preco-lado');
  if (barra && ladoPreco) {
    // aparece depois do título e some quando o cartão de preço está na tela
    let precoVisivel = false;
    const conferir = () => barra.classList.toggle('visivel', !precoVisivel && scrollY > 420);
    new IntersectionObserver(([e]) => { precoVisivel = e.isIntersecting; conferir(); }, { threshold: 0 }).observe(ladoPreco);
    addEventListener('scroll', conferir, { passive: true });
  }

  /* ---------- estatísticas, só com consentimento ---------- */
  const rastreioCfg = (() => { try { return JSON.parse($('#rastreio')?.textContent || 'null'); } catch { return null; } })();
  let rastreioLigado = false;
  function rastrear(evento, params) { if (!rastreioLigado) return; try { window.gtag?.('event', evento, params); window.fbq?.('trackCustom', evento, params); } catch {} }
  function ligarRastreio() {
    if (!rastreioCfg || rastreioLigado) return; rastreioLigado = true;
    if (rastreioCfg.ga4) {
      const s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(rastreioCfg.ga4); d.head.append(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', rastreioCfg.ga4, { anonymize_ip: true });
    }
    if (rastreioCfg.pixel) {
      const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); }; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      const s = d.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js'; d.head.append(s);
      window.fbq('init', rastreioCfg.pixel); window.fbq('track', 'PageView');
    }
  }
  const avisoCookies = $('[data-cookies]');
  if (rastreioCfg && avisoCookies) {
    let escolha = null; try { escolha = localStorage.getItem('cookies-escolha'); } catch {}
    if (escolha === 'sim') ligarRastreio(); else if (!escolha) avisoCookies.hidden = false;
    avisoCookies.addEventListener('click', e => {
      const b = e.target.closest('button[data-cookies]'); if (!b) return;
      try { localStorage.setItem('cookies-escolha', b.dataset.cookies); } catch {}
      avisoCookies.hidden = true; if (b.dataset.cookies === 'sim') ligarRastreio();
    });
  }
  d.addEventListener('click', e => { if (e.target.closest('a[href*="wa.me"]')) rastrear('contact', { canal: 'whatsapp' }); });
})();
