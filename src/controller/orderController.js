const createError = require("http-errors");
const orderModel = require("../model/orderModel");
const { successMessage } = require("../utill/respons");
const mongoose = require("mongoose");
const get_order = require("../service/getOrderService");
const e = require("express");
const orderHistory = require("../model/orderHistoryModel");
const objectId = mongoose.Types.ObjectId.createFromHexString;
class orderController {
  add_order = async (req, res, next) => {
    const { newOrders } = req.body;

    const sellerId = objectId(req.id);
    const orderNumbers = newOrders.map((order) => order.orderNumber);

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
      const orders = newOrders.filter(
        (order) => !existingOrderNumbers.includes(order.orderNumber)
      );

      if (!req.body.confirmInsert) {
        return res.status(200).json({
          uniqueOrderCount: orders.length,
          message: "Total unique order numbers",
        });
      }

      if (orders.length === 0) {
        return res.status(400).json({ message: "All orders already exist" });
      }

      const ordersWithSellerId = orders.map((order) => ({
        ...order,
        sellerId,
      }));

      // Insert the new orders
      const insertedOrders = await orderModel.insertMany(ordersWithSellerId);

      const historyLogs = insertedOrders.map((order) => ({
        orderNumber: order.orderNumber,
        previousData: null, // No previous data for new orders
        changes: { ...order._doc },
      }));

      await orderHistory.insertMany(historyLogs);

      successMessage(res, 200, {
        insertedOrders: ordersWithSellerId,
        message: "Order Add success",
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  };
  get_all_order = async (req, res, next) => {
    const pageNo = Number(req.query.pageNo) || 1;
    const perPage = Number(req.query.perPage) || 20;
    const status = Array.isArray(req.query.orderStatus)
      ? req.query.orderStatus
      : req.query.orderStatus
      ? [req.query.orderStatus]
      : [];
    const claim = Array.isArray(req.query.claim)
      ? req.query.claim
      : req.query.claim
      ? [req.query.claim]
      : [];
    const settled = Array.isArray(req.query.settled)
      ? req.query.settled
      : req.query.settled
      ? [req.query.settled]
      : [];

    const orderNumber = req.query.orderNumber || "";
    const skipRow = (pageNo - 1) * perPage;

    const { startDate, endDate } = req.query.date || {};
    const receivedDate = req.query.receivedDate || {};
    const dfMailDate = req.query.dfMailDate || {};
    const sellerId = req.id ? objectId(req.id) : null;

    const matchQuery = {};

    if (status.length) matchQuery.orderStatus = { $in: status };
    if (claim.length) matchQuery.claim = { $in: claim };
    if (settled.length) matchQuery.settled = { $in: settled };
    if (sellerId) matchQuery.sellerId = sellerId;

    if (orderNumber.length >= 5 || orderNumber.length === 3) {
      const lastFour = orderNumber.slice(-4);
      const findOrder = await orderModel.aggregate([
        {
          $match: {
            $or: [
              { orderNumber: orderNumber },
              { claimType: { $elemMatch: { caseNumber: orderNumber } } },
            ],
          },
        },
      ]);

      if (findOrder.length !== 0) {
        const fourDigitOrder1 = await orderModel.aggregate([
          {
            $addFields: {
              lastFourDigits: {
                $substr: [
                  "$orderNumber",
                  {
                    $max: [
                      { $subtract: [{ $strLenCP: "$orderNumber" }, 4] },
                      0,
                    ],
                  },
                  4,
                ],
              },
            },
          },
          {
            $match: {
              lastFourDigits: lastFour,
            },
          },
        ]);

        const orderNumbers = fourDigitOrder1.map((order) => order.orderNumber);
        matchQuery.$or = [
          { orderNumber: { $in: orderNumbers } },
          { claimType: { $elemMatch: { caseNumber: orderNumber } } },
        ];
      } else {
        return successMessage(res, 200, { message: "Data Not found" });
      }
    } else if (orderNumber.length === 4) {
      const fourDigitOrder = await orderModel.aggregate([
        {
          $addFields: {
            lastFourDigits: {
              $substr: [
                "$orderNumber",
                {
                  $max: [{ $subtract: [{ $strLenCP: "$orderNumber" }, 4] }, 0],
                },
                4,
              ],
            },
          },
        },
        {
          $match: {
            lastFourDigits: orderNumber,
          },
        },
      ]);

      const orderNumbers = fourDigitOrder.map((order) => order.orderNumber);
      matchQuery.orderNumber = { $in: orderNumbers };
    }

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (receivedDate.startDate && receivedDate.endDate) {
      matchQuery.receivedDate = {
        $gte: new Date(receivedDate.startDate),
        $lte: new Date(receivedDate.endDate),
      };
    }

    if (dfMailDate.startDate && dfMailDate.endDate) {
      matchQuery.dfMailDate = {
        $gte: new Date(dfMailDate.startDate),
        $lte: new Date(dfMailDate.endDate),
      };
    }

    try {
      const sortPriority = orderNumber ? 1 : 0; // If an order number is provided, prioritize it.

      const data = await orderModel.aggregate([
        { $match: matchQuery },
        { $match: { orderStatus: { $ne: "Delete" } } },
        {
          $addFields: {
            priority: {
              $cond: [{ $eq: ["$orderNumber", orderNumber] }, sortPriority, 0],
            },
          },
        },
        {
          $facet: {
            total: [{ $count: "count" }],
            orders: [
              { $sort: { priority: -1, date: -1 } },
              { $skip: skipRow },
              { $limit: perPage },
            ],
          },
        },
      ]);

      const totalItem = data[0].total[0] ? data[0].total[0].count : 0;

      return successMessage(res, 200, {
        totalItem,
        orders: data[0].orders,
      });
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      next(error);
    }
  };

  get_unsettled_order = async (req, res, next) => {
    try {
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
      // Define primary filters to find unsettled or claimed orders
      const filters = [
        {
          settled: "No",
          orderStatus: "transit",
          date: { $lte: fortyFiveDaysAgo },
        },
        {
          settled: "No",
          claim: "Yes",
        },
      ];

      // Use get_order with combined filters
      const data = await get_order(req, filters);

      /* const pageNo = Number(req.query.pageNo) || 1;
      const perPage = Number(req.query.perPage) || 20;
      const skipRow = (pageNo - 1) * perPage;

      let data = await orderModel.aggregate([
        {
          $match: {
            $or: [
              {
                sellerId: objectId(req.id),
                settled: "No",
                orderStatus: "transit",
                date: { $lte: fortyFiveDaysAgo },
              },
              {
                claim: "Yes",
              },
            ],
          },
        },

        {
          $facet: {
            total: [{ $count: "count" }],
            orders: [
              { $sort: { date: -1 } },
              { $skip: skipRow },
              { $limit: perPage },
            ],
          },
        },
      ]); */
      const totalUnsettledItem = data[0].total[0] ? data[0].total[0].count : 0;
      successMessage(res, 200, {
        totalUnsettledItem,
        unsettledOrders: data[0].orders,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  get_returned_order = async (req, res, next) => {
    try {
      const data = await get_order(req, [{ orderStatus: "Return" }]);
      const totalReturnItem = data[0].total[0] ? data[0].total[0].count : 0;
      successMessage(res, 200, {
        totalReturnItem,
        returnOrders: data[0].orders,
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  };
  get_delivery_failed_order = async (req, res, next) => {
    try {
      const data = await get_order(req, [{ orderStatus: "Delivery Failed" }]);
      const totalDfItem = data[0].total[0] ? data[0].total[0].count : 0;
      successMessage(res, 200, {
        totalDfItem,
        dfOrders: data[0].orders,
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  };

  get_single_order = async (req, res, next) => {
    const { identifier } = req.params;
    const sellerId = objectId(req.id);

    try {
      const order = await orderModel.findOne({
        sellerId,
        $or: [
          { orderNumber: identifier },
          { "claimType.caseNumber": identifier },
        ],
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found or does not belong to this seller.",
        });
      }

      successMessage(res, 200, { order });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  update_single_order = async (req, res, next) => {
    const { orderNumber } = req.params;
    const updateData = req.body;
    const sellerId = objectId(req.id);
    const previousOrder = await orderModel.findOne({ orderNumber });
    try {
      if (updateData.orderStatus === "Delivered") {
        updateData.settled = "Yes";
      } else if (
        updateData.orderStatus === "Delivery Failed" &&
        updateData.claim == "No"
      ) {
        updateData.settled = "Yes";
      }
      const query = {
        sellerId,
        $or: [{ orderNumber }, { "claimType.caseNumber": orderNumber }],
      };

      const updatedOrder = await orderModel.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedOrder) {
        return next(createError(404, "Order not found"));
      }
      const changes = {};
      for (const key in updateData) {
        if (previousOrder[key] !== updateData[key]) {
          changes[key] = {
            old: previousOrder[key], // Old value
            new: updateData[key], // New value
          };
        }
      }
      await orderHistory.create({
        orderNumber,
        previousData: previousOrder,
        changes,
      });

      successMessage(res, 200, {
        updatedOrder,
        message: "Order update success",
      });
    } catch (error) {
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern["claimType.caseNumber"]
      ) {
        return next(createError(400, "Case Number already exists."));
      }
      console.log(error);
      next(error);
    }
  };
  get_status_order = async (req, res, next) => {
    try {
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

      const data = await orderModel.aggregate([
        { $match: { sellerId: objectId(req.id) } },
        {
          $group: {
            _id: null,
            totalOrders: {
              $sum: { $cond: [{ $ne: ["$orderStatus", "Delete"] }, 1, 0] },
            },
            totalTransit: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "transit"] }, 1, 0] },
            },
            totalDF: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "Delivery Failed"] }, 1, 0],
              },
            },
            totalDelivered: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Delivered"] }, 1, 0] },
            },
            totalReturn: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Return"] }, 1, 0] },
            },
            totalUnSettled: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$settled", "No"] },
                          { $eq: ["$orderStatus", "transit"] },
                          { $lte: ["$date", fortyFiveDaysAgo] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ["$settled", "No"] },
                          { $eq: ["$claim", "Yes"] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalNotDrop: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Not Drop"] }, 1, 0] },
            },
            totalItemLoss: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Item Loss"] }, 1, 0] },
            },
            totalScraped: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Scraped"] }, 1, 0] },
            },
            totalNRY: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "No Return Yet"] }, 1, 0],
              },
            },
          },
        },
      ]);

      const result = data[0] || {
        totalOrders: 0,
        totalTransit: 0,
        totalDF: 0,
        totalDelivered: 0,
        totalReturn: 0,
        totalUnSettled: 0,
        totalNotDrop: 0,
        totalItemLoss: 0,
        totalScraped: 0,
        totalNRY: 0,
      };

      successMessage(res, 200, {
        totalOrders: result.totalOrders,
        totalTransit: result.totalTransit,
        totalDF: result.totalDF,
        totalDelivered: result.totalDelivered,
        totalReturn: result.totalReturn,
        totalUnSettled: result.totalUnSettled,
        totalNotDrop: result.totalNotDrop,
        totalItemLoss: result.totalItemLoss,
        totalScraped: result.totalScraped,
        totalNRY: result.totalNRY,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  update_bulk_order = async (req, res, next) => {
    try {
      const reqBody = req.body;

      const sellerId = objectId(req.id);
      const orderNumbers = reqBody.map((order) => order.orderNumber);

      const foundOrder = await orderModel.aggregate([
        {
          $match: {
            sellerId: sellerId,
            orderNumber: { $in: orderNumbers },
          },
        },
        {
          $project: { orderNumber: 1 },
        },
      ]);

      const foundOrderNumbers = foundOrder.map((order) => order.orderNumber);

      const missingOrders = orderNumbers.filter(
        (orderNumber) => !foundOrderNumbers.includes(orderNumber)
      );

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

      const bulkOps = transitOrders.map((order) => {
        const updatedOrder = reqBody.find(
          (item) => item.orderNumber === order.orderNumber
        );

        const update = {
          $set: {
            orderStatus: updatedOrder.status, // Update the order status
            ...(updatedOrder.status === "Delivery Failed" && {
              receivedDate: updatedOrder.date,
            }),
            // Set settled based on the order status
            settled: updatedOrder.status === "Delivered" ? "Yes" : "No",
          },
        };

        return {
          updateOne: {
            filter: { orderNumber: order.orderNumber, sellerId: sellerId },
            update,
          },
        };
      });

      // Step 5: Execute the bulkWrite operation to update the orders
      await orderModel.bulkWrite(bulkOps);

      // Step 6: Send success response with missing orders
      successMessage(res, 200, { message: "Update success", missingOrders });
    } catch (error) {
      console.log(error);

      next(error); // Pass any error to the error handler
    }
  };
}

module.exports = new orderController();
