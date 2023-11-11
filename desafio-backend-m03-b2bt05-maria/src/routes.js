const express = require("express");
const {
  cadastrarUsuario,
  login,
  detalharUsuario,
  atualizarUsuario,
} = require("./controller/controller_user");
const validarToken = require("./middleware/authentication");
const { listarCategorias } = require("./controller/controller_listcategories");
const {
  listarTransacoes,
  detalharTransacao,
  cadastrarTransacao,
  atualizarTransacao,
  excluirTransacao,
  obterExtrato,
  filtrarTransacoes,
} = require("./controller/controller_transaction");

const rotas = express();

rotas.post("/usuario", cadastrarUsuario);
rotas.post("/login", login);

rotas.use(validarToken);

rotas.get("/usuario", detalharUsuario);
rotas.put("/usuario", atualizarUsuario);
rotas.get("/categoria", listarCategorias);

rotas.get("/transacao", listarTransacoes);
rotas.get("/transacao/extrato", obterExtrato);
rotas.get("/transacao/:id", detalharTransacao);
rotas.post("/transacao", cadastrarTransacao);
rotas.put("/transacao/:id", atualizarTransacao);
rotas.delete("/transacao/:id", excluirTransacao);
rotas.get("/transacao", filtrarTransacoes);

module.exports = rotas;
