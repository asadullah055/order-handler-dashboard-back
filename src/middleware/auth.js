const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { secretKey } = require("../../secret");

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw createError(401, "Access token not found. Please log in");
    }
    const decoded = jwt.verify(token, secretKey);

    if (!decoded) {
      throw createError(401, "Invalid access token. Please log in");
    }
    req.id = decoded.id;
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  } catch (error) {
    next(error);
  }
};
module.exports = isLoggedIn;
