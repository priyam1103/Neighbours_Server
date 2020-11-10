const mongoose = require("mongoose");
const config = require("./config");
function connectDb() {
  return mongoose.connect("mongodb+srv://priyam1103:priyam7035@cluster0.cis4d.mongodb.net/Neighbours?retryWrites=true&w=majority", {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
module.exports = { connectDb };