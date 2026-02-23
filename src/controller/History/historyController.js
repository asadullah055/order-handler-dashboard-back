const orderHistory = require("../../model/orderHistoryModel");
const orderModel = require("../../model/orderModel");
const mongoose = require("mongoose");
const objectId = mongoose.Types.ObjectId.createFromHexString;

const normalizeOrderStatus = (updatedFields = {}) => {
  if (typeof updatedFields.orderStatus === "string") {
    const normalizedStatus = updatedFields.orderStatus.trim();
    if (normalizedStatus.toUpperCase() === "DELETE") {
      return {
        ...updatedFields,
        orderStatus: "DELETE",
      };
    }
  }

  return updatedFields;
};

const updateOrders = async (req, res) => {
  const updatesArray = req.body;

  try {
    if (!Array.isArray(updatesArray) || updatesArray.length === 0) {
      return res
        .status(400)
        .json({ error: "Request body must be a non-empty array" });
    }

    const sellerId = objectId(req.id);
    const results = [];

    for (const update of updatesArray) {
      const { orderNumber, ...fields } = update;
      const updatedFields = normalizeOrderStatus(fields);

      // Find the order by orderNumber
      const order = await orderModel.findOne({ orderNumber, sellerId });
      if (!order) {
        results.push({ orderNumber, error: "Order not found" });
        continue;
      }

      // Clone the full previous state
      const previousData = { ...order._doc };

      // Prepare the changes object dynamically
      const changes = {};

      // Detect changes for any field
      for (const key in updatedFields) {
        if (order[key] !== updatedFields[key]) {
          changes[key] = updatedFields[key]; // New value
        }
      }

      const isDeleteAction = updatedFields.orderStatus === "DELETE";
      if (isDeleteAction) {
        await orderHistory.create({
          orderNumber,
          previousData,
          changes: { deleted: true },
          operation: "DELETE",
          updatedAt: new Date(),
        });

        await orderModel.deleteOne({ _id: order._id });

        results.push({
          orderNumber,
          message: "Order deleted successfully",
        });
        continue;
      }

      if (Object.keys(changes).length > 0) {
        // Log the full previous data and changes
        await orderHistory.create({
          orderNumber,
          previousData,
          changes,
          updatedAt: new Date(),
        });

        // Apply the updates dynamically
        Object.assign(order, changes);
        await order.save();

        results.push({
          orderNumber,
          message: "Order updated successfully",
          updatedData: order,
        });
      } else {
        results.push({
          orderNumber,
          message: "No changes applied, order already up-to-date",
        });
      }
    }

    return res.status(200).json({
      message: "Batch update completed",
      results,
    });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ error: "Failed to update orders", details: error.message });
  }
};
const updateSingleOrders = async (req, res) => {
  const reqBody = req.body;

  try {
    if (!Array.isArray(reqBody) || reqBody.length === 0) {
      return res
        .status(400)
        .json({ error: "Request body must be a non-empty array" });
    }

    const sellerId = objectId(req.id);
    const results = [];

    for (const update of reqBody) {
      const { orderNumber, ...fields } = update;
      const updatedFields = normalizeOrderStatus(fields);

      // Find the order by orderNumber
      const order = await orderModel.findOne({ orderNumber, sellerId });
      if (!order) {
        results.push({ orderNumber, error: "Order not found" });
        continue;
      }

      // Clone the full previous state
      const previousData = { ...order._doc };

      // Prepare the changes object dynamically
      const changes = {};

      // Detect changes for any field
      for (const key in updatedFields) {
        if (order[key] !== updatedFields[key]) {
          changes[key] = updatedFields[key]; // New value
        }
      }

      const isDeleteAction = updatedFields.orderStatus === "DELETE";
      if (isDeleteAction) {
        await orderHistory.create({
          orderNumber,
          previousData,
          changes: { deleted: true },
          operation: "DELETE",
          updatedAt: new Date(),
        });

        await orderModel.deleteOne({ _id: order._id });

        results.push({
          orderNumber,
          message: "Order deleted successfully",
        });
        continue;
      }

      if (Object.keys(changes).length > 0) {
        // Log the full previous data and changes
        await orderHistory.create({
          orderNumber,
          previousData,
          changes,
        });

        // Apply the updates dynamically
        Object.assign(order, changes);
        await order.save();

        results.push({
          orderNumber,
          updatedData: order,
        });
      } else {
        results.push({
          orderNumber,
          message: "No changes applied, order already up-to-date",
        });
      }
    }

    return res.status(200).json({
      message: "Batch update completed",
      results,
    });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ error: "Failed to update orders", details: error.message });
  }
};

module.exports = { updateOrders, updateSingleOrders };
