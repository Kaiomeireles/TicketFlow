const express = require("express");
const db = require("../db/database");
const auth = require("../middlewares/auth");

const router = express.Router();

// Criar chamado (user/admin)
router.post("/", auth(), (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ message: "Dados obrigatórios" });

  db.run(
    "INSERT INTO tickets (title, description, created_by) VALUES (?, ?, ?)",
    [title, description, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao criar chamado" });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Listar chamados (user vê os próprios, admin vê todos)
router.get("/", auth(), (req, res) => {
  const { status, q } = req.query;

  const filters = [];
  const params = [];

  if (status) {
    filters.push("t.status = ?");
    params.push(status);
  }

  if (q) {
    filters.push("(t.title LIKE ? OR t.description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  if (req.user.role !== "admin") {
    filters.push("t.created_by = ?");
    params.push(req.user.id);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  db.all(
    `
    SELECT t.*, u.name as created_by_name
    FROM tickets t
    JOIN users u ON u.id = t.created_by
    ${where}
    ORDER BY t.created_at DESC
  `,
    params,
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erro ao listar chamados" });
      res.json(rows);
    }
  );
});

// Atualizar status (admin)
router.patch("/:id/status", auth("admin"), (req, res) => {
  const { status } = req.body;
  const allowed = ["aberto", "em_andamento", "resolvido"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Status inválido" });

  db.run(
    "UPDATE tickets SET status = ?, updated_at = datetime('now') WHERE id = ?",
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao atualizar status" });
      if (this.changes === 0) return res.status(404).json({ message: "Chamado não encontrado" });
      res.json({ ok: true });
    }
  );
});

// Comentários (user/admin)
router.post("/:id/comments", auth(), (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: "Mensagem obrigatória" });

  db.run(
    "INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)",
    [req.params.id, req.user.id, message],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao comentar" });
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.get("/:id/comments", auth(), (req, res) => {
  db.all(
    `
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.ticket_id = ?
    ORDER BY c.created_at ASC
  `,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Erro ao buscar comentários" });
      res.json(rows);
    }
  );
});

module.exports = router;