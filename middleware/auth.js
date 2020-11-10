const User = require("../model/user");
const jwt = require("jsonwebtoken");
const config = require("../service/config");

module.exports = async function (req, res, next) {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({ message: "Please login to continue" });
    }
    const token = await req.headers.authorization.split(" ")[1];
      if (!token) {
          res.status(401).json({ message: "Please login to continue" });
      } else {
          const decoded = await jwt.verify(token, config.JWT_SECRET);
          const user = await User.findOne({ _id: decoded.id });
          if (!user) {
              res.status(401).json({ message: "Invalid session, Please login again" });
          } else {
              res.locals = user;
            //  console.log(user)
              next();
          }
      }
  } catch (err) {
    res.status(400).json({ message: "Please try again later" });
  }
};