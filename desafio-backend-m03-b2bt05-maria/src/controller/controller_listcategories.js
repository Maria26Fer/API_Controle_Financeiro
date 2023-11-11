const pool = require("../connection");

const listarCategorias = async (req, res) => {
  try {
    const { rows: categorias } = await pool.query("SELECT * FROM categorias;");

    return res.status(200).json(categorias);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
};

module.exports = { listarCategorias };
