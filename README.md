# 🎫 TicketFlow — Gavision HelpDesk

O **TicketFlow** é um ecossistema de HelpDesk profissional e automatizado, desenvolvido sob medida para a **Gavision Solutions**. Ele combina a agilidade de um sistema de tickets tradicional com a inteligência de uma integração de vendas automática, permitindo gerenciar licenças (Android/iOS) e suporte técnico de forma centralizada.

---

## ✨ Funcionalidades de Elite

### 🤖 Integração Externa (Webhook)
- **Vendas Automáticas**: Integrado via webhook (ex: Kirvano) para criar chamados estruturados assim que uma nova licença é vendida.
- **Dados Estruturados**: Captura automática de **Plano** (Ruby, Gold, Silver, Bronze), **Plataforma** (Android/iOS), **Loja**, **Cliente** e **Pagamento**.

### 🏢 Gerenciamento Administrativo (Admin)
- **Painel de Controle**: Dashboard com estatísticas em tempo real (Total, Abertos, Em Andamento, Finalizados).
- **Triagem Inteligente**: Transferência de chamados entre departamentos (Suporte, Financeiro, Logomarca, Customização) com **desvinculação automática** de atendente para novos picks.
- **Atendimento Personalizado**: Ferramenta de "Atribuir a mim" para garantir que cada chamado tenha um responsável claro.
- **Edição Avançada**: Controle total sobre os dados da licença e notas internas.

### 👤 Experiência do Usuário (Cliente)
- **Abertura Simplificada**: Interface intuitiva para reporte de problemas e pedidos de logomarca/customização.
- **Histórico Completo**: Chat em tempo real para troca de mensagens e envio de anexos.

---

## 🛡️ Segurança e Robustez

- **Filtro Anti-Abuso**: Limite de caracteres em títulos (100) e descrições (2000) com contadores visuais no frontend.
- **Gestão de Anexos**: Upload de imagens e PDFs limitado a **5MB** para preservar a saúde do servidor.
- **Permissões Granulares**: Segurança baseada em JWT, garantindo que usuários vejam apenas o que lhes pertence, enquanto admins possuem visão 360º.
- **Timezone**: Datas e horários sincronizados corretamente com o horário de Brasília (UTC-3).

---

## 🛠️ Stack Tecnológica

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) (Foco em performance e design customizado).
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/).
- **Banco de Dados**: [SQLite](https://sqlite.org/) (Persistência local rápida com suporte a migrações).
- **Segurança**: JWT (JSON Web Token) e Bcrypt.

---

## 🚀 Como Executar

### 1. Clonar e Instalar
```bash
git clone https://github.com/Kaiomeireles/helpdesk.git
cd helpdesk
```

### 2. Backend
```bash
cd backend
npm install
# Crie um arquivo .env com JWT_SECRET e PORT
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Contas de Teste (Padrão)

- **Administrador**: `admin@ticketflow.com` / `123456`
- **Usuário Demo**: `user@ticketflow.com` / `123456`

---

## 📸 Identidade Visual (Gavision Style)

O sistema utiliza a paleta de cores institucional da **Gavision Solutions**, com foco no **Rosa Gavision (#db2777)**, tons de Slate e tipografia moderna para uma experiência de software SaaS premium.

---

## 👤 Autor

**Kaio Meireles**  
[GitHub](https://github.com/Kaiomeireles) | [LinkedIn](https://github.com/Kaiomeireles)
