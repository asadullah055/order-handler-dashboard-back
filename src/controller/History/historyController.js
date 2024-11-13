const orderHistory = require("../../model/orderHistory");
const orderModel = require("../../model/orderModel");
const updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const updates = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Prepare the changes for history log
    const previousData = {};
    const changes = {};

    Object.keys(updates).forEach((key) => {
      if (order[key] !== updates[key]) {
        previousData[key] = order[key]; // Store old values
        changes[key] = updates[key]; // Store new values
      }
    });

    // Log the change history
    await orderHistory.create({
      orderId,
      changes,
      previousData,
    });

    // Apply the updates
    Object.assign(order, updates);
    await order.save();

    return res
      .status(200)
      .json({ message: "Order updated successfully", order });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update order" });
  }
};
