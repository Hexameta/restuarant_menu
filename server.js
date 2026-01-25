
var createError = require("http-errors");
var express = require("express");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db.connect");

const { authMiddleware } = require("./middleware/authMiddleware");

var usersRouter = require("./routes/users.js");
var restaurantRouter = require("./routes/restaurantRoute");
var categoryRouter = require("./routes/category.js");
var imageUploadRouter = require("./routes/imageUpload.js");
var menuItemRouter = require("./routes/menuItemRoute.js");
var specialTagRouter = require("./routes/specialTagRoutes.js");
var adsRouter = require("./routes/ads.js");
var menuRouter = require("./routes/menu.js");

// Connect to MongoDB
connectDB();

var app = express();

/* -------------------- BASIC MIDDLEWARE -------------------- */
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* -------------------- CORS (FINAL) -------------------- */
const allowedOrigins = [
  "https://admin.digifymenu.com",
  "https://menu.digifymenu.com",
  "http://localhost:5173",
  "http://localhost:5001",
  "http://localhost:3000"
];

const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman, curl

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
});

/* 🔥 CORS MUST COME BEFORE AUTH */
app.use(corsMiddleware);

/* 🔥 EXPLICIT OPTIONS HANDLER (MANDATORY) */
app.options("*", corsMiddleware);

/* -------------------- AUTH -------------------- */
app.use(authMiddleware);

/* -------------------- ROUTES -------------------- */
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/image-upload", imageUploadRouter);
app.use("/api/v1/menu-item", menuItemRouter);
app.use("/api/v1/special-tag", specialTagRouter);
app.use("/api/v1/ads", adsRouter);
app.use("/api/v1/menu", menuRouter);

/* -------------------- 404 -------------------- */
app.use(function (req, res, next) {
  next(createError(404));
});

/* -------------------- ERROR HANDLER -------------------- */
app.use(function (err, req, res, next) {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
});

module.exports = app;
