import { useEffect, useState, useCallback } from "react";
import { authService, ticketService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { formatStatus, formatPriority, formatCategory, formatPlan } from "../utils/statusLabel";
import { formatDateShort } from "../utils/dateFormat";
import TicketDetail from "../components/TicketDetail";
import Toast from "../components/Toast";
import "./tickets.css";

export default function Tickets() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "media", category: "suporte" });
  const [stats, setStats] = useState(null);

  const [toast, setToast] = useState({ message: "", type: "success" });
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Validar sessão ao carregar
  const checkSession = useCallback(async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ticketService.list({
        status,
        priority,
        category,
        q: debouncedQ
      });
      setTickets(res.data);

      const userStored = JSON.parse(localStorage.getItem("user") || "{}");
      if (userStored.role === "admin") { // Use userStored here as `user` might not be updated yet from checkSession
        const statsRes = await ticketService.getStats();
        setStats(statsRes.data);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Erro ao carregar chamados", "error");
    } finally {
      setLoading(false);
    }
  }, [status, priority, category, debouncedQ, user?.role]);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    checkSession().then(() => {
      load();
    });
  }, [checkSession, load]);

  async function createTicket(e) {
    e.preventDefault();
    try {
      await ticketService.create(newTicket);
      setNewTicket({ title: "", description: "", priority: "media", category: "suporte" });
      showToast("Chamado aberto com sucesso!");
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || "Erro ao abrir chamado", "error");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const resolvedPercent = stats ? Math.round((stats.resolvido / stats.total) * 100) || 0 : 0;

  const getPlanIcon = (plan) => {
    const icons = {
      bronze: "bronzee.png",
      silver: "prataa.png",
      gold: "goldd.png",
      ruby: "ruby.png"
    };
    return `/imagens/${icons[plan] || 'ruby.png'}`;
  };

  const getPlanEmoji = (plan) => {
    const emojis = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      ruby: "💎"
    };
    return emojis[plan] || "🎫";
  };

  return (
    <div className="tickets-wrap">
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      )}

      <div className="tickets-container">

        <header className="tickets-header">
          <div className="brand">
            <div className="brand-title">
              {user?.role === "admin" ? (
                <div className="gavision-logo-container">
                  <img src="/imagens/ruby.png" alt="Gavision" className="gavision-main-logo" />
                  <span className="tf-badge">TicketFlow</span>
                </div>
              ) : (
                <h2>TicketFlow</h2>
              )}
            </div>
            <small>
              Operador: <b>{user?.name || "..."}</b> — {user?.role === "admin" ? (
                <span className="admin-team-badge">🛡️ Time Gavision</span>
              ) : (
                <span className={`plan-badge-inline plan-${user?.plan}`}>
                  <img src={getPlanIcon(user?.plan)} alt={user?.plan} className="plan-icon-sm" />
                </span>
              )}
            </small>
          </div>
          <button className="btn-outline" onClick={logout}>Encerrar Sessão</button>
        </header>

        {user?.role === "admin" && stats && (
          <section className="stats-dashboard">
            <div className="stats-main-info">
              <div className="stat-card">
                <span>Total</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="stat-card aberto">
                <span>Abertos</span>
                <strong>{stats.aberto}</strong>
              </div>
              <div className="stat-card em_andamento">
                <span>Em andamento</span>
                <strong>{stats.em_andamento}</strong>
              </div>
              <div className="stat-card resolvido">
                <span>Finalizados</span>
                <strong>{stats.resolvido}</strong>
              </div>
            </div>

            <div className="stats-chart-card">
              <div className="chart-donut" style={{ "--p": resolvedPercent }}>
                <span>{resolvedPercent}%</span>
              </div>
              <div className="chart-info">
                <h4>Eficiência</h4>
                <p>Resolvidos do total</p>
              </div>
            </div>
          </section>
        )}

        <div className="tickets-grid">

          <aside className="tickets-left tickets-card">
            <div className="card-header-icon">
              <h3>✨ Novo Chamado</h3>
            </div>
            <form onSubmit={createTicket} className="tickets-form">
              <div className="input-with-limit">
                <input
                  className="tickets-input"
                  placeholder="Título curto e objetivo"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  maxLength={100}
                  required
                />
                <span className={`char-counter ${newTicket.title.length > 90 ? 'limit' : ''}`}>
                  {newTicket.title.length}/100
                </span>
              </div>

              <div className="input-with-limit">
                <textarea
                  className="tickets-input"
                  placeholder="Descreva o problema com detalhes..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  maxLength={2000}
                  required
                />
                <span className={`char-counter ${newTicket.description.length > 1800 ? 'limit' : ''}`}>
                  {newTicket.description.length}/2000
                </span>
              </div>

              <div className="form-row-full">
                <select
                  className="tickets-input"
                  style={{ width: '100%' }}
                  value={newTicket.category}
                  onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                >
                  <option value="suporte">🛠️ Suporte Técnico</option>
                  <option value="financeiro">💰 Financeiro/Licença</option>
                  <option value="customizacao" disabled={user?.plan === 'bronze'}>
                    {user?.plan === 'bronze' ? "🔒 Customização (Silver+)" : "✨ Customização (Progressiva)"}
                  </option>
                  <option value="logomarca" disabled={user?.plan === 'bronze'}>
                    {user?.plan === 'bronze' ? "🔒 Logomarca (Silver+)" : "🎨 Logomarca da Ótica"}
                  </option>
                </select>
              </div>

              <button className="btn-primary" type="submit">Abrir Chamado</button>
            </form>
          </aside>

          <main className="tickets-right tickets-card">
            <div className="list-top-row">
              <h3>🔍 Filtrar Suporte Gavision</h3>
              <div className="filters-grid">
                <select className="tickets-input-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Todos os Status</option>
                  <option value="aberto">Aberto</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="resolvido">Finalizado</option>
                </select>
                <select className="tickets-input-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="">Prioridades</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
                <select className="tickets-input-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Categorias Gavision</option>
                  <option value="suporte">Suporte Técnico</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="customizacao">Customização</option>
                  <option value="logomarca">Logomarca</option>
                </select>

                <div className="search-group">
                  <input
                    className="tickets-input"
                    placeholder="Busque por licença, marca ou problema..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="tickets-list">
              {loading && <p className="status-msg">Sincronizando dados...</p>}

              {!loading && tickets.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p className="status-msg">Nenhum chamado encontrado.</p>
                </div>
              )}

              {!loading &&
                tickets.map((t) => (
                  <div
                    key={t.id}
                    className={`ticket-item clickable priority-${t.priority} ${t.created_by_email === 'bot@ticketflow.com' && t.is_read === 0 ? 'is-sale' : ''}`}
                    onClick={() => setSelectedTicketId(t.id)}
                  >
                    {t.created_by_email === 'bot@ticketflow.com' && t.is_read === 0 && (
                      <span className="sale-badge">✨ Nova Licença</span>
                    )}
                    <div className="ticket-header">
                      <span className="ticket-id">#{t.id.toString().padStart(3, '0')}</span>
                      <span className="ticket-category">{formatCategory(t.category)}</span>
                      <span className="ticket-title">{t.title}</span>
                      <div className="header-badges">
                        <span className={`badge priority-${t.priority}`}>{formatPriority(t.priority)}</span>
                        <span className={`badge badge-${t.status}`}>{formatStatus(t.status)}</span>
                      </div>
                    </div>

                    {t.created_by_email === 'bot@ticketflow.com' ? (
                      <div className="license-summary-row">
                        <span className="summary-p-item">
                          <span className="summary-emoji">{getPlanEmoji(t.meta_plan)}</span>
                          <b>{t.meta_plan?.toUpperCase()}</b>
                        </span>
                        <span className="summary-p-item">
                          {t.platform === 'IOS' ? '🍎 IOS' : '🤖 ANDROID'}
                        </span>
                        <span className="summary-p-item customer-name">
                          👤 {t.customer_name || 'Cliente'}
                        </span>
                      </div>
                    ) : (
                      <p className="ticket-desc">{t.description}</p>
                    )}

                    <div className="ticket-footer">
                      <div className="footer-left">
                        <span className="footer-user">👤 {t.created_by_name}</span>
                        {user?.role === "admin" && (
                          <span className={`plan-badge plan-${t.created_by_email === 'bot@ticketflow.com' ? t.meta_plan : t.created_by_plan}`}>
                            <img src={getPlanIcon(t.created_by_email === 'bot@ticketflow.com' ? t.meta_plan : t.created_by_plan)} alt="Plano" className="plan-icon-sm" />
                          </span>
                        )}
                        {t.assigned_to_name && (
                          <span className="footer-assigned">👨‍💻 {t.assigned_to_name}</span>
                        )}
                      </div>
                      <span className="footer-date">📅 {formatDateShort(t.created_at)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </main>
        </div>
      </div>

      {selectedTicketId && (
        <TicketDetail
          ticketId={selectedTicketId}
          user={user}
          showToast={showToast}
          onClose={() => {
            setSelectedTicketId(null);
            load();
          }}
          onUpdate={() => load()}
        />
      )}
    </div>
  );
}