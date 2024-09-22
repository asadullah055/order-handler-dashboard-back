const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    sellerId: { type: mongoose.Schema.Types.ObjectId },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    orderStatus: {
      type: String,
      default: "transit",
    },
    dfMailDate: {
      type: Date,
      default: "",
    },
    receivedDate: {
      type: Date,
      default: "",
    },
    settled: {
      type: Boolean,
      default: false,
    },
    claim: {
      type: String,
      default: "",
    },
    claimType: {
      type: [Object],
      default: [],
    },
    comment: {
      type: String,
      default: "",
    },
   
  },
  { timestamps: true, versionKey: false }
);

module.exports = model("orders", orderSchema);
