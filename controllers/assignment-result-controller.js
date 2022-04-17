const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const _ = require("lodash");

const HttpError = require("../models/http-error");
const AssignmentResult = require("../models/assignment-result");
const AssignmentTask = require("../models/assignment-task");
const ExamCenter = require("../models/exam-center");
const School = require("../models/school");
const Teacher = require("../models/teacher");
const User = require("../models/user");
const InvigilatorExperience = require("../models/invigilator-exp");

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
        .populate({ path: "results.examCenter", populate: { path: "school" } })
        .populate({
          path: "results.invigilators",
          populate: {
            path: "user",
            select: "school",
            populate: { path: "school" },
          },
        });
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

  editAssignmentResult = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }
    const resultId = req.params.id;

    const { results } = req.body;
    let assignmentResult;
    let allAssignedInvigilators = [];
    let invigilatorExpBulkOperation = [];

    try {
      assignmentResult = await AssignmentResult.findById(resultId)
        .populate({ path: "assignmentTask", populate: { path: "examCenters" } })
        .populate("results.examCenter")
        .populate({
          path: "results.invigilators",
          populate: [{ path: "listOfInvigilatorExperience" }, { path: "user" }],
        });

      if (!assignmentResult) {
        return next(
          new HttpError(
            "Could not find any assignment result with the provided id",
            404
          )
        );
      }

      //generate a list of involved invigilators from previous results
      assignmentResult.results.forEach((result) => {
        allAssignedInvigilators = [
          ...allAssignedInvigilators,
          ...result.invigilators,
        ];
      });

      results.forEach((result) => {
        result.invigilators.forEach((invigilator) => {
          //look for invigilator from the list of involved invigilators
          const newInvigilator = allAssignedInvigilators.find(
            (assignedInvigilator) => assignedInvigilator.id == invigilator
          );

          //look for the exam center from the list of exam centers
          const examCenter = assignmentResult.assignmentTask.examCenters.find(
            (center) => center.id == result.examCenter
          );

          //validate the result (new invigilator cannot assign to his/her own school)
          if (
            newInvigilator.user.school.toString() ==
            examCenter.school.toString()
          ) {
            return next(
              new HttpError(
                "Invigilator cannot be assigned to his/her own school",
                500
              )
            );
          }

          //look for the invigilator exp of the invigilator based on assignment task id
          const originalExp = newInvigilator.listOfInvigilatorExperience.find(
            (exp) => exp.assignmentTask == assignmentResult.assignmentTask.id
          );

          //setting up bulk operation to update assignedTo attribute
          invigilatorExpBulkOperation.push({
            updateOne: {
              filter: {
                _id: originalExp._id,
              },
              update: {
                assignedTo: result.examCenter,
              },
            },
          });
        });
      });

      assignmentResult.results = results;

      //start transaction session
      const session = await mongoose.startSession();
      session.startTransaction();

      //update assignment result
      await assignmentResult.save();

      //update invigilator experiences
      await InvigilatorExperience.bulkWrite(invigilatorExpBulkOperation);

      await session.commitTransaction();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to edit assignment result - ${error.message}`,
          500
        )
      );
    }

    res
      .status(200)
      .json({ assignmentResult: assignmentResult.toObject({ getters: true }) });
  };
}

module.exports = new AssignmentResultController();
