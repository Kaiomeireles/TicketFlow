import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./tickets.css";

export default function Tickets() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isAdmin = user?.role === "admin";

  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/tickets", { params: { status, q } });
      setTickets(res.data);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Erro ao carregar chamados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  async function createTicket(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/tickets", { title, description });
      setTitle("");
      setDescription("");
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Erro ao criar chamado");
    }
  }

  async function updateStatus(ticketId, newStatus) {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Erro ao atualizar status");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="tickets-wrap">
      <div className="tickets-container">
        
        <header className="tickets-header">
          <div className="brand">
            <h2>HelpDesk</h2>
            <small>
              Logado como: <b>{user?.name || "Usuário"}</b> ({user?.role || "user"})
            </small>
          </div>
          <button className="btn-outline" onClick={logout}>Sair</button>
        </header>

        <div className="tickets-grid">
          
          {/* COLUNA ESQUERDA: Formulário */}
          <aside className="tickets-left tickets-card">
            <h3>Novo chamado</h3>
            <form onSubmit={createTicket} className="tickets-form">
              <input
                className="tickets-input"
                placeholder="Título do chamado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                className="tickets-input"
                placeholder="Descreva o problema..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <button className="btn-primary" type="submit">Criar chamado</button>
            </form>
            {msg && <p className="msg-feedback">{msg}</p>}
          </aside>

          {/* COLUNA DIREITA: Listagem */}
          <main className="tickets-right tickets-card">
            <div className="list-top-row">
              <h3>Chamados</h3>
              <div className="filters">
                <select
                  className="tickets-input select-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="aberto">Aberto</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="resolvido">Resolvido</option>
                </select>

                <div className="search-group">
                  <input
                    className="tickets-input"
                    placeholder="Buscar..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load()}
                  />
                  <button className="btn-search" onClick={load}>Buscar</button>
                </div>
              </div>
            </div>

            <div className="tickets-list">
              {loading && <p className="status-msg">Carregando chamados...</p>}

              {!loading && tickets.length === 0 && (
                <p className="status-msg empty">Nenhum chamado encontrado.</p>
              )}

              {!loading &&
                tickets.map((t) => (
                  <div key={t.id} className="ticket-item">
                    <div className="ticket-header">
                      <span className="ticket-id">#{t.id} — {t.title}</span>
                      
                      {isAdmin ? (
                        <select
                          className="status-select-mini"
                          value={t.status}
                          onChange={(e) => updateStatus(t.id, e.target.value)}
                        >
                          <option value="aberto">aberto</option>
                          <option value="em_andamento">em_andamento</option>
                          <option value="resolvido">resolvido</option>
                        </select>
                      ) : (
                        <span className={`badge badge-${t.status}`}>{t.status}</span>
                      )}
                    </div>

                    <p className="ticket-desc">{t.description}</p>

                    <div className="ticket-footer">
                      <span>Criado por: <b>{t.created_by_name}</b></span>
                      <span>{t.created_at}</span>
                    </div>
                  </div>
                ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}