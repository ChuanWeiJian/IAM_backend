const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const HttpError = require("./models/http-error");

const schoolRoutes = require("./routes/schools-routes");
const examCenterRoutes = require("./routes/exam-centers-routes");
const assignmentTaskRoutes = require("./routes/assignment-tasks-routes");
const letterTemplateRoutes = require("./routes/letter-templates-routes");
const assignmentResultRouters = require("./routes/assignment-results-routers");

const app = express();

app.use(bodyParser.json());

app.use("/api/schools", schoolRoutes);
app.use("/api/examcenters", examCenterRoutes);
app.use("/api/assignments", assignmentTaskRoutes);
app.use("/api/letters", letterTemplateRoutes);
app.use("/api/results", assignmentResultRouters);

app.use((req, res, next) => {
  return next(new HttpError("Could not find this route", 404));
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rlab7.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
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
