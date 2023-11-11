const express = require("express");
const rotas = require("./routes");

const app = express();

const port = 3000;

app.use(express.json());
app.use(rotas);

app.listen(port, () => {
  console.log(`Server is runing on http://localhost:${port}`);
});
