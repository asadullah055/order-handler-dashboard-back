const { Schema, model } = require("mongoose");

const orderHistorySchema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "orders",
    },
    changes: {
      type: Map,
      of: Schema.Types.Mixed, // Map allows tracking key-value pairs for each field changed
    },
    previousData: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    modifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("OrderHistory", orderHistorySchema);
