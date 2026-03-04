import { useEffect, useState } from "react";
import { ticketService } from "../services/api";
import { formatStatus, formatPriority, formatCategory, formatPlan } from "../utils/statusLabel";
import { formatDate } from "../utils/dateFormat";
import "./TicketDetail.css";

export default function TicketDetail({ ticketId, onClose, onUpdate, user, showToast }) {
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: "",
        description: "",
        priority: "",
        category: "",
        platform: "",
        customer_name: "",
        shop_name: "",
        customer_email: "",
        payment_method: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const isAdmin = user?.role === "admin";
    const isOwner = ticket?.created_by === user?.id;
    const canModify = isAdmin || (isOwner && ticket?.status === "aberto");

    async function loadDetail(silent = false) {
        if (!silent) setLoading(true);
        try {
            const [ticketRes, commentsRes] = await Promise.all([
                ticketService.get(ticketId),
                ticketService.getComments(ticketId),
            ]);
            setTicket(ticketRes.data);
            setComments(commentsRes.data);
            setEditData({
                title: ticketRes.data.title,
                description: ticketRes.data.description,
                priority: ticketRes.data.priority,
                category: ticketRes.data.category,
                platform: ticketRes.data.platform || "ANDROID",
                customer_name: ticketRes.data.customer_name || "",
                shop_name: ticketRes.data.shop_name || "",
                customer_email: ticketRes.data.customer_email || "",
                payment_method: ticketRes.data.payment_method || "Kirvano"
            });
        } catch (err) {
            setError(err?.response?.data?.message || "Erro ao carregar detalhes");
        } finally {
            if (!silent) setLoading(false);
        }
    }

    useEffect(() => {
        loadDetail();
    }, [ticketId]);

    const [selectedFile, setSelectedFile] = useState(null);

    async function handleAddComment(e) {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || submitting) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("message", newMessage);
            if (selectedFile) {
                formData.append("attachment", selectedFile);
            }

            await ticketService.addComment(ticketId, formData);
            setNewMessage("");
            setSelectedFile(null);
            const res = await ticketService.getComments(ticketId);
            setComments(res.data);
            showToast("Comentário adicionado");
        } catch (err) {
            showToast(err?.response?.data?.message || "Erro ao comentar", "error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAssign() {
        if (submitting) return;
        setSubmitting(true);
        try {
            await ticketService.assign(ticketId);
            await ticketService.addComment(ticketId, { message: `🎧 **${user.name}** assumiu o atendimento deste chamado.` });
            showToast("Você assumiu este chamado!");
            await loadDetail(true);
            onUpdate();
        } catch (err) {
            showToast(err?.response?.data?.message || "Erro ao atribuir", "error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleTransfer(newCategory) {
        if (newCategory === ticket.category || submitting) return;
        setSubmitting(true);
        try {
            await ticketService.update(ticketId, {
                title: ticket.title,
                description: ticket.description,
                priority: ticket.priority,
                category: newCategory,
                assigned_to: null // Libera o chamado para a nova categoria
            });
            await ticketService.addComment(ticketId, { message: `🔄 Chamado transferido para: ${formatCategory(newCategory)}` });
            showToast("Transferência concluída!");
            await loadDetail(true);
            onUpdate();
        } catch (err) {
            showToast("Erro ao transferir", "error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleUpdateStatus(newStatus) {
        if (submitting) return;
        setSubmitting(true);
        try {
            await ticketService.updateStatus(ticketId, newStatus);
            showToast(`Status atualizado para: ${formatStatus(newStatus)}`);
            await loadDetail(true);
            onUpdate();
        } catch (err) {
            showToast(err?.response?.data?.message || "Erro ao atualizar status", "error");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("⚠️ Tem certeza que deseja excluir permanentemente este chamado?")) return;
        try {
            await ticketService.delete(ticketId);
            showToast("Chamado excluído com sucesso");
            onUpdate();
            onClose();
        } catch (err) {
            showToast(err?.response?.data?.message || "Erro ao excluir", "error");
        }
    }

    async function handleSaveEdit() {
        if (!editData.title.trim() || !editData.description.trim()) return;
        try {
            await ticketService.update(ticketId, editData);
            setIsEditing(false);
            showToast("Alterações salvas");
            await loadDetail();
            onUpdate();
        } catch (err) {
            showToast(err?.response?.data?.message || "Erro ao salvar", "error");
        }
    }

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

    if (loading) return <div className="modal-overlay"><div className="modal-content"><p className="modal-status">Carregando detalhes...</p></div></div>;
    if (error || !ticket) return <div className="modal-overlay"><div className="modal-content"><p className="modal-error">{error || "Chamado não encontrado"}</p><button className="btn-close-modal" onClick={onClose}>Fechar</button></div></div>;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="modal-title-area">
                        {isEditing ? (
                            <input
                                className="edit-input-title"
                                value={editData.title}
                                onChange={e => setEditData({ ...editData, title: e.target.value })}
                                placeholder="Título do chamado"
                            />
                        ) : (
                            <h2>#{ticket.id.toString().padStart(3, '0')} — {ticket.title}</h2>
                        )}
                        <div className="header-badges">
                            <span className={`badge priority-${ticket.priority}`}>{formatPriority(ticket.priority)}</span>
                            <span className={`badge badge-${ticket.status}`}>{formatStatus(ticket.status)}</span>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </header>

                <div className="modal-body">
                    <section className="ticket-info">
                        <div className="info-row">
                            <div className="info-item">
                                <span className="info-label">👤 Relatado por:</span>
                                <div className="info-value">
                                    <b>{ticket.created_by_name}</b>
                                    {isAdmin && (
                                        <span className={`plan-badge plan-${ticket.created_by_email === 'bot@ticketflow.com' ? ticket.meta_plan : ticket.created_by_plan}`}>
                                            <img src={getPlanIcon(ticket.created_by_email === 'bot@ticketflow.com' ? ticket.meta_plan : ticket.created_by_plan)} alt="Plano" className="plan-icon-sm" />
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📂 Categoria:</span>
                                <span className="info-value"><b>{formatCategory(ticket.category)}</b></span>
                            </div>
                            {ticket.assigned_to_name && (
                                <div className="info-item">
                                    <span className="info-label">👨‍💻 Atendente:</span>
                                    <span className="info-value"><b>{ticket.assigned_to_name}</b></span>
                                </div>
                            )}
                            <div className="info-item">
                                <span className="info-label">📅 Data:</span>
                                <span className="info-value">{formatDate(ticket.created_at)}</span>
                            </div>
                        </div>

                        <div className={`description-box ${isEditing ? 'editing' : ''}`}>
                            {isEditing ? (
                                <>
                                    {ticket.created_by_email === 'bot@ticketflow.com' ? (
                                        <div className="license-edit-grid">
                                            <div className="edit-field-item">
                                                <label>Nome do Cliente:</label>
                                                <input
                                                    value={editData.customer_name}
                                                    onChange={e => setEditData({ ...editData, customer_name: e.target.value })}
                                                    placeholder="Ex: João Silva"
                                                />
                                            </div>
                                            <div className="edit-field-item">
                                                <label>Nome da Ótica:</label>
                                                <input
                                                    value={editData.shop_name}
                                                    onChange={e => setEditData({ ...editData, shop_name: e.target.value })}
                                                    placeholder="Ex: Ótica Gavision Central"
                                                />
                                            </div>
                                            <div className="edit-field-item">
                                                <label>Email do Cliente:</label>
                                                <input
                                                    value={editData.customer_email}
                                                    onChange={e => setEditData({ ...editData, customer_email: e.target.value })}
                                                    placeholder="cliente@email.com"
                                                />
                                            </div>
                                            <div className="edit-field-item">
                                                <label>Método de Pagamento:</label>
                                                <input
                                                    value={editData.payment_method}
                                                    onChange={e => setEditData({ ...editData, payment_method: e.target.value })}
                                                    placeholder="Ex: Kirvano, PIX..."
                                                />
                                            </div>
                                            <div className="edit-field-item edit-field-full">
                                                <label>Instruções/Notas Internas:</label>
                                                <textarea
                                                    value={editData.description}
                                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                                    placeholder="Notas internas ou instruções..."
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <textarea
                                            className="edit-input-desc"
                                            value={editData.description}
                                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                                            placeholder="Dê detalhes sobre o problema..."
                                        />
                                    )}
                                    <div className="edit-form-row">
                                        <div className="edit-field-group">
                                            <label>Categoria:</label>
                                            <select value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })}>
                                                <option value="suporte">🛠️ Suporte Técnico</option>
                                                <option value="financeiro">💰 Financeiro/Licença</option>
                                                <option value="bug">🐛 Bug/Erro</option>
                                                <option value="sugestao">💡 Sugestão</option>
                                            </select>
                                        </div>
                                        <div className="edit-field-group">
                                            <label>Prioridade:</label>
                                            <select value={editData.priority} onChange={e => setEditData({ ...editData, priority: e.target.value })}>
                                                <option value="baixa">Baixa</option>
                                                <option value="media">Média</option>
                                                <option value="alta">Alta</option>
                                            </select>
                                        </div>
                                        {isAdmin && (
                                            <div className="edit-field-group">
                                                <label>Plataforma:</label>
                                                <select value={editData.platform} onChange={e => setEditData({ ...editData, platform: e.target.value })}>
                                                    <option value="ANDROID">🤖 ANDROID</option>
                                                    <option value="IOS">🍎 IOS</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {ticket.created_by_email === 'bot@ticketflow.com' ? (
                                        <div className="license-fields-grid">
                                            <div className="license-field-item">
                                                <span className="field-label">Dispositivo/Plataforma:</span>
                                                <span className={`field-value platform-${ticket.platform?.toLowerCase()}`}>
                                                    {ticket.platform === 'IOS' ? '🍎 IOS' : '🤖 ANDROID'}
                                                </span>
                                            </div>
                                            <div className="license-field-item">
                                                <span className="field-label">Plano Contratado:</span>
                                                <span className="field-value">
                                                    <span className="field-emoji">{getPlanEmoji(ticket.meta_plan)}</span>
                                                    {ticket.meta_plan?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="license-field-item">
                                                <span className="field-label">Nome do Cliente:</span>
                                                <span className="field-value">{ticket.customer_name || '-'}</span>
                                            </div>
                                            <div className="license-field-item">
                                                <span className="field-label">Nome da Ótica:</span>
                                                <span className="field-value">{ticket.shop_name || '-'}</span>
                                            </div>
                                            <div className="license-field-item">
                                                <span className="field-label">Email Responsável:</span>
                                                <span className="field-value">{ticket.customer_email || '-'}</span>
                                            </div>
                                            <div className="license-field-item">
                                                <span className="field-label">Método de Pagamento:</span>
                                                <span className="field-value">💳 {ticket.payment_method || 'Externo'}</span>
                                            </div>
                                            <div className="license-field-full">
                                                <span className="field-label">Instruções Internas:</span>
                                                <p className="field-desc-text">{ticket.description || 'Nenhuma instrução adicional.'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p>{ticket.description}</p>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="actions-row">
                            {isAdmin && (
                                <div className="admin-actions">
                                    <div className="status-control">
                                        <label>Mudar status:</label>
                                        <select
                                            className="ticket-select-sm"
                                            value={ticket.status}
                                            onChange={(e) => handleUpdateStatus(e.target.value)}
                                            disabled={submitting}
                                        >
                                            <option value="aberto">Aberto</option>
                                            <option value="em_andamento">Em andamento</option>
                                            <option value="resolvido">Finalizado</option>
                                        </select>
                                    </div>

                                    <div className="status-control">
                                        <label>Transferir para:</label>
                                        <select
                                            className="ticket-select-sm"
                                            value={ticket.category}
                                            onChange={(e) => handleTransfer(e.target.value)}
                                            disabled={submitting}
                                        >
                                            <option value="suporte">🛠️ Suporte Técnico</option>
                                            <option value="financeiro">💰 Financeiro</option>
                                            <option value="bug">🐛 Bug/Erro</option>
                                            <option value="sugestao">💡 Sugestão</option>
                                        </select>
                                    </div>

                                    {ticket.assigned_to !== user.id && (
                                        <button
                                            className="btn-outline-sm btn-assign"
                                            onClick={handleAssign}
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Aguarde...' : 'Atribuir a mim'}
                                        </button>
                                    )}
                                    {ticket.assigned_to === user.id && (
                                        <span className="assigned-badge">✅ Você é o responsável</span>
                                    )}
                                </div>
                            )}

                            <div className="user-actions">
                                {canModify && !isEditing && (
                                    <button className="btn-edit" onClick={() => setIsEditing(true)}>Editar</button>
                                )}
                                {isEditing && (
                                    <>
                                        <button className="btn-save" onClick={handleSaveEdit}>Salvar Alterações</button>
                                        <button className="btn-outline-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                                    </>
                                )}
                                {canModify && (
                                    <button className="btn-danger" onClick={handleDelete}>Excluir</button>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="comments-section">
                        <h3>💬 Histórico de Atendimento</h3>
                        <div className="comments-list">
                            {comments.length === 0 && <p className="empty-msg">Nenhuma interação registrada ainda.</p>}
                            {comments.map(c => (
                                <div key={c.id} className={`comment-item ${c.user_id === user.id ? 'mine' : ''}`}>
                                    <div className="comment-header">
                                        <b>{c.user_id === user.id ? 'Você' : c.user_name}</b>
                                        <small>{formatDate(c.created_at)}</small>
                                    </div>
                                    {c.message && <p>{c.message}</p>}
                                    {c.attachment && (
                                        <div className="comment-attachment">
                                            <a href={`http://localhost:3333/uploads/${c.attachment}`} target="_blank" rel="noreferrer">
                                                <img src={`http://localhost:3333/uploads/${c.attachment}`} alt="Anexo" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <form className="comment-form" onSubmit={handleAddComment}>
                            <label className="btn-attach" title="Anexar (Máx 5MB)">
                                📎
                                <input
                                    type="file"
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file && file.size > 5 * 1024 * 1024) {
                                            showToast("Arquivo muito grande! Máximo 5MB.", "error");
                                            e.target.value = null;
                                            return;
                                        }
                                        setSelectedFile(file);
                                    }}
                                    style={{ display: 'none' }}
                                    accept="image/*,application/pdf"
                                />
                            </label>
                            <div className="comment-input-wrap">
                                <input
                                    placeholder={selectedFile ? `Arquivo: ${selectedFile.name}` : "Escreva uma mensagem..."}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    maxLength={1000}
                                    disabled={submitting}
                                />
                                {newMessage.length > 800 && (
                                    <span className="comment-char-counter">{newMessage.length}/1000</span>
                                )}
                            </div>
                            <button type="submit" disabled={(!newMessage.trim() && !selectedFile) || submitting}>
                                {submitting ? '...' : 'Enviar'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
