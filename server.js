var createError = require("http-errors");
var express = require("express");
var logger = require("morgan");
var cors = require("cors");
const mongoose = require("mongoose");
const serverless = require("serverless-http");

const connectDB = require("./config/db.connect");
const { authMiddleware } = require("./middleware/authMiddleware");

/* -------------------- ROUTES -------------------- */
var usersRouter = require("./routes/users.js");
var restaurantRouter = require("./routes/restaurantRoute");
var categoryRouter = require("./routes/category.js");
var imageUploadRouter = require("./routes/imageUpload.js");
var menuItemRouter = require("./routes/menuItemRoute.js");
var specialTagRouter = require("./routes/specialTagRoutes.js");
var adsRouter = require("./routes/ads.js");
var menuRouter = require("./routes/menu.js");

/* -------------------- CREATE APP -------------------- */
var app = express();

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  "https://admin.digifymenu.com",
  "https://menu.digifymenu.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.options("*", cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

/* -------------------- BASIC MIDDLEWARE -------------------- */
// Disable Morgan in production Lambda — each log is synchronous I/O overhead
if (process.env.NODE_ENV !== "production") {
  app.use(logger("dev"));
}
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ message: "Health check successfull" });
});

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
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

/* -------------------- MONGO LOG -------------------- */
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
});

/* -------------------- EXPORT FOR LAMBDA -------------------- */
const handler = serverless(app);

// Start connection during the Lambda INIT phase to mitigate cold start latency
connectDB().catch((err) => console.error("Initial DB connection failed:", err));

module.exports.handler = async (event, context) => {
  // Prevents Lambda from waiting for open MongoDB connections
  // Without this, Lambda hangs until timeout after the response is sent
  context.callbackWaitsForEmptyEventLoop = false;

  // Connect to DB (connectDB must have readyState check inside it)
  await connectDB();

  return handler(event, context);
};

/* -------------------- LOCAL SERVER (ONLY FOR DEV) -------------------- */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
    });
  });
}
