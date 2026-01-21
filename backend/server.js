const express = require("express");
const cors = require("cors");
const swaggerSetup = require("./swagger");
const { logger, httpLogger } = require('./app/config/logger');
const app = express();

var corsOptions = {

origin: 'http://13.201.53.176:5173',
};


app.use(cors(corsOptions));

app.use(httpLogger);

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    logger.info('Connected to the database!');
  })
  .catch(err => {
    logger.error({ err }, 'Cannot connect to the database!');
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  
  res.json({ message: "Welcome to bezkoder application." });
});

require("./app/routes")(app);
//require("./app/routes/turorial.routes")(app);

// set port, listen for requests


swaggerSetup(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info({ port: PORT }, `Server is running on port ${PORT}.`);
});
