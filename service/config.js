const dotenv = require("dotenv").config();

const { parsed } = dotenv;

const {
  MONGODB_URI,
  PORT,
  JWT_SECRET,

  TRANSPORT_HOST,
  TRANSPORT_PORT,
  TRANSPORT_USER,
  TRANSPORT_PASS,
} = process.env;

const config = {
  MONGODB_URI: MONGODB_URI,
  PORT: PORT,
  JWT_SECRET: JWT_SECRET,
  DEV_ENV: false,
  TRANSPORT_HOST: TRANSPORT_HOST,
  TRANSPORT_PORT: TRANSPORT_PORT,
  TRANSPORT_AUTH_USER: TRANSPORT_USER,
  TRANSPORT_AUTH_PASS: TRANSPORT_PASS,
};
module.exports = config;