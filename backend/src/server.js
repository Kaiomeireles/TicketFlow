const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/tickets.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true, name: "HelpDesk API" }));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));