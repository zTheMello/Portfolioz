'use strict';

const cfg = window.PORTFOLIO_CONFIG;
const db = supabase.createClient(cfg.url, cfg.chave);

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Cada aba é descrita aqui: tabela, campos do formulário e o que aparece na lista.
   Para criar uma nova aba ou campo, basta mexer neste objeto. */
const ABAS = {
  projetos: {
    nome: 'Projetos', tabela: 'portfolio_projetos', imagem: 'imagem', titulo: 'titulo', detalhe: 'categoria',
    campos: [
      { n: 'titulo', r: 'Título', req: true },
      { n: 'categoria', r: 'Categoria (filtro do site)', tipo: 'select', op: ['web design', 'web development', 'applications'] },
      { n: 'subtitulo', r: 'Tipo (ex.: Landing Page)' },
      { n: 'imagem', r: 'Imagem do projeto', tipo: 'imagem' },
      { n: 'link', r: 'Link do projeto', tipo: 'url' },
      { n: 'ordem', r: 'Ordem (menor aparece primeiro)', tipo: 'number' }
    ]
  },
  feedbacks: {
    nome: 'Feedbacks', tabela: 'portfolio_feedbacks', imagem: 'foto', titulo: 'nome', detalhe: 'texto',
    campos: [
      { n: 'nome', r: 'Título / nome do cliente', req: true },
      { n: 'texto', r: 'Comentário', tipo: 'textarea', req: true },
      { n: 'foto', r: 'Foto do cliente', tipo: 'imagem' },
      { n: 'ordem', r: 'Ordem (menor aparece primeiro)', tipo: 'number' }
    ]
  },
  clientes: {
    nome: 'Clientes', tabela: 'portfolio_clientes', imagem: 'logo', titulo: 'nome', detalhe: 'link',
    campos: [
      { n: 'nome', r: 'Nome do cliente', req: true },
      { n: 'logo', r: 'Logo', tipo: 'imagem' },
      { n: 'link', r: 'Link (site ou Instagram)', tipo: 'url' },
      { n: 'ordem', r: 'Ordem (menor aparece primeiro)', tipo: 'number' }
    ]
  }
};

let abaAtual = 'projetos';
let itens = [];
let editandoId = null;

function aviso(id, texto, erro) {
  $(id).textContent = texto || '';
  $(id).className = 'aviso' + (erro ? ' erro' : '');
}

/* ===== LOGIN ===== */
$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({ email: $('email').value, password: $('senha').value });
  if (error) return aviso('msg-login', 'E-mail ou senha incorretos.', true);
  entrar();
});

$('sair').addEventListener('click', async () => {
  await db.auth.signOut();
  location.reload();
});

function entrar() {
  $('login').hidden = true;
  $('painel').hidden = false;
  abrirAba(abaAtual);
}

/* ===== ABAS E FORMULÁRIO ===== */
$('abas').addEventListener('click', (e) => {
  if (e.target.dataset.aba) abrirAba(e.target.dataset.aba);
});

function abrirAba(chave) {
  abaAtual = chave;
  $('abas').innerHTML = Object.entries(ABAS)
    .map(([k, a]) => `<button class="aba${k === chave ? ' ativa' : ''}" data-aba="${k}">${a.nome}</button>`)
    .join('');
  $('titulo-form').textContent = 'Novo item: ' + ABAS[chave].nome;
  aviso('msg', '');
  renderForm();
  carregarLista();
}

function campoHtml(c) {
  const req = c.req ? 'required' : '';
  if (c.tipo === 'select') {
    return `<label>${c.r}<select name="${c.n}">${c.op.map((o) => `<option>${o}</option>`).join('')}</select></label>`;
  }
  if (c.tipo === 'textarea') {
    return `<label>${c.r}<textarea name="${c.n}" rows="4" ${req}></textarea></label>`;
  }
  if (c.tipo === 'imagem') {
    return `<div class="campo-img">
      <label>${c.r} (cole um link ou envie um arquivo)<input type="url" name="${c.n}" placeholder="https://..."></label>
      <label class="btn sec">Enviar arquivo<input type="file" accept="image/*" hidden data-upload="${c.n}"></label>
      <img class="previa" alt="" hidden>
    </div>`;
  }
  const tipo = c.tipo === 'number' ? 'number' : c.tipo === 'url' ? 'url' : 'text';
  return `<label>${c.r}<input type="${tipo}" name="${c.n}" value="${c.tipo === 'number' ? 0 : ''}" ${req}></label>`;
}

