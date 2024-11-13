const mongoose = require("mongoose");
const { mongodb_url } = require("../../secret");

const connectDB = async (option = {}) => {
  try {
    await mongoose.connect(mongodb_url, option);
    console.log("connection successfully");
    mongoose.connection.on("error", (error) => {
      console.error("DB connection error", error);
    });
  } catch (error) {
    console.error("Could not connect to DB", error.toString());
  }
};
module.exports = connectDB;
