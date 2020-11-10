const mongoose = require("mongoose");
const config = require("./config");
function connectDb() {
  return mongoose.connect(config.MONGODB_URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
module.exports = { connectDb };