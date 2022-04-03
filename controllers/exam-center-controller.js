const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const School = require("../models/school");
const ExamCenter = require("../models/exam-center");

class ExamCenterController {
  constructor() {}

  registerExamCenter = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    let school;
    const { examCenterCode, safeRoomNo, schoolId } = req.body;
    const newExamCenter = new ExamCenter({
      examCenterCode: examCenterCode,
      safeRoomNo: safeRoomNo,
      school: schoolId,
      assignmentTasks: [],
    });
    
    try {
      //find the school document by id
      school = await School.findById(schoolId);
      if (!school) {
        return next(new HttpError("School not found", 404));
      }

      //start transaction session
      const session = await mongoose.startSession();
      session.startTransaction();
      await newExamCenter.save({ session: session });
      school.examCenters.push(newExamCenter);
      await school.save({ session: session });
      await session.commitTransaction();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to register new exam center - ${error.message}`,
          500
        )
      );
    }

    res
      .status(201)
      .json({ examCenter: newExamCenter.toObject({ getters: true }) });
  };
}

module.exports = new ExamCenterController();
