const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      trim: true,
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
      type: String,
      default: "No",
    },
    claim: {
      type: String,
      default: "",
    },
    claimType: {
      type: [
        {
          claimName: { type: String },
          caseNumber: { type: String, trim: true },
          claimDate: { type: String },
          claimStatus: { type: String },
          paidAmount: { type: String, trim: true },
          invoiceCycle: { type: String, trim: true },
          claimDetails: { type: String },
          arMailDate: { type: String },
        },
      ],
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
