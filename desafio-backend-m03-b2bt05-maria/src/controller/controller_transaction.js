const pool = require("../connection");

const listarTransacoes = async (req, res) => {
  try {
    const userId = req.userId;

    const obterTransacoes = await pool.query(
      "select transacoes.*, categorias.descricao as categoria_nome from transacoes join categorias on categorias.id = transacoes.categoria_id where usuario_id = $1",
      [userId]
    );

    const transacoes = obterTransacoes.rows;

    return res.status(200).json(transacoes);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

const detalharTransacao = async (req, res) => {
  const { id } = req.params;
  try {
    if (Number(id) !== req.userId) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }

    const { rows, rowCount } = await pool.query(
      "select id, descricao, valor, data, categoria_id, usuario_id from transacoes where usuario_id = $1",
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

const cadastrarTransacao = async (req, res) => {
  const { tipo, descricao, valor, data, categoria_id } = req.body;

  if (!(tipo && descricao && valor && data && categoria_id)) {
    return res.status(400).json({
      mensagem: "Todos os campos são obrigatórios e devem ser informados.",
    });
  }

  const validarTipo = (tipo) => {
    const tiposPermitidos = ["entrada", "saida"];
    return tiposPermitidos.includes(tipo);
  };

  if (!validarTipo(tipo)) {
    return res.status(400).json({
      mensagem: "O tipo indicado não é válido. Deve ser 'entrada' ou 'saida'.",
    });
  }

  const validarCategoria = async (categoriaId) => {
    try {
      const { rowCount } = await pool.query(
        "SELECT * FROM categorias WHERE id = $1",
        [categoriaId]
      );

      return rowCount > 0;
    } catch (error) {
      console.error("Erro ao validar categoria:", error);
      throw error;
    }
  };

  try {
    const categoriaValida = await validarCategoria(categoria_id);

    if (!categoriaValida) {
      return res
        .status(400)
        .json({ mensagem: "A categoria indicada não é válida." });
    }

    const userId = req.userId;

    const query = `
      INSERT INTO transacoes (tipo, descricao, valor, data, usuario_id, categoria_id) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      tipo,
      descricao,
      valor,
      data,
      userId,
      categoria_id,
    ]);

    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

const atualizarTransacao = async (req, res) => {
  const transacaoId = req.params.id;
  const userId = req.userId;

  const { descricao, valor, data, categoria_id, tipo } = req.body;

  if (!(descricao && valor && data && categoria_id && tipo)) {
    return res.status(400).json({
      mensagem: "Todos os campos são obrigatórios e devem ser informados.",
    });
  }

  try {
    const { rowCount } = await pool.query(
      "SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2",
      [transacaoId, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }
    const { rowCount: categoriaRowCount } = await pool.query(
      "SELECT * FROM categorias WHERE id = $1",
      [categoria_id]
    );

    if (categoriaRowCount === 0) {
      return res
        .status(400)
        .json({ mensagem: "A categoria indicada não é válida." });
    }

    if (tipo !== "entrada" && tipo !== "saida") {
      return res
        .status(400)
        .json({ mensagem: 'O tipo deve ser "entrada" ou "saida".' });
    }

    await pool.query(
      "UPDATE transacoes SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 WHERE id = $6",
      [descricao, valor, data, categoria_id, tipo, transacaoId]
    );

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

const excluirTransacao = async (req, res) => {
  const transacaoId = req.params.id;
  const userId = req.userId;

  try {
    const { rowCount } = await pool.query(
      "select * from transacoes where id = $1 and usuario_id = $2",
      [transacaoId, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }

    await pool.query("delete from transacoes where id = $1", [transacaoId]);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const obterExtrato = async (req, res) => {
  const userId = req.userId;

  try {
    const entradasResultado = await pool.query(
      `SELECT tipo, SUM(valor) AS total FROM transacoes WHERE tipo = 'entrada' AND usuario_id = $1 GROUP BY tipo`,
      [userId]
    );

    const saidasResultado = await pool.query(
      `SELECT tipo, SUM(valor) AS total FROM transacoes WHERE tipo = 'saida' AND usuario_id = $1 GROUP BY tipo`,
      [userId]
    );

    const extrato = {
      entradas:
        entradasResultado.rows.length > 0 ? entradasResultado.rows[0].total : 0,
      saidas:
        saidasResultado.rows.length > 0 ? saidasResultado.rows[0].total : 0,
    };

    return res.status(200).json(extrato);
  } catch (error) {
    console.error("Erro ao obter extrato:", error);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const filtrarTransacoes = async (req, res) => {
  const categoriaEncontrada = req.query.filtro;

  try {
    const { rows } = await pool.query(
      `
      SELECT transacoes.*, categorias.descricao AS categoria_nome FROM transacoes LEFT JOIN categorias ON transacoes.categoria_id = categorias.id
      WHERE 1 = 1 ${categoriaEncontrada ? "AND categorias.descricao = $1" : ""}
    `,
      [categoriaEncontrada].filter(Boolean)
    );

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

module.exports = {
  listarTransacoes,
  detalharTransacao,
  cadastrarTransacao,
  atualizarTransacao,
  excluirTransacao,
  obterExtrato,
  filtrarTransacoes,
};
