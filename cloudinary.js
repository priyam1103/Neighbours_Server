  
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dcabs2hat",
  api_key: "514184225167934",
  api_secret: "qWal5CEo7-PpfYsyEWPthWOfAVg",
});

module.exports = { cloudinary };