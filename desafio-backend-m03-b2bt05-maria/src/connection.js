const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "dindin",
  password: "230926",
  port: 5432,
});

module.exports = pool;
