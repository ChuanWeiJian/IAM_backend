const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const _ = require("lodash");

const HttpError = require("../models/http-error");
const AssignmentTask = require("../models/assignment-task");
const ExamCenter = require("../models/exam-center");
const School = require("../models/school");
const ExamCenterData = require("../models/exam-center-data");
const AssignmentResult = require("../models/assignment-result");
const { assign } = require("lodash");

class AssignmentTaskController {
  constructor() {}

  createNewAssignmentTask = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { title, examType, collectionDate, examCenters, district } = req.body;

    //create collection status using array
    const collectionStatus = [];
    for (var center of examCenters) {
      collectionStatus.push({ examCenter: center, status: "Incomplete" });
    }

    const newAssignmentTask = new AssignmentTask({
      title: title,
      examType: examType,
      createdDate: new Date(),
      collectionDate: new Date(collectionDate),
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
      await ExamCenter.bulkWrite(bulkOperations, { session: session });
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
    } else {
      if (
        assignmentTask.examCenters.length !==
        assignmentTask.examCenterData.length
      ) {
        status = "Collection data incomplete";
      } else if (
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

      if (
        assignmentTask.status !== "Collection in progress" &&
        assignmentTask.status !== "Collection data incomplete"
      ) {
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

  editAssignmentTask = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { title, examType, collectionDate, examCenters } = req.body;
    const taskId = req.params.id;

    let assignmentTask;
    try {
      //retrieve the assignment task by id
      assignmentTask = await AssignmentTask.findById(taskId)
        .populate("examCenters")
        .populate("examCenterData");

      if (!assignmentTask) {
        return next(
          new HttpError(
            "Could not find any assignment task with provided id",
            404
          )
        );
      }

      let examCenterBulkOperation = []; //bulk operation array
      let examCenterDataBulkOperation = []; //bulk operation array
      let assignmentResultBulkOperation; //bulk operation array
      let newCollectionStatus = assignmentTask.collectionStatus;
      let newExamCenterData = assignmentTask.examCenterData;

      assignmentTask.examCenters.forEach((center) => {
        //find removed exam center
        if (!examCenters.includes(center.id)) {
          //removed the task id from exam center's assignmentTasks
          const newAssignmentTaskList = center.assignmentTasks.filter(
            (task) => task != taskId
          );

          examCenterBulkOperation.push({
            updateOne: {
              filter: {
                _id: center._id,
              },
              update: {
                assignmentTasks: newAssignmentTaskList,
              },
            },
          });

          //remove the collection status that belongs to the removed exam center
          newCollectionStatus = newCollectionStatus.filter(
            (status) => status.examCenter != center.id
          );

          //look for the exam center data that belongs to the removed exam center and remove it from the newExamCenterData array
          const removedExamCenterData = _.remove(newExamCenterData, (data) => {
            return data.examCenter == center.id;
          });

          //if exam center data exist, add bulk operation
          if (removedExamCenterData.length !== 0) {
            examCenterDataBulkOperation.push({
              deleteOne: {
                filter: {
                  _id: removedExamCenterData[0]._id,
                },
              },
            });
          }
        }
      });

      examCenters.forEach((center) => {
        //find new added exam center
        const existedExamCenter = assignmentTask.examCenters.find(
          (examCenter) => examCenter.id == center
        );

        if (!existedExamCenter) {
          //add the assignment task id into the new exam center's assignmentTasks
          examCenterBulkOperation.push({
            updateOne: {
              filter: {
                _id: center,
              },
              update: {
                $push: { assignmentTasks: taskId },
              },
            },
          });

          //add new collection status for the new exam center
          newCollectionStatus.push({
            examCenter: center,
            status: "Incomplete",
          });
        }
      });

      //update the assignment task information
      assignmentTask.title = title;
      assignmentTask.examType = examType;
      assignmentTask.collectionDate = new Date(collectionDate);
      assignmentTask.examCenters = examCenters;
      assignmentTask.collectionStatus = newCollectionStatus;
      assignmentTask.examCenterData = newExamCenterData.map((data) => data.id);
      if (
        assignmentTask.status === "Assigning in progress" ||
        assignmentTask.status === "Assignment Complete"
      ) {
        //the original status is assigning in progress or assignment complete
        //check if there is any modification of exam centers
        if (examCenterBulkOperation) {
          //reset all the assignment results
          assignmentTask.chiefInvigilatorComplete = false;
          assignmentTask.viceChiefInvigilatorComplete = false;
          assignmentTask.environmentalSupervisorComplete = false;
          assignmentTask.roomKeeperComplete = false;
          assignmentTask.invigilatorComplete = false;
          assignmentTask.reservedInvigilatorComplete = false;

          assignmentResultBulkOperation = assignmentTask.assignmentResults.map(
            (result) => {
              return {
                deleteOne: {
                  filter: {
                    _id: result._id,
                  },
                },
              };
            }
          );

          assignmentTask.assignmentResults = [];
        }
      }
      //update new status of the assignment task
      const newStatus = this.getStatus(assignmentTask);
      if (newStatus !== assignmentTask.status) {
        assignmentTask.status = newStatus;
      }

      //start transaction session
      const session = await mongoose.startSession();
      session.startTransaction();

      //save the updated assignment task
      await assignmentTask.save({ session: session });

      if (examCenterBulkOperation.length !== 0) {
        await ExamCenter.bulkWrite(examCenterBulkOperation, {
          session: session,
        });
      }

      if (examCenterDataBulkOperation.length !== 0) {
        await ExamCenterData.bulkWrite(examCenterDataBulkOperation, {
          session: session,
        });
      }

      if (assignmentResultBulkOperation) {
        await AssignmentResult.bulkWrite(assignmentResultBulkOperation, {
          session: session,
        });
      }

      await session.commitTransaction();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to edit the assignment task - ${error.message}`,
          500
        )
      );
    }

    res
      .status(200)
      .json({ assignmentTask: assignmentTask.toObject({ getters: true }) });
  };
}

module.exports = new AssignmentTaskController();
