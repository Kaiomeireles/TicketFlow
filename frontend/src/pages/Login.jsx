import { useState } from "react";
import { authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authService.login({ email: form.email, password: form.password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        showToast("Bem-vindo(a) de volta!");
        setTimeout(() => navigate("/tickets"), 1000);
      } else {
        await authService.register(form);
        showToast("Conta criada! Agora faça seu login.");
        setIsLogin(true);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Ocorreu um erro inesperado", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      )}

      <div className="login-container">
        <header className="login-header">
          <h1>TicketFlow</h1>
          <p>{isLogin ? "Acesse sua conta para gerenciar chamados" : "Crie sua conta no maior helpdesk do Brasil"}</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Nome Completo</label>
              <input
                type="text"
                placeholder="Como quer ser chamado?"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>E-mail Corporativo</label>
            <input
              type="email"
              placeholder="exemplo@empresa.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Acessar Sistema" : "Criar Minha Conta"}
          </button>
        </form>

        <footer className="login-footer">
          <button className="btn-switch" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? (
              <>Não tem conta? <span>Cadastre-se aqui</span></>
            ) : (
              <>Já tem conta? <span>Faça login aqui</span></>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}