function renderForm() {
  editandoId = null;
  $('form').innerHTML = ABAS[abaAtual].campos.map(campoHtml).join('') + `
    <div class="acoes">
      <button class="btn" id="salvar" type="submit">Adicionar</button>
      <button class="btn sec" id="cancelar" type="button" hidden>Cancelar edição</button>
    </div>`;
}

$('form').addEventListener('click', (e) => {
  if (e.target.id === 'cancelar') { renderForm(); aviso('msg', ''); }
});

/* prévia da imagem sempre que o link muda */
$('form').addEventListener('input', (e) => {
  const previa = e.target.closest('.campo-img')?.querySelector('.previa');
  if (!previa) return;
  previa.src = e.target.value;
  previa.hidden = !e.target.value;
});

/* envio de arquivo para o Storage: preenche o campo de link com o endereço público */
$('form').addEventListener('change', async (e) => {
  const campo = e.target.dataset.upload;
  const arquivo = e.target.files && e.target.files[0];
  if (!campo || !arquivo) return;

  aviso('msg', 'Enviando imagem...');
  const caminho = `${ABAS[abaAtual].tabela}/${Date.now()}-${arquivo.name.replace(/[^\w.-]/g, '_')}`;
  const { error } = await db.storage.from('portfolio').upload(caminho, arquivo);
  e.target.value = '';
  if (error) return aviso('msg', 'Erro no envio: ' + error.message, true);

  const campoUrl = $('form').elements[campo];
  campoUrl.value = db.storage.from('portfolio').getPublicUrl(caminho).data.publicUrl;
  campoUrl.dispatchEvent(new Event('input', { bubbles: true }));
  aviso('msg', 'Imagem enviada. Agora é só salvar.');
});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const aba = ABAS[abaAtual];
  const dados = {};
  aba.campos.forEach((c) => {
    const v = e.target.elements[c.n].value.trim();
    dados[c.n] = c.tipo === 'number' ? parseInt(v, 10) || 0 : v || null;
  });

  const consulta = editandoId
    ? db.from(aba.tabela).update(dados).eq('id', editandoId)
    : db.from(aba.tabela).insert(dados);
  const { error } = await consulta;
  if (error) return aviso('msg', 'Erro ao salvar: ' + error.message, true);

  const editou = Boolean(editandoId);
  renderForm();
  aviso('msg', editou ? 'Alterações salvas.' : 'Item adicionado!');
  carregarLista();
});

/* ===== LISTA ===== */
async function carregarLista() {
  const aba = ABAS[abaAtual];
  const { data, error } = await db.from(aba.tabela).select('*').order('ordem').order('criado_em');
  if (error) return aviso('msg', 'Erro ao carregar: ' + error.message, true);

  itens = data;
  $('lista').innerHTML = itens.length
    ? itens.map((i) => `
      <article class="item">
        ${i[aba.imagem] ? `<img src="${esc(i[aba.imagem])}" alt="">` : '<span class="sem-img"></span>'}
        <div><strong>${esc(i[aba.titulo])}</strong><small>${esc(i[aba.detalhe])}</small></div>
        <button class="btn sec" data-acao="editar" data-id="${i.id}">Editar</button>
        <button class="btn perigo" data-acao="excluir" data-id="${i.id}">Excluir</button>
      </article>`).join('')
    : '<p class="vazio">Nada cadastrado ainda.</p>';
}

$('lista').addEventListener('click', async (e) => {
  const { acao, id } = e.target.dataset;
  if (!acao) return;

  if (acao === 'editar') {
    const item = itens.find((i) => i.id === id);
    ABAS[abaAtual].campos.forEach((c) => {
      const campo = $('form').elements[c.n];
      campo.value = item[c.n] ?? '';
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    });
    editandoId = id;
    $('salvar').textContent = 'Salvar alterações';
    $('cancelar').hidden = false;
    $('titulo-form').scrollIntoView({ behavior: 'smooth' });
  }

  if (acao === 'excluir' && confirm('Excluir este item?')) {
    const { error } = await db.from(ABAS[abaAtual].tabela).delete().eq('id', id);
    if (error) return aviso('msg', 'Erro ao excluir: ' + error.message, true);
    carregarLista();
  }
});

/* ===== INÍCIO ===== */
(async function () {
  if (cfg.url.includes('SEU-PROJETO')) return aviso('msg-login', 'Preencha o config.js com os dados do Supabase.', true);
  const { data } = await db.auth.getSession();
  if (data.session) entrar();
})();