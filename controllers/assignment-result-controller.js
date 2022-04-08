const mongoose = require("mongoose");
const _ = require("lodash");

const HttpError = require("../models/http-error");
const AssignmentResult = require("../models/assignment-result");
const AssignmentTask = require("../models/assignment-task");
const ExamCenter = require("../models/exam-center");
const School = require("../models/school");
const Teacher = require("../models/teacher");

class AssignmentResultController {
  constructor() {}

  getAssignmentResultByIdAndRoleResolvedAll = async (req, res, next) => {
    const taskId = req.params.id;
    const role = req.params.role;

    let assignmentResult;
    try {
      assignmentResult = await AssignmentResult.findOne({
        assignmentTask: taskId,
        role: role,
      })
        .populate("assignmentTask")
        .populate("results.examCenter")
        .populate("results.invigilators");
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieve assignment result - ${error.message}`,
          500
        )
      );
    }

    if (!assignmentResult) {
      res.json({ assignmentResult: {} });
    }

    res
      .status(200)
      .json({ assignmentResult: assignmentResult.toObject({ getters: true }) });
  };
}

module.exports = new AssignmentResultController();
