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
      type: String,
      default: 'No',
    },
    claim: {
      type: String,
      default: "",
    },
    claimType: {
      type: [
        {
          claimName: { type: String },
          caseNumber: { type: String}, // Ensure it's unique
          claimDate: { type: String },
          claimStatus: { type: String },
          paidAmount: { type: String},
          invoiceCycle: { type: String },
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
