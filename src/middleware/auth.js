const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { secretKey } = require("../../secret");

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw createError(404, "Access toke not found. Please Log in");
    }
    const decoded = jwt.verify(token, secretKey);
    

    if (!decoded) {
      throw createError(404, "Invalid Access token. Please Log in");
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
