const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const AssignmentTask = require("../models/assignment-task");
const ExamCenter = require("../models/exam-center");
const School = require("../models/school");
const ExamCenterData = require("../models/exam-center-data");

class AssignmentTaskController {
  constructor() {}

  createNewAssignmentTask = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const {
      title,
      examType,
      collectionDate,
      assignmentDate,
      examCenters,
      district,
    } = req.body;

    //create collection status using array
    const collectionStatus = [];
    for (var center of examCenters) {
      collectionStatus.push({ examCenter: center, status: 0 });
    }

    const newAssignmentTask = new AssignmentTask({
      title: title,
      examType: examType,
      createdDate: new Date(),
      collectionDate: new Date(collectionDate),
      assignmentDate: new Date(assignmentDate),
      examCenters: examCenters,
      collectionStatus: collectionStatus,
      district: district,
    });

    try {
      //start transaction session
      const session = await mongoose.startSession();
      session.startTransaction();
      //save new assignment task
      await newAssignmentTask
        .save({ session: session })
        .then((task) => task.populate("examCenters").execPopulate()); //resolve the exam centers

      //create an array of bulk operation to update the exam centers' assignment task
      const bulkOperations = newAssignmentTask.examCenters.map((center) => {
        const tasks = [...center.assignmentTasks, newAssignmentTask];
        return {
          updateOne: {
            filter: {
              _id: center._id,
            },
            update: {
              assignmentTasks: tasks,
            },
          },
        };
      });

      //update all exam centers' assignment task at once
      await ExamCenter.bulkWrite(bulkOperations);
      await session.commitTransaction();
      //end transaction
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(`Failed to register new school - ${error.message}`, 500)
      );
    }

    res
      .status(201)
      .json({ assignmentTask: newAssignmentTask.toObject({ getters: true }) });
  };

  getStatus = (assignmentTask) => {
    const current = new Date();
    let status = "";
    if (current < assignmentTask.collectionDate) {
      if (
        assignmentTask.examCenters.length ===
        assignmentTask.examCenterData.length
      ) {
        status = "Assigning in progress";
      } else {
        status = "Collection in progress";
      }
    } else if (current < assignmentTask.assignmentDate) {
      if (
        assignmentTask.chiefInvigilatorComplete &&
        assignmentTask.viceChiefInvigilatorComplete &&
        assignmentTask.invigilatorComplete &&
        assignmentTask.environmentalSupervisorComplete &&
        assignmentTask.roomKeeperComplete &&
        assignmentTask.reservedInvigilatorComplete
      ) {
        status = "Assignment Complete";
      } else {
        status = "Assigning in progress";
      }
    } else {
      status = "Assignment Complete";
    }

    return status;
  };

  getAllAssignmentTasks = async (req, res, next) => {
    const district = req.params.district;

    let assignmentTasks;
    try {
      //get all assignment tasks
      assignmentTasks = await AssignmentTask.find({ district: district });
      //update status
      let bulkOperations = [];
      assignmentTasks.forEach((task) => {
        const newStatus = this.getStatus(task);
        if (newStatus !== task.status) {
          task.status = newStatus;
          bulkOperations.push({
            updateOne: {
              filter: {
                _id: task._id,
              },
              update: {
                status: newStatus,
              },
            },
          });
        }
      });

      if (bulkOperations.length !== 0) {
        await AssignmentTask.bulkWrite(bulkOperations);
      }
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieved all assignment tasks - ${error.message}`,
          500
        )
      );
    }

    if (!assignmentTasks) {
      res.status(200).json({ assignmentTasks: [] });
    }

    res.status(200).json({
      assignmentTasks: assignmentTasks.map((task) =>
        task.toObject({ getters: true })
      ),
    });
  };

  getAssignmentTaskByIdAndDistrict = async (req, res, next) => {
    const district = req.params.district;
    const taskId = req.params.id;

    let assignmentTask;
    try {
      assignmentTask = await AssignmentTask.findOne({
        _id: taskId,
        district: district,
      });
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieved the assignment task by id and district - ${error.message}`,
          500
        )
      );
    }

    if (!assignmentTask) {
      return next(
        new HttpError(
          "Could not find any assignment task with provided id & district",
          404
        )
      );
    }

    res
      .status(200)
      .json({ assignmentTask: assignmentTask.toObject({ getters: true }) });
  };

  getAssignmentTaskByIdAndDistrictResolvedAll = async (req, res, next) => {
    const district = req.params.district;
    const taskId = req.params.id;

    let assignmentTask;
    try {
      assignmentTask = await AssignmentTask.findOne({
        _id: taskId,
        district: district,
      }).populate({ path: "examCenters", populate: { path: "school" } });

      if (assignmentTask.status !== "Collection in progress") {
        await assignmentTask.populate("examCenterData").execPopulate();
      }
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieved the assignment task by id and district - ${error.message}`,
          500
        )
      );
    }

    if (!assignmentTask) {
      return next(
        new HttpError(
          "Could not find any assignment task with provided id & district",
          404
        )
      );
    }

    res
      .status(200)
      .json({ assignmentTask: assignmentTask.toObject({ getters: true }) });
  };
}

module.exports = new AssignmentTaskController();
