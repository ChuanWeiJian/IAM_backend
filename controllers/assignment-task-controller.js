const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const _ = require("lodash");

const HttpError = require("../models/http-error");
const AssignmentTask = require("../models/assignment-task");
const ExamCenter = require("../models/exam-center");
const School = require("../models/school");
const Teacher = require("../models/teacher");
const ExamCenterData = require("../models/exam-center-data");
const AssignmentResult = require("../models/assignment-result");
const InvigilatorExperience = require("../models/invigilator-exp");

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

  assignInvigilators = async (req, res, next) => {
    const taskId = req.params.id;
    const role = req.params.role;

    let assignmentTask;
    let invigilatorBulkOperation = [];
    let invigilatorExp = [];
    let invigilatorPool = [];
    let results = [];
    try {
      assignmentTask = await AssignmentTask.findById(taskId)
        .populate({
          path: "examCenters",
          populate: { path: "school" },
        })
        .populate({
          path: "examCenterData",
          populate: [
            {
              path: `list${_.upperFirst(role)}Required`,
              populate: { path: "user", select: "school" },
            },
            { path: "examCenter" },
          ],
        });

      if (!assignmentTask) {
        return next(
          new HttpError(
            "Could not find any assignment task with the provided id",
            404
          )
        );
      }

      const numberAccessKey = `numberOf${_.upperFirst(role)}Required`;
      const listAccessKey = `list${_.upperFirst(role)}Required`;

      assignmentTask.examCenterData.forEach((data) => {
        invigilatorPool = [...invigilatorPool, ...data[listAccessKey]];
      });

      //shuffle the invigilator pool
      invigilatorPool = _.shuffle(invigilatorPool);

      //loop through the exam center data
      assignmentTask.examCenterData.forEach((data) => {
        //create new result for the current exam center
        const newResult = {
          examCenter: data.examCenter.id,
          invigilators: [],
        };

        //filter out the possible invigilators for the exam center
        let listOfPossibleInvigilator = invigilatorPool.filter(
          (invigilator) =>
            invigilator.user.school.toString() !=
            data.examCenter.school.toString()
        );

        //loop through the number of required invigilator requested by the exam center
        for (var idx = 1; idx <= data[numberAccessKey]; idx++) {
          //randomly select an invigilator
          const randomIndex = _.random(0, listOfPossibleInvigilator.length - 1);

          const selectedInvigilator = listOfPossibleInvigilator[randomIndex];

          //insert the selected invigilator into the array
          newResult.invigilators.push(selectedInvigilator.id);

          //create a new invigilator experience
          const newExp = new InvigilatorExperience({
            role: role,
            assignmentTask: taskId,
            assignedTo: data.examCenter.id,
          });
          invigilatorExp.push(newExp);

          //setting up bulk operation to update teacher's listOfInvigilatorExperience
          invigilatorBulkOperation.push({
            updateOne: {
              filter: {
                _id: selectedInvigilator._id,
              },
              update: {
                $push: {
                  listOfInvigilatorExperience: newExp,
                },
              },
            },
          });

          //remove the selected invigilator from the possible list of invigilators
          listOfPossibleInvigilator.splice(randomIndex, 1);

          //remove the selected invigilator from the invigilator pool
          _.remove(
            invigilatorPool,
            (invigilator) => invigilator.id == selectedInvigilator.id
          );
        }

        //push the result for the current exam center into results array
        results.push(newResult);
      });

      const assignmentResult = new AssignmentResult({
        assignmentTask: taskId,
        role: role,
        results: results,
      });

      //update assignment task information
      assignmentTask[`${role}Complete`] = true;
      assignmentTask.assignmentResults = [
        ...assignmentTask.assignmentResults,
        assignmentResult,
      ];
      assignmentTask.status = this.getStatus(assignmentTask);

      
      //start transaction session
      const session = await mongoose.startSession();
      await session.startTransaction();

      //save the assignment result
      await assignmentResult.save({ session: session });

      //save new assignment task
      await assignmentTask.save({ session: session });

      //save all new invigilator experiences
      await InvigilatorExperience.insertMany(invigilatorExp, {
        session: session,
      });

      //update all teacher's invigilator experiences
      await Teacher.bulkWrite(invigilatorBulkOperation, {session:session})

      await session.commitTransaction();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(`Failed to assign invigilators - ${error.message}`, 500)
      );
    }

    res.status(200).json({
      assignmentTask: assignmentTask.toObject({ getters: true }),
    });
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
        .populate("examCenterData")
        .populate({
          path: "assignmentResults",
          populate: {
            path: "results.invigilators",
            populate: { path: "listOfInvigilatorExperience" },
          },
        });

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
      let assignmentResultBulkOperation = []; //bulk operation array
      let invigilatorBulkOperation = []; //bulk operation array
      let invigilatorExpBulkOperation = []; //bulk operation array
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

          //setting up bulk operation to remove all invigilator exp
          invigilatorExpBulkOperation = [
            {
              deleteMany: {
                filter: {
                  assignmentTask: assignmentTask._id,
                },
              },
            },
          ];

          //setting up bulk operation to update the invigilator exp - need optimization (6 role * n exam center * m required invigilator)
          assignmentTask.assignmentResults.forEach((assignmentResult) => {
            assignmentResult.results.forEach((result) => {
              result.invigilators.forEach((invigilator) => {
                const newExpList =
                  invigilator.listOfInvigilatorExperience.filter(
                    (exp) => exp.assignmentTask != assignmentTask.id
                  );

                invigilatorBulkOperation.push({
                  updateOne: {
                    filter: {
                      _id: invigilator._id,
                    },
                    update: {
                      listOfInvigilatorExperience: newExpList,
                    },
                  },
                });
              });
            });
          });

          //setting up bulk operation to remove all assignment result
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

      if (assignmentResultBulkOperation.length != 0) {
        await AssignmentResult.bulkWrite(assignmentResultBulkOperation, {
          session: session,
        });
        await Teacher.bulkWrite(invigilatorBulkOperation, { session: session });
        await InvigilatorExperience.bulkWrite(invigilatorExpBulkOperation, {
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

  deleteAssignmentTask = async (req, res, next) => {
    const taskId = req.params.id;

    let assignmentTask;
    let examCenterBulkOperation = [];
    let examCenterDataBulkOperation = [];
    let assignmentResultBulkOperation = [];
    let invigilatorExpBulkOperation = [];
    let invigilatorBulkOperation = [];
    try {
      assignmentTask = await AssignmentTask.findById(taskId).populate({
        path: "assignmentResults",
        populate: {
          path: "results.invigilators",
          populate: { path: "listOfInvigilatorExperience" },
        },
      });

      if (!assignmentTask) {
        return next(
          new HttpError(
            "Could not find any assignment task with the provided id",
            404
          )
        );
      }

      //setting up bulk operation for updating exam center's assignmentTasks
      examCenterBulkOperation = assignmentTask.examCenters.map((center) => {
        return {
          updateOne: {
            filter: {
              _id: center,
            },
            update: {
              $pull: {
                assignmentTasks: assignmentTask.id,
              },
            },
          },
        };
      });

      //setting up bulk operation for deleting all the exam center data
      examCenterDataBulkOperation = assignmentTask.examCenterData.map(
        (data) => {
          return {
            deleteOne: {
              filter: {
                _id: data,
              },
            },
          };
        }
      );

      //setting up bulk operation to remove all invigilator exp
      invigilatorExpBulkOperation = [
        {
          deleteMany: {
            filter: {
              assignmentTask: assignmentTask._id,
            },
          },
        },
      ];

      //setting up bulk operation to update the invigilator exp - need optimization (6 role * n exam center * m required invigilator)
      assignmentTask.assignmentResults.forEach((assignmentResult) => {
        assignmentResult.results.forEach((result) => {
          result.invigilators.forEach((invigilator) => {
            const newExpList = invigilator.listOfInvigilatorExperience.filter(
              (exp) => exp.assignmentTask != assignmentTask.id
            );

            invigilatorBulkOperation.push({
              updateOne: {
                filter: {
                  _id: invigilator._id,
                },
                update: {
                  listOfInvigilatorExperience: newExpList,
                },
              },
            });
          });
        });
      });

      //setting up bulk operation for deleting all the assignment result
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

      //start transaction session
      const session = await mongoose.startSession();
      session.startTransaction();

      //delete assignment task
      await assignmentTask.remove({ session: session });

      //update all exam center's assignmentTasks
      if (examCenterBulkOperation.length != 0) {
        await ExamCenter.bulkWrite(examCenterBulkOperation, {
          session: session,
        });
      }

      //delete the all related exam center datas
      if (examCenterDataBulkOperation.length != 0) {
        await ExamCenterData.bulkWrite(examCenterDataBulkOperation, {
          session: session,
        });
      }

      //delete all related assignment results
      if (assignmentResultBulkOperation.length != 0) {
        await AssignmentResult.bulkWrite(assignmentResultBulkOperation, {
          session: session,
        });

        await Teacher.bulkWrite(invigilatorBulkOperation, { session: session });
        await InvigilatorExperience.bulkWrite(invigilatorExpBulkOperation, {
          session: session,
        });
      }

      await session.commitTransaction();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to delete the assignment task - ${error.message}`,
          500
        )
      );
    }

    res.status(200).json({ message: "Success" });
  };
}

module.exports = new AssignmentTaskController();
