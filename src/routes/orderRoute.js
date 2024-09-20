const express = require("express");
const orderController = require("../controller/orderController");
const isLoggedIn = require("../middleware/auth");

const orderRoute = express.Router();

orderRoute.post("/add-order", isLoggedIn, orderController.add_order);
orderRoute.get("/all-order",isLoggedIn,  orderController.get_all_order);
orderRoute.get(
  "/order/:orderNumber",
  isLoggedIn,
  orderController.get_single_order
);
orderRoute.get("/status-order",isLoggedIn, orderController.get_status_order);
orderRoute.put(
  "/update-single-order/:orderNumber", isLoggedIn,
  orderController.update_single_order
);
orderRoute.put(
  "/update-bulk-order",
  isLoggedIn,
  orderController.update_bulk_order
);

module.exports = orderRoute;
