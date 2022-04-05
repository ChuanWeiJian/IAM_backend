const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const AssignmentTask = require("../models/assignment-task");
const ExamCenter = require("../models/exam-center");

class AssignmentTaskController {
  constructor() {}

  createNewAssignmentTask = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { title, examType, collectionDate, assignmentDate, examCenters } =
      req.body;

    //create collection status using array
    // const collectionStatus = [];
    // for (var center of examCenters) {
    //   collectionStatus.push({ examCenter: center, status: 0 });
    // }

    //create collection status using map
    const collectionStatus = {};

    const newAssignmentTask = new AssignmentTask({
      title: title,
      examType: examType,
      createdDate: new Date(),
      collectionDate: new Date(collectionDate),
      assignmentDate: new Date(assignmentDate),
      examCenters: examCenters,
      collectionStatus: collectionStatus,
    });

    for (var center of examCenters) {
      newAssignmentTask.collectionStatus.set(center, 0);
    }

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

    const assignmentTask = {
      ...newAssignmentTask.toObject({ getters: true }),
      collectionStatus: Object.fromEntries(newAssignmentTask.collectionStatus),
    };

    res.status(201).json({ assignmentTask: assignmentTask });
  };
}

module.exports = new AssignmentTaskController();
