'use strict';

/* =====================================================
   Utilidades
   ===================================================== */

const $  = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

/* =====================================================
   Sidebar (abrir/fechar contatos no mobile)
   ===================================================== */

function iniciarSidebar() {
    const sidebar = $('[data-sidebar]');
    const botao = $('[data-sidebar-btn]');
    if (!sidebar || !botao) return;

    botao.addEventListener('click', () => {
        const aberta = sidebar.classList.toggle('active');
        botao.setAttribute('aria-expanded', aberta);
    });
}

/* =====================================================
   Navegação entre páginas
   Cada botão tem data-nav-link="nome" e cada página data-page="nome"
   ===================================================== */

function irParaPagina(nome) {
    $$('[data-page]').forEach(pagina => {
        pagina.classList.toggle('active', pagina.dataset.page === nome);
    });

    $$('[data-nav-link]').forEach(link => {
        link.classList.toggle('active', link.dataset.navLink === nome);
    });

    window.scrollTo(0, 0);
}

function iniciarNavegacao() {
    $$('[data-nav-link]').forEach(link => {
        link.addEventListener('click', () => irParaPagina(link.dataset.navLink));
    });
}

/* =====================================================
   Modal de feedbacks
   Usa delegação de evento: funciona também para feedbacks
   adicionados depois (ex.: vindos do painel admin).
   ===================================================== */

function iniciarModal() {
    const container = $('[data-modal-container]');
    const overlay = $('[data-overlay]');
    const botaoFechar = $('[data-modal-close-btn]');
    const img = $('[data-modal-img]');
    const titulo = $('[data-modal-title]');
    const texto = $('[data-modal-text]');
    const data = $('[data-modal-date]');
    if (!container || !overlay || !botaoFechar) return;

    const abrir = () => {
        container.classList.add('active');
        overlay.classList.add('active');
    };

    const fechar = () => {
        container.classList.remove('active');
        overlay.classList.remove('active');
    };

    document.addEventListener('click', evento => {
        const item = evento.target.closest('[data-testimonials-item]');
        if (!item) return;

        const avatar = $('[data-testimonials-avatar]', item);
        if (avatar) {
            img.src = avatar.src;
            img.alt = avatar.alt;
        }
        titulo.innerHTML = $('[data-testimonials-title]', item)?.innerHTML ?? '';
        texto.innerHTML = $('[data-testimonials-text]', item)?.innerHTML ?? '';

        // Data e hora do feedback (só aparece nos feedbacks que vêm do painel)
        if (data) {
            const quando = item.dataset.testimonialsDate;
            data.textContent = quando || '';
            data.dateTime = item.dataset.testimonialsDatetime || '';
            data.hidden = !quando;
        }

        abrir();
    });

    botaoFechar.addEventListener('click', fechar);
    overlay.addEventListener('click', fechar);
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') fechar();
    });
}

/* =====================================================
   Filtro de projetos (botões no desktop, select no mobile)
   ===================================================== */

function iniciarFiltro() {
    const select = $('[data-select]');
    const valorSelect = $('[data-select-value]');
    const botoesFiltro = $$('[data-filter-btn]');
    const itensSelect = $$('[data-select-item]');

    // Lê os projetos na hora, assim pega também os que vierem do banco
    const filtrar = categoria => {
        $$('[data-filter-item]').forEach(projeto => {
            const mostrar = categoria === 'all' || projeto.dataset.category === categoria;
            projeto.classList.toggle('active', mostrar);
        });
    };

    const selecionar = (categoria, rotulo) => {
        if (valorSelect) valorSelect.textContent = rotulo;
        botoesFiltro.forEach(botao => {
            botao.classList.toggle('active', botao.dataset.filterBtn === categoria);
        });
        filtrar(categoria);
    };

    const alternarSelect = aberto => {
        if (!select) return;
        select.classList.toggle('active', aberto);
        select.setAttribute('aria-expanded', aberto);
    };

    if (select) {
        select.addEventListener('click', () => alternarSelect(!select.classList.contains('active')));

        // fecha o select ao clicar fora dele
        document.addEventListener('click', evento => {
            if (!evento.target.closest('.filter-select-box')) alternarSelect(false);
        });
    }

    itensSelect.forEach(item => {
        item.addEventListener('click', () => {
            selecionar(item.dataset.selectItem, item.textContent.trim());
            alternarSelect(false);
        });
    });

    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', () => {
            selecionar(botao.dataset.filterBtn, botao.textContent.trim());
        });
    });
}

/* =====================================================
   Idade calculada automaticamente (nasc. 20/08/1996)
   ===================================================== */

function iniciarIdade() {
    const nascimento = new Date(1996, 7, 20);
    const hoje = new Date();

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const jaFezAniversario =
        hoje.getMonth() > nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
    if (!jaFezAniversario) idade--;

    $$('[data-idade]').forEach(el => { el.textContent = idade; });
}

/* =====================================================
   Projetos ainda sem link (href="#"): não rolam a página
   ===================================================== */

function iniciarLinksVazios() {
    document.addEventListener('click', evento => {
        const link = evento.target.closest('a[href="#"]');
        if (link) evento.preventDefault();
    });
}

/* =====================================================
   Luz neon que acompanha o mouse sobre a imagem do projeto
   (delegação de evento: vale também para projetos vindos do banco)
   ===================================================== */

function iniciarDestaqueProjetos() {
    document.addEventListener('pointermove', evento => {
        const imagem = evento.target.closest?.('.project-img');
        if (!imagem) return;

        const caixa = imagem.getBoundingClientRect();
        imagem.style.setProperty('--mx', `${evento.clientX - caixa.left}px`);
        imagem.style.setProperty('--my', `${evento.clientY - caixa.top}px`);
    });
}

/* =====================================================
   Acesso secreto ao painel: 3 cliques seguidos (em até 2 s)
   no botão invisível ao lado do nome
   ===================================================== */

function iniciarAcessoAdmin() {
    const botao = $('[data-admin-secreto]');
    if (!botao) return;

    let cliques = 0;
    let temporizador;

    botao.addEventListener('click', () => {
        cliques++;
        clearTimeout(temporizador);
        temporizador = setTimeout(() => { cliques = 0; }, 2000);

        if (cliques >= 3) {
            cliques = 0;
            window.location.href = 'admin/admin.html';
        }
    });
}

/* =====================================================
   Inicialização
   ===================================================== */

iniciarSidebar();
iniciarNavegacao();
iniciarModal();
iniciarFiltro();
iniciarIdade();
iniciarLinksVazios();
iniciarDestaqueProjetos();
iniciarAcessoAdmin();