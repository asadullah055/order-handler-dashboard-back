require("dotenv").config();
const mongodb_url = process.env.MONGODB_URL;
const serverProt = process.env.SERVERPORT || 5000;

module.exports = {
  mongodb_url,
  serverProt,
};
