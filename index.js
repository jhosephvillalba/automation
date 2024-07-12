require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");

const authRouter = require("./routes/auth");
const cronRouter = require("./routes/cron");

// Configuración de CORS
app.use(cors());

// Configuración de morgan con formato 'tiny'
app.use(morgan("tiny"));

// Middleware para parsear JSON
app.use(express.json());

app.get("/", (req, res) => { 
	res.send("Hello word!"); 
}); 

app.use("/auth", authRouter);
app.use("/cron", cronRouter);

// Iniciar el servidor
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
