const express = require("express");
const orderController = require("../controller/orderController");
const isLoggedIn = require("../middleware/auth");

const orderRoute = express.Router();

orderRoute.post("/add-order", isLoggedIn, orderController.add_order);

orderRoute.get("/all-order", isLoggedIn, orderController.get_all_order);

orderRoute.get(
  "/order/:identifier",
  isLoggedIn,
  orderController.get_single_order
);

orderRoute.get("/status-order", isLoggedIn, orderController.get_status_order);

orderRoute.get(
  "/un-settled-order",
  isLoggedIn,
  orderController.get_unsettled_order
);

orderRoute.get("/return-order", isLoggedIn, orderController.get_returned_order);
orderRoute.get("/transit-order", isLoggedIn, orderController.get_transit_order);

orderRoute.get("/delivery-failed-order", isLoggedIn, orderController.get_delivery_failed_order);

orderRoute.put(
  "/update-single-order/:orderNumber",
  isLoggedIn,
  orderController.update_single_order
);

orderRoute.put(
  "/update-bulk-order",
  isLoggedIn,
  orderController.update_bulk_order
);
orderRoute.delete("/delete-orders", isLoggedIn, orderController.delete_orders);

module.exports = orderRoute;
