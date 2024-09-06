const orderModel = require("../model/orderModel");
const { successMessage } = require("../utill/respons");

class orderController {
  add_order = async (req, res, next) => {
    const orders = req.body;
    const orderNumbers = orders.map((order) => order.orderNumber);

    try {
      const existingOrders = await orderModel.aggregate([
        {
          $match: {
            orderNumber: { $in: orderNumbers },
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

      // Insert the new orders
      await orderModel.insertMany(newOrders);

      successMessage(res, 200, { insertedOrders: newOrders });
    } catch (error) {
      next(error);
    }
  };
  get_all_order = async (req, res, next) => {
    const pageNo = Number(req.params.pageNo);
    const perPage = Number(req.params.perPage);

    const skipRow = (pageNo - 1) * perPage;
    let data;

    try {
      data = await orderModel.aggregate([
        { $match: {} },
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
                },
              },
            ],
          },
        },
      ]);
      const totalItem = data[0].total[0] ? data[0].total[0].count : 0;
      const totalPages = Math.ceil(totalItem / perPage);
      const showItem = data[0].orders.length;
      const startItem = (pageNo - 1) * perPage + 1;
      const endItem = Math.min(pageNo * perPage, totalItem);
      successMessage(res, 200, {
        totalItem,
        totalPages,
        perPage,
        pageNo,
        showItem,
        startItem,
        endItem,
        message: `Showing ${startItem} to ${endItem} of ${totalItem} orders`,
        orders: data[0].orders,
      });
    } catch (error) {
      next(error);
    }
  };
  get_single_order = async (req, res, next) => {
    const orderNumber = req.params.orderNumber;
    try {
      const order = await orderModel.findOne({ orderNumber: orderNumber });

      successMessage(res, 200, { order });
    } catch (error) {
      next(error);
    }
  };
  update_single_order = async (req, res, next) => {
    const orderNumber = req.params.orderNumber;
    const updateData = req.body;
    try {
      const updatedOrder = await orderModel.findOneAndUpdate(
        { orderNumber: orderNumber },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      successMessage(res, 200, { updatedOrder });
    } catch (error) {
      next(error);
    }
  };
  get_status_order = async (req, res, next) => {
    try {
      const allOrder = await orderModel.aggregate([
        { $match: {} },
        { $count: "totalOrders" },
      ]);
      const totalOrders = allOrder[0]?.totalOrders || 0;
      successMessage(res, 200, { totalOrders });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new orderController();
