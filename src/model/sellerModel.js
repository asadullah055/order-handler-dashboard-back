const { Schema, model, set } = require("mongoose");
const bcrypt = require("bcrypt");
const sellerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  shopName: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "seller",
  },
  password: {
    type: String,
    required: true,
    set: (v) => bcrypt.hashSync(v, bcrypt.genSaltSync(10)),
  },
  shopLogo: {
    type: String,
    default: "",
  },
  otp: {
    type: String,
    default: "",
  },
  expiresOtp:{
    type: Date
  }
});

module.exports = model("sellers", sellerSchema);
