const orderHistory = require("../../model/orderHistoryModel");
const orderModel = require("../../model/orderModel");

const updateOrders = async (req, res) => {
  const updatesArray = req.body;

  try {
    const results = [];

    for (const update of updatesArray) {
      const { orderNumber, ...updatedFields } = update;

      // Find the order by orderNumber
      const order = await orderModel.findOne({ orderNumber });
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
    const results = [];

    for (const update of reqBody) {
      const { orderNumber, ...updatedFields } = update;

      // Find the order by orderNumber
      const order = await orderModel.findOne({ orderNumber });
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
