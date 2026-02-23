const { Schema, model } = require("mongoose");

const orderHistorySchema = new Schema(
  {
    orderNumber: {
      type: String,
    },
    previousData: { type: Object },
    changes: { type: Object },
    operation: { type: String },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model("OrderHistory", orderHistorySchema);
