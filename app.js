var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var { syncDatabase } = require("./utils/syncDb.js");
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
// syncDatabase();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5000"); // Adjust this to your frontend's origin
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Enable CORS for development frontend on port 5173 (Vite)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    //  origin: ['http://localhost:4000', 'http://localhost:3000'],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    credentials: true,
  })
);

app.use(authMiddleware);

app.use("/", indexRouter);
// app.use('/users', usersRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/image-upload", imageUploadRouter);
app.use("/api/v1/menu-item", menuItemRouter);
app.use("/api/v1/special-tag", specialTagRouter);
app.use("/api/v1/ads", adsRouter);
app.use("/api/v1/menu", menuRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
