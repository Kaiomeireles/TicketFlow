const jwt = require("jsonwebtoken");

function auth(requiredRole = null) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Token não enviado" });

    const [, token] = header.split(" ");
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;

      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: "Sem permissão" });
      }

      next();
    } catch {
      return res.status(401).json({ message: "Token inválido" });
    }
  };
}

module.exports = auth;