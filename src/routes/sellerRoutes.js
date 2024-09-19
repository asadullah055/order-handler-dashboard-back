const express = require("express");

const sellerController = require("../controller/sellerController");
const isLoggedIn = require("../middleware/auth");

const sellerRoute = express.Router();

sellerRoute.post("/registration", sellerController.registration_seller);
sellerRoute.post("/seller-login", sellerController.login_seller);
sellerRoute.put("/update-profile", isLoggedIn, sellerController.update_profile);
sellerRoute.get("/get-seller", isLoggedIn, sellerController.get_seller);

module.exports = sellerRoute;
