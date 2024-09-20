const createError = require("http-errors");
const orderModel = require("../model/orderModel");
const { successMessage } = require("../utill/respons");
const mongoose = require("mongoose");
const objectId = mongoose.Types.ObjectId.createFromHexString;
class orderController {
  add_order = async (req, res, next) => {
    const orders = req.body;
    const sellerId = objectId(req.id);
    const orderNumbers = orders.map((order) => order.orderNumber);

    try {
      const existingOrders = await orderModel.aggregate([
        {
          $match: {
            orderNumber: { $in: orderNumbers },
            sellerId: sellerId,
          },
        },
        {
          $project: { orderNumber: 1 },
        },
      ]);

      // Extract the existing order numbers
      const existingOrderNumbers = existingOrders.map(
        (order) => order.orderNumber
      );

      // Filter out orders that have existing order numbers
      const newOrders = orders.filter(
        (order) => !existingOrderNumbers.includes(order.orderNumber)
      );

      if (newOrders.length === 0) {
        return res.status(400).json({ message: "All orders already exist" });
      }
      const ordersWithSellerId = newOrders.map((order) => ({
        ...order,
        sellerId,
      }));
      // Insert the new orders
      await orderModel.insertMany(ordersWithSellerId);

      successMessage(res, 200, {
        insertedOrders: ordersWithSellerId,
        message: "Order Add success",
      });
    } catch (error) {
      next(error);
    }
  };
  get_all_order = async (req, res, next) => {
    const pageNo = Number(req.query.pageNo) || 1;
    const perPage = Number(req.query.perPage) || 20;
    const status = req.query.orderStatus || "";
    const claim = req.query.claim || "";
    const claimType = req.query.claimType || "";
    const orderNumber = req.query.orderNumber || "";
    const skipRow = (pageNo - 1) * perPage;
    const date = req.query.date ? new Date(req.query.date) : null;
    const receivedDate = req.query.receivedDate
      ? new Date(req.query.receivedDate)
      : null;
    const sellerId = req.id ? objectId(req.id) : null;
    let data;

    // Build the match query
    const matchQuery = {};
    if (status) matchQuery.orderStatus = status;
    if (claim) matchQuery.claim = claim;
    if (claimType) matchQuery.approvedOrReject = claimType;
    if (orderNumber) matchQuery.orderNumber = orderNumber;
    if (date) matchQuery.date = date;
    if (receivedDate) matchQuery.receivedDate = receivedDate;
    if (sellerId) matchQuery.sellerId = sellerId;

    try {
      data = await orderModel.aggregate([
        { $match: matchQuery },
        {
          $facet: {
            total: [{ $count: "count" }],
            orders: [
              { $sort: { date: -1 } },
              { $skip: skipRow },
              { $limit: perPage },
              {
                $project: {
                  orderNumber: 1,
                  date: 1,
                  orderStatus: 1,
                  dfMailDate: 1,
                  receivedDate: 1,
                  claim: 1,
                  approvedOrReject: 1,
                },
              },
            ],
          },
        },
      ]);

      const totalItem = data[0].total[0] ? data[0].total[0].count : 0;

      successMessage(res, 200, {
        totalItem,
        orders: data[0].orders,
      });
    } catch (error) {
      next(error);
    }
  };

  get_single_order = async (req, res, next) => {
    const orderNumber = req.params.orderNumber;
    const sellerId = objectId(req.id);
    try {
      const order = await orderModel.findOne({
        orderNumber: orderNumber,
        sellerId,
      });
      /* if (!order) {
        return res.status(404).json({ message: "Order not found or does not belong to this seller." });
      } */
      successMessage(res, 200, { order });
    } catch (error) {
      next();
    }
  };
  update_single_order = async (req, res, next) => {
    const orderNumber = req.params.orderNumber;
    const updateData = req.body;
    const sellerId = objectId(req.id);

    try {
      const updatedOrder = await orderModel.findOneAndUpdate(
        { sellerId, orderNumber },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      successMessage(res, 200, {
        updatedOrder,
        message: "Order update success",
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  };
  get_status_order = async (req, res, next) => {
    try {
      const data = await orderModel.aggregate([
        { $match: { sellerId: objectId(req.id) } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalDF: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "Delivery Failed"] }, 1, 0],
              },
            },
            totalReturn: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Return"] }, 1, 0] },
            },
          },
        },
      ]);

      const result = data[0] || { totalOrders: 0, totalDF: 0, totalReturn: 0 };

      successMessage(res, 200, {
        totalOrders: result.totalOrders,
        totalDF: result.totalDF,
        totalReturn: result.totalReturn,
      });
    } catch (error) {
      next(error);
    }
  };

  update_bulk_order = async (req, res, next) => {
    try {
      const reqBody = req.body;
      const sellerId = objectId(req.id);
      const orderNumbers = reqBody.map((order) => order.orderNumber);

      const transitOrders = await orderModel.aggregate([
        {
          $match: {
            sellerId: sellerId,
            orderNumber: { $in: orderNumbers },
            orderStatus: "transit",
          },
        },
        {
          $project: { orderNumber: 1, orderStatus: 1 },
        },
      ]);

      const foundOrderNumbers = transitOrders.map((order) => order.orderNumber);
      const missingOrders = orderNumbers.filter(
        (orderNumber) => !foundOrderNumbers.includes(orderNumber)
      );

      const bulkOps = transitOrders.map((order) => {
        const updatedOrder = reqBody.find(
          (item) => item.orderNumber === order.orderNumber
        );

        const update = {
          $set: {
            orderStatus: updatedOrder.status,
            ...(updatedOrder.status === "Delivery Failed" && {
              dfMailDate: updatedOrder.date,
            }),
          },
        };

        return {
          updateOne: {
            filter: { orderNumber: order.orderNumber },
            update,
          },
        };
      });

      await orderModel.bulkWrite(bulkOps);

      successMessage(res, 200, { message: "update success", missingOrders });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new orderController();
