require("dotenv").config();
const mongodb_url = process.env.MONGODB_URL;
const serverProt = process.env.SERVERPORT || 5000;
const secretKey = process.env.SECRETJWT_SECRETE_KEY
const cloudName = process.env.CLOUD_NAME
const cloudApiKey = process.env.API_KEY
const cloudApiSecret = process.env.API_SECRET
module.exports = {
  mongodb_url,
  serverProt,
  secretKey,
  cloudName,
  cloudApiKey,
  cloudApiSecret
};
