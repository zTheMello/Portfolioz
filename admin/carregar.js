'use strict';

/* Carrega projetos, feedbacks e clientes do Supabase e preenche o site.
   Se não houver configuração, a tabela estiver vazia ou der erro, o HTML que já está na página continua valendo. */
(function () {
  const cfg = window.PORTFOLIO_CONFIG;
  if (!cfg || !cfg.url || cfg.url.includes('SEU-PROJETO')) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const link = (u) => (/^https?:\/\//i.test(u || '') ? ` href="${esc(u)}" target="_blank" rel="noopener noreferrer"` : '');

  /* Data e hora automáticas do feedback (vem de criado_em, preenchido pelo banco ao salvar).
     Formato: "15:50 de 10 out, 2026", sempre no horário de Recife. */
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dataHora = (iso) => {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return '';
    const p = {};
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Recife', hour12: false,
      year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
    const hora = String(p.hour).replace('24', '00');
    return `${hora}:${p.minute} de ${Number(p.day)} ${MESES[Number(p.month) - 1]}, ${p.year}`;
  };

  const buscar = (tabela) =>
    fetch(`${cfg.url}/rest/v1/${tabela}?select=*&order=ordem.asc,criado_em.asc`, { headers: { apikey: cfg.chave } })
      .then((r) => { if (!r.ok) throw new Error(tabela); return r.json(); });

  const modelos = {
    projeto: (p) => `
      <li class="project-item active" data-filter-item data-category="${esc(p.categoria)}">
        <a${link(p.link)}>
          <figure class="project-img">
            <div class="project-item-icon-box"><ion-icon name="eye-outline"></ion-icon></div>
            <img src="${esc(p.imagem)}" alt="${esc(p.titulo)}" loading="lazy">
          </figure>
          <h3 class="project-title">${esc(p.titulo)}</h3>
          <p class="project-category">${esc(p.subtitulo || p.categoria)}</p>
        </a>
      </li>`,
    feedback: (f) => `
      <li class="testimonials-item">
        <div class="content-card" data-testimonials-item data-testimonials-datetime="${esc(f.criado_em)}" data-testimonials-date="${esc(dataHora(f.criado_em))}">
          <figure class="testimonials-avatar-box"><img src="${esc(f.foto)}" alt="${esc(f.nome)}" data-testimonials-avatar width="60"></figure>
          <h4 class="h4 testimonials-item-title" data-testimonials-title>${esc(f.nome)}</h4>
          <div class="testimonials-text" data-testimonials-text><p>${esc(f.texto).replace(/\n/g, '<br>')}</p></div>
        </div>
      </li>`,
    cliente: (c) => `
      <li class="clients-item"><a${link(c.link)}><img src="${esc(c.logo)}" alt="${esc(c.nome)}"></a></li>`
  };

  const preencher = (tabela, seletor, modelo) =>
    buscar(tabela)
      .then((itens) => {
        const lista = document.querySelector(seletor);
        if (lista && itens.length) lista.innerHTML = itens.map(modelo).join('');
      })
      .catch((erro) => console.warn('Portfólio: não foi possível carregar', erro.message));

  preencher('portfolio_projetos', '.project-list', modelos.projeto);
  preencher('portfolio_feedbacks', '.testimonials-list', modelos.feedback);
  preencher('portfolio_clientes', '.clients-list', modelos.cliente);
})();