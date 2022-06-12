const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const HttpError = require("./models/http-error");

const userRoutes = require("./routes/users-routes");
const schoolRoutes = require("./routes/schools-routes");
const examCenterRoutes = require("./routes/exam-centers-routes");
const assignmentTaskRoutes = require("./routes/assignment-tasks-routes");
const letterTemplateRoutes = require("./routes/letter-templates-routes");
const assignmentResultRouters = require("./routes/assignment-results-routers");
const assignmentResultInvigilatorRouters = require("./routes/assignment-results-invigilator-routers");

const app = express();

app.use(bodyParser.json());

//handling CORS error
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/examcenters", examCenterRoutes);
app.use("/api/assignments", assignmentTaskRoutes);
app.use("/api/letters", letterTemplateRoutes);
app.use("/api/results", assignmentResultRouters);
app.use("/api/results-invigilator", assignmentResultInvigilatorRouters);

app.use((req, res, next) => {
  return next(new HttpError("Could not find this route", 404));
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

/*
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wq1qi.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true }
  )
  .then(() => {
    //if database connection success
    app.listen(5000);
  })
  .catch((err) => {
    //database connection failed
    console.log(err);
  });
*/
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wq1qi.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true }
  )
  .then(() => {
    //if database connection success
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    //database connection failed
    console.log(err);
  });
