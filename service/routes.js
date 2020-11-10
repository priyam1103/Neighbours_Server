const bodyParser = require("body-parser");
module.exports = function (app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use("/user", require("../routes/auth"));
 // app.use("/details", require("../routes/user"));
};