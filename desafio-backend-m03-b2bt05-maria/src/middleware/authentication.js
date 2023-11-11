const jwt = require("jsonwebtoken");
const senhaJwt = require("../passwordJwt");
const pool = require("../connection");

const validarToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ mensagem: "Não autorizado." });
  }

  const token = authorization.split(" ")[1];

  try {
    const { id } = jwt.verify(token, senhaJwt);

    const usuario = await pool.query("select * from usuarios where id = $1", [
      id,
    ]);

    if (!usuario) {
      return res.status(401).json({ mensagem: "Não autorizado." });
    }

    req.userId = id;

    next();
  } catch (error) {
    return res.status(401).json({
      mensagem:
        "Para acessar este recurso um token de autenticação válido deve ser enviado.",
    });
  }
};

module.exports = validarToken;
