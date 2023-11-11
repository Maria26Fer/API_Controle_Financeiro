const pool = require("../connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const senhaJwt = require("../passwordJwt");

const cadastrarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!(nome && email && senha)) {
    return res.status(400).json({
      mensagem: "Todos os campos devem ser informados.",
    });
  }
  try {
    const emailExiste = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );
    if (emailExiste.rowCount > 0) {
      return res.status(400).json({
        mensagem: "Já existe usuário cadastrado com o e-mail informado.",
      });
    }
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const query = `
  insert into usuarios (nome, email, senha) 
  values ($1, $2, $3) returning *
  `;
    const { rows } = await pool.query(query, [nome, email, senhaCriptografada]);
    const { senha: _, ...usuario } = rows[0];
    return res.status(201).json(usuario);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

const login = async (req, res) => {
  const { email, senha } = req.body;
  if (!(email && senha)) {
    return res.status(400).json({
      mensagem: "Os campos devem ser informados.",
    });
  }
  try {
    const usuario = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );
    if (usuario.rowCount < 1) {
      return res
        .status(404)
        .json({ mensagem: "Usuário e/ou senha inválido(s)." });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);
    if (!senhaValida) {
      return res
        .status(400)
        .json({ mensagem: "Usuário e/ou senha inválido(s)." });
    }
    const token = await jwt.sign({ id: usuario.rows[0].id }, senhaJwt, {
      expiresIn: "8h",
    });
    const { senha: _, ...usuarioLogado } = usuario.rows[0];
    return res.status(200).json({ usuario: usuarioLogado, token });
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

const detalharUsuario = async (req, res) => {
  const userId = req.userId;

  const usuario = await pool.query(
    "select id, nome, email from usuarios where id = $1",
    [userId]
  );

  const response = usuario.rows[0];

  return res.status(200).json(response);
};

const atualizarUsuario = async (req, res) => {
  try {
    const userId = req.userId;
    const { nome, email, senha } = req.body;

    const query = `
      UPDATE usuarios
      SET nome = $1, email = $2, senha = $3
      WHERE id = $4
    `;

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    await pool.query(query, [nome, email, senhaCriptografada, userId]);

    return res.status(200).send();
  } catch (error) {
    if (error.constraint === "usuarios_email_key") {
      return res.status(401).json({
        mensagem:
          "O e-mail informado já está sendo utilizado por outro usuário.",
      });
    }
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

module.exports = {
  cadastrarUsuario,
  login,
  detalharUsuario,
  atualizarUsuario,
};
