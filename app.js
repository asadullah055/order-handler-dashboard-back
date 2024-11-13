const express = require("express");
const createError = require("http-errors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const hpp = require("hpp");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const orderRoute = require("./src/routes/orderRoute");
const { errorMessage } = require("./src/utill/respons");
const connectDB = require("./src/config/db");
const sellerRoute = require("./src/routes/sellerRoutes");
const app = express();

/* const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: "Too many request from this API",
  }); */
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
// app.use(rateLimiter);
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.get("/", (req, res) => {
  res.status(200).send("Api is working fine");
});

app.use("/", orderRoute);
app.use("/", sellerRoute);

connectDB() 

app.use((req, res, next) => {
  next(createError(404, "router not found"));
});

app.use((err, req, res, next) => {
  return errorMessage(res, {
    statusCode: err.status,
    message: err.message,
  });
});
module.exports = app;
