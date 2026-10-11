# Portfólio – Marcos André

Site estático em HTML, CSS e JavaScript puro.

## Estrutura

```
index.html      página única (Sobre, Formação, Portfólio, Contato)
css/style.css   estilos
js/main.js      comportamento (menu, navegação, filtro, modal, idade)
admin/          painel admin com Supabase
  admin.html    tela de login e cadastro (acesso: 3 cliques ao lado do nome no site)
  carregar.js   puxa projetos, feedbacks e clientes do banco para o site
  config.js     dados do Supabase
  supabase.sql  cria as tabelas (rodar uma vez no SQL Editor)
```

## Como adicionar um projeto

Copie um `<li class="project-item">` dentro de `<ul class="project-list">` no `index.html` e ajuste:

- `data-category`: `web design`, `web development` ou `applications`
- `href`, imagem (`src`), título e categoria exibida

Projetos com `href="#"` e `data-sem-link` ficam sem ação até você colocar o link.

## Como rodar

Abra o `index.html` no navegador (ou use a extensão Live Server do VS Code).

## Data e hora dos feedbacks

Cada feedback salvo pelo painel recebe a data e a hora automaticamente (coluna `criado_em`, preenchida pelo banco).
Ao clicar no feedback no site, o modal mostra, por exemplo, "15:50 de 10 out, 2026" (horário de Recife).
Editar um feedback não muda a data original.