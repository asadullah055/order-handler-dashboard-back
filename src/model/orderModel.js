const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
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
    claim: {
      type: String,
      default: "",
    },
    claimType: {
      type: String,
      default: "",
    },
    csmd: {
      type: String,
      default: "",
    },
    caseNumber: {
      type: String,
      default: "",
    },
    approvedOrReject: {
      type: String,
      default: "",
    },
    arMailDate: {
      type: Date,
      default: "",
    },
    paidAmount: {
      type: String,
      default: "",
    },
    statementNoOrInvoiceCycle: {
      type: String,
      default: "",
    },
    comment: {
      type: String,
      default: "",
    },
    complainDetails: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model("orders", orderSchema);
