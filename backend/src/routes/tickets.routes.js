const express = require("express");
const db = require("../db/database");
const auth = require("../middlewares/auth");

const router = express.Router();

// Webhook para Vendas Automáticas (Gavision External Integration)
router.post("/external/purchase", (req, res) => {
  const { name, email, plan, platform, payment_method, customer_name, shop_name } = req.body;
  const secret = req.headers['gavision-system-secret'];

  if (secret !== 'gavision_secret_2026') {
    return res.status(401).json({ message: "Acesso não autorizado ao webhook" });
  }

  db.get("SELECT id FROM users WHERE email = 'bot@ticketflow.com'", (err, botUser) => {
    const botId = botUser ? botUser.id : 1;

    const finalPlatform = (platform || 'Android').toUpperCase();
    const finalPlan = (plan || 'bronze').toUpperCase();
    const finalPayment = payment_method || 'Kirvano';
    const cName = customer_name || name;
    const sName = shop_name || name;

    const title = `📥 NOVA LICENÇA ${finalPlatform}: [${finalPlan}] - ${sName}`;
    const description = `Favor realizar o cadastro no gerenciador e setup do logo.`;

    db.run(
      "INSERT INTO tickets (title, description, created_by, priority, category, is_read, meta_plan, platform, payment_method, customer_name, shop_name, customer_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [title, description, botId, 'alta', 'financeiro', 0, plan.toLowerCase(), finalPlatform, finalPayment, cName, sName, email],
      function (err) {
        if (err) return res.status(500).json({ message: "Erro ao registrar venda" });
        res.status(201).json({ message: "Venda registrada com sucesso", ticket_id: this.lastID });
      }
    );
  });
});

// Criar chamado (user/admin)
router.post("/", auth(), (req, res) => {
  const { title, description, priority, category } = req.body;
  if (!title || !description) return res.status(400).json({ message: "Dados obrigatórios" });
  if (title.length < 5 || title.length > 100) return res.status(400).json({ message: "O título deve ter entre 5 e 100 caracteres" });
  if (description.length < 10 || description.length > 2000) return res.status(400).json({ message: "A descrição deve ter entre 10 e 2000 caracteres" });

  const finalPriority = priority || 'media';
  const finalCategory = category || 'suporte';

  db.run(
    "INSERT INTO tickets (title, description, created_by, priority, category) VALUES (?, ?, ?, ?, ?)",
    [title, description, req.user.id, finalPriority, finalCategory],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao criar chamado" });
      const ticketId = this.lastID;

      // Resposta automática do Robô de Suporte (Gavision)
      let botMessage = "🤖 **Assistente Gavision**: Recebemos seu chamado! Nossa equipe já foi notificada.";

      if (category === 'customizacao') {
        botMessage = "🤖 **Assistente Gavision**: Olá! Como você solicitou uma **Customização de Marca**, por favor já descreva o nome da marca exclusiva abaixo para agilizarmos sua licença.";
      } else if (category === 'logomarca') {
        botMessage = "🤖 **Assistente Gavision**: Recebemos seu pedido de **Logomarca**! Por favor, anexe o link da sua logo em alta resolução aqui no chat.";
      } else {
        botMessage = "🤖 **Assistente Gavision**: Recebemos seu chamado! Para agilizar, descreva o problema e se possível envie um print. Um de nossos especialistas entrará em contato em breve.";
      }

      db.get("SELECT id FROM users WHERE email = 'bot@ticketflow.com'", (err, botUser) => {
        const botId = botUser ? botUser.id : 1; // Fallback para ID 1 se o bot não existir
        db.run(
          "INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)",
          [ticketId, botId, botMessage],
          () => {
            res.status(201).json({ id: ticketId });
          }
        );
      });
    }
  );
});

