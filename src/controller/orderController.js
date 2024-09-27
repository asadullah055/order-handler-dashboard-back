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

    const claimType = req.query.claimType || "";
    const orderNumber = req.query.orderNumber || "";
    const skipRow = (pageNo - 1) * perPage;
    const date = req.query.date ? new Date(req.query.date) : null;
    const receivedDate = req.query.receivedDate
      ? new Date(req.query.receivedDate)
      : null;
    const dfMailDate = req.query.dfMailDate
      ? new Date(req.query.dfMailDate)
      : null;
    const sellerId = req.id ? objectId(req.id) : null;
    let data;

    const matchQuery = {};

    if (status.length) matchQuery.orderStatus = { $in: status };
    if (claim.length) matchQuery.claim = { $in: claim };
    if (claimType) matchQuery.approvedOrReject = claimType;
    if (date) matchQuery.date = date;
    if (receivedDate) matchQuery.receivedDate = receivedDate;
    if (dfMailDate) matchQuery.dfMailDate = dfMailDate;
    if (settled.length) matchQuery.settled = {$in:settled};
    if (sellerId) matchQuery.sellerId = sellerId;
    

    // Use $or for orderNumber or claimType.caseNumber search
    if (orderNumber) {
      matchQuery.$or = [
        { orderNumber }, // Match directly with orderNumber
        { claimType: { $elemMatch: { caseNumber: orderNumber } } }, // Match caseNumber within claimType array
      ];
    }

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
              /* {
                $project: {
                  orderNumber: 1,
                  date: 1,
                  orderStatus: 1,
                  dfMailDate: 1,
                  receivedDate: 1,
                  claim: 1,
                  approvedOrReject: 1,
                },
              }, */
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
    const { orderNumber } = req.params; // Extracting both orderNumber and caseNumber from params
    const updateData = req.body;
    const sellerId = objectId(req.id);

    try {
      if (updateData.orderStatus === "Delivered") {
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
      const reqBody = req.body; // List of orders to update
      const sellerId = objectId(req.id); // Seller ID from request
      const orderNumbers = reqBody.map((order) => order.orderNumber); // Extract order numbers from the request body

      // Step 1: Find the orders that are in transit for the given seller and order numbers
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

      // Step 2: Extract order numbers that were found
      const foundOrderNumbers = transitOrders.map((order) => order.orderNumber);

      // Step 3: Identify the missing orders (i.e., orders not found in the transitOrders list)
      const missingOrders = orderNumbers.filter(
        (orderNumber) => !foundOrderNumbers.includes(orderNumber)
      );

      // Step 4: Prepare bulk operations for updating the orders
      const bulkOps = transitOrders.map((order) => {
        const updatedOrder = reqBody.find(
          (item) => item.orderNumber === order.orderNumber
        );

        const update = {
          $set: {
            orderStatus: updatedOrder.status, // Update the order status
            ...(updatedOrder.status === "Delivery Failed" && {
              dfMailDate: updatedOrder.date, // If Delivery Failed, update dfMailDate
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
      next(error); // Pass any error to the error handler
    }
  };
}

module.exports = new orderController();
