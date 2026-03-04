# 🎫 TicketFlow — Sistema de HelpDesk Profissional

Sistema completo para gerenciamento de chamados técnicos, desenvolvido com React no Frontend e Express/SQLite no Backend.

## 🚀 Funcionalidades

### Usuário (Cliente)
- 📝 **Criar Chamados**: Abertura de novos tickets com título e descrição.
- 📋 **Meus Chamados**: Listagem e filtros por status ou busca textual.
- 💬 **Interação**: Sistema de comentários (histórico) dentro do ticket.
- ✏️ **Excluir/Editar**: Somente para tickets próprios e ainda em estado 'aberto'.

### Admin (Equipe Técnica)
- 🏢 **Painel Geral**: Visualização de todos os chamados de todos os usuários.
- 🔄 **Gestão de Status**: Alteração de status (Aberto, Em andamento, Resolvido).
- 💬 **Intervenção**: Pode comentar em qualquer chamado para suporte.
- 🗑️ **Controle Total**: Pode editar ou excluir qualquer ticket se necessário.

---

## 🛠️ Tecnologias

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [Axios](https://axios-http.com/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Banco de Dados**: [SQLite](https://sqlite.org/) (leve e eficiente para demos)
- **Segurança**: JWT (JSON Web Token) e Bcrypt para senhas.

---

## 📦 Como rodar o projeto

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/helpdesk.git
cd helpdesk
```

### 2. Configurar o Backend
```bash
cd backend
npm install
```
Crie um arquivo `.env` na pasta `backend`:
```env
JWT_SECRET=sua_chave_secreta_aquí
PORT=3333
```
Inicie o servidor:
```bash
npm run dev
```
> O sistema possui um **Admin padrão** e um **Usuário Demo**:
> - **Admin:** admin@ticketflow.com / 123456
> - **Usuário:** user@ticketflow.com / 123456

---

## 🛡️ Regras de Negócio & Segurança

Para garantir a integridade dos dados, o sistema implementa:
1. **Poder Administrativo**: Admins visualizam todos os tickets e podem alterar status de qualquer uno.
2. **Privacidade**: Usuários comuns só enxergam seus próprios chamados (bloqueio via Backend).
3. **Edição Restrita**: Um ticket só pode ser editado pelo dono se o status for **Aberto**. Uma vez "Em andamento" ou "Finalizado", apenas Admins podem intervir.
4. **Histórico Imutável**: Comentários não podem ser apagados, servindo como auditoria.

---

## 📋 Checklist de Entrega (Perfect Checklist)

- [x] **Status Padronizados**: UI amigável (Aberto, Em andamento, Finalizado).
- [x] **Badges Inteligentes**: Cores que mudam conforme o estado do ticket.
- [x] **Segurança Real**: Permissões validadas no JWT e no Banco.
- [x] **CRUD Completo**: Criar, Listar, Ver Detalhes, Editar, Excluir e Alterar Status.
- [x] **Sessão Persistente**: Validação com `/auth/me` para evitar bugs de recarregamento.
- [x] **UX Premium**: Loading states, empty states e feedbacks visuais em Toasts.
- [x] **Service Pattern**: API desacoplada em serviços reutilizáveis.
- [x] **Seeds Demo**: Usuários pré-configurados para teste rápido.

---

## 📸 Screenshots (Mockup)

| Lista de Tickets | Detalhe & Comentários |
| :---: | :---: |
| ![Dashboard](https://via.placeholder.com/400x250?text=Dashboard+TicketFlow) | ![Detalhe](https://via.placeholder.com/400x250?text=Modal+Detalhes) |

---

## 📝 Roadmap Futuro
- [ ] Upload de imagens (anexos) nos tickets.
- [ ] Notificações em tempo real (WebSockets).
- [ ] Exportação de relatórios em PDF para Admins.

---

## 📄 Licença
Este projeto está sob a licença MIT.
