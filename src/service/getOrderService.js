const orderModel = require("../model/orderModel");

const get_order = async (req, filter) => {
  const pageNo = Number(req.query.pageNo) || 1;
  const perPage = Number(req.query.perPage) || 20;
  const skipRow = (pageNo - 1) * perPage;

  let data = await orderModel.aggregate([
    { $match: filter },
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
  ]);
  return data;
};
module.exports = get_order
