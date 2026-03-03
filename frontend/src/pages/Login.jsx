import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      if (mode === "register") {
        await api.post("/auth/register", { name, email, password, role: "user" });
        setMode("login");
        setMsg("Cadastro feito! Agora faça login.");
        return;
      }

      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/tickets");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Erro. Tente novamente.");
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          {mode === "register" && (
            <input
              style={styles.input}
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={styles.input}
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.btn} type="submit">
            {mode === "login" ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

        <button
          style={styles.link}
          onClick={() => {
            setMsg("");
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login" ? "Criar uma conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "#0b1220",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "white",
    borderRadius: 14,
    padding: 20,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
    outline: "none",
  },
  btn: {
    padding: 12,
    borderRadius: 10,
    border: 0,
    cursor: "pointer",
    background: "#111827",
    color: "white",
    fontWeight: 600,
  },
  link: {
    marginTop: 10,
    background: "transparent",
    border: 0,
    color: "#2563eb",
    cursor: "pointer",
  },
};