const express = require("express");
const orderController = require("../controller/orderController");
const isLoggedIn = require("../middleware/auth");
const {
  updateOrders,
  updateSingleOrders,
} = require("../controller/History/historyController");

const historyRoute = express.Router();

historyRoute.post("/bulk-action", isLoggedIn, updateOrders);
historyRoute.post("/single-history", isLoggedIn, updateSingleOrders);

/* historyRoute.get("/all-order", isLoggedIn, orderController.get_all_order);

historyRoute.get(
  "/order/:identifier",
  isLoggedIn,
  orderController.get_single_order
);

historyRoute.get("/status-order", isLoggedIn, orderController.get_status_order);

historyRoute.get(
  "/un-settled-order",
  isLoggedIn,
  orderController.get_unsettled_order
);

historyRoute.get("/return-order", isLoggedIn, orderController.get_returned_order);

historyRoute.get("/delivery-failed-order", isLoggedIn, orderController.get_delivery_failed_order);

historyRoute.put(
  "/update-single-order/:orderNumber",
  isLoggedIn,
  orderController.update_single_order
);

historyRoute.put(
  "/update-bulk-order",
  isLoggedIn,
  orderController.update_bulk_order
); */

module.exports = historyRoute;
