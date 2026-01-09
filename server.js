var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

const { authMiddleware } = require("./middleware/authMiddleware");

var indexRouter = require("./routes/index.js");
var usersRouter = require("./routes/users.js");
var restaurantRouter = require("./routes/restaurantRoute");
var categoryRouter = require("./routes/category.js");
var imageUploadRouter = require("./routes/imageUpload.js");
var menuItemRouter = require("./routes/menuItemRoute.js");
var specialTagRouter = require("./routes/specialTagRoutes.js");
var adsRouter = require("./routes/ads.js");
var menuRouter = require("./routes/menu.js");

var app = express();

/* -------------------- VIEW ENGINE -------------------- */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/* -------------------- BASIC MIDDLEWARE -------------------- */
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* -------------------- CORS (FINAL) -------------------- */
const allowedOrigins = [
  "https://admin.digifymenu.com",
  "https://menu.digifymenu.com",
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
app.use("/", indexRouter);
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
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
