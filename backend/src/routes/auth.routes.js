const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/database");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Dados obrigatórios" });

  const password_hash = await bcrypt.hash(password, 10);
  const userRole = role === "admin" ? "admin" : "user";

  db.run(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, password_hash, userRole],
    function (err) {
      if (err) return res.status(400).json({ message: "E-mail já cadastrado" });

      return res.status(201).json({ id: this.lastID, name, email, role: userRole });
    }
  );
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Dados obrigatórios" });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ message: "Credenciais inválidas" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

module.exports = router;