// Estatísticas para Dashboard (admin)
router.get("/admin/stats", auth("admin"), (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as aberto,
      SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
      SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvido
    FROM tickets
  `, (err, row) => {
    if (err) return res.status(500).json({ message: "Erro ao buscar estatísticas" });
    res.json(row);
  });
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

  const { priority, category } = req.query;
  if (priority) {
    filters.push("t.priority = ?");
    params.push(priority);
  }
  if (category) {
    filters.push("t.category = ?");
    params.push(category);
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
    SELECT 
        t.*, 
        u.name as created_by_name, 
        u.plan as created_by_plan, 
        u.email as created_by_email,
        u_ass.name as assigned_to_name
    FROM tickets t
    JOIN users u ON u.id = t.created_by
    LEFT JOIN users u_ass ON u_ass.id = t.assigned_to
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

// Buscar detalhe (user vê o próprio, admin vê todos)
router.get("/:id", auth(), (req, res) => {
  db.get(
    `
    SELECT 
        t.*, 
        u.name as created_by_name, 
        u.plan as created_by_plan, 
        u.email as created_by_email,
        u_ass.name as assigned_to_name
    FROM tickets t
    JOIN users u ON u.id = t.created_by
    LEFT JOIN users u_ass ON u_ass.id = t.assigned_to
    WHERE t.id = ?
  `,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Erro ao buscar chamado" });
      if (!row) return res.status(404).json({ message: "Chamado não encontrado" });

      if (req.user.role !== "admin" && row.created_by !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      // Se for admin abrindo um chamado não lido, marcar como lido
      if (req.user.role === "admin" && row.is_read === 0) {
        db.run("UPDATE tickets SET is_read = 1 WHERE id = ?", [req.params.id]);
      }

      res.json(row);
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

// Atribuir chamado (admin)
router.patch("/:id/assign", auth("admin"), (req, res) => {
  db.run(
    "UPDATE tickets SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?",
    [req.user.id, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao atribuir chamado" });
      res.json({ ok: true });
    }
  );
});

// Editar chamado (user/admin)
router.put("/:id", auth(), (req, res) => {
  const { title, description, priority, category, platform, customer_name, shop_name, customer_email, payment_method, assigned_to } = req.body;
  if (!title || !description) return res.status(400).json({ message: "Dados obrigatórios" });

  db.get("SELECT * FROM tickets WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ message: "Chamado não encontrado" });

    const isAdmin = req.user.role === "admin";
    const isOwner = row.created_by === req.user.id;
    const isAberto = row.status === "aberto";

    if (!isAdmin && (!isOwner || !isAberto)) {
      return res.status(403).json({ message: "Sem permissão para editar (apenas chamados abertos)" });
    }

    db.run(
      "UPDATE tickets SET title = ?, description = ?, priority = ?, category = ?, platform = ?, customer_name = ?, shop_name = ?, customer_email = ?, payment_method = ?, assigned_to = ?, updated_at = datetime('now') WHERE id = ?",
      [
        title,
        description,
        priority || row.priority,
        category || row.category,
        platform || row.platform,
        customer_name || row.customer_name,
        shop_name || row.shop_name,
        customer_email || row.customer_email,
        payment_method || row.payment_method,
        assigned_to !== undefined ? assigned_to : row.assigned_to,
        req.params.id
      ],
      function (err) {
        if (err) return res.status(500).json({ message: "Erro ao atualizar chamado" });
        res.json({ ok: true });
      }
    );
  });
});

// Excluir chamado (user/admin)
router.delete("/:id", auth(), (req, res) => {
  db.get("SELECT * FROM tickets WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ message: "Chamado não encontrado" });

    const isAdmin = req.user.role === "admin";
    const isOwner = row.created_by === req.user.id;
    const isAberto = row.status === "aberto";

    if (!isAdmin && (!isOwner || !isAberto)) {
      return res.status(403).json({ message: "Sem permissão para excluir (apenas chamados abertos)" });
    }

    db.run("DELETE FROM tickets WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ message: "Erro ao excluir chamado" });
      res.json({ ok: true });
    });
  });
});

// Configuração de Upload (Multer) com limites de segurança
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por arquivo
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Formato de arquivo não suportado (Use JPG, PNG ou PDF)"));
  }
});

// Comentários (user/admin) - Com suporte a anexo e limites de caracteres
router.post("/:id/comments", auth(), upload.single("attachment"), (req, res) => {
  const { message } = req.body;
  const attachment = req.file ? req.file.filename : null;

  if (!message && !attachment) return res.status(400).json({ message: "Mensagem ou anexo obrigatório" });
  if (message && (message.trim().length < 3 || message.length > 1000)) {
    return res.status(400).json({ message: "O comentário deve ter entre 3 e 1000 caracteres" });
  }

  // Verificar se o usuário tem acesso ao ticket
  db.get("SELECT created_by FROM tickets WHERE id = ?", [req.params.id], (err, ticket) => {
    if (err || !ticket) return res.status(404).json({ message: "Chamado não encontrado" });

    if (req.user.role !== "admin" && ticket.created_by !== req.user.id) {
      return res.status(403).json({ message: "Sem permissão para comentar" });
    }

    db.run(
      "INSERT INTO comments (ticket_id, user_id, message, attachment) VALUES (?, ?, ?, ?)",
      [req.params.id, req.user.id, message || "", attachment],
      function (err) {
        if (err) return res.status(500).json({ message: "Erro ao comentar" });
        res.status(201).json({ id: this.lastID, attachment });
      }
    );
  });
});

router.get("/:id/comments", auth(), (req, res) => {
  // Verificar se o usuário tem acesso ao ticket
  db.get("SELECT created_by FROM tickets WHERE id = ?", [req.params.id], (err, ticket) => {
    if (err || !ticket) return res.status(404).json({ message: "Chamado não encontrado" });

    if (req.user.role !== "admin" && ticket.created_by !== req.user.id) {
      return res.status(403).json({ message: "Sem permissão para ver comentários" });
    }

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
});

module.exports = router;