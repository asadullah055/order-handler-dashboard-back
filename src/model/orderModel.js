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
/* [
  { orderNumber: "639159512065096", date: "2024-09-05" },

  { orderNumber: "639157118354721", date: "2024-09-05" },

  { orderNumber: "639132905607713", date: "2024-09-05" },
  { orderNumber: "639132905607713", date: "2024-09-05" },

  { orderNumber: "638747860339543", date: "2024-09-05" },

  { orderNumber: "638739859355099", date: "2024-09-05" },
  { orderNumber: "638739859355099", date: "2024-09-05" },

  { orderNumber: "639190786640009", date: "2024-09-05" },

  { orderNumber: "639199363506323", date: "2024-09-05" },

  { orderNumber: "639187375965888", date: "2024-09-05" },

  { orderNumber: "638752860719315", date: "2024-09-05" },

  { orderNumber: "639206180033853", date: "2024-09-05" },
] */;
