const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const School = require("../models/school");
const ExamCenter = require("../models/exam-center");
const AssignmentTask = require("../models/assignment-task");

class ExamCenterController {
  constructor() {}

  registerExamCenter = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    let school;
    const { examCenterCode, safeRoomNo, schoolId, district } = req.body;
    const newExamCenter = new ExamCenter({
      examCenterCode: examCenterCode,
      safeRoomNo: safeRoomNo,
      district: district,
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

  getAllExamCenters = async (req, res, next) => {
    const district = req.params.district;

    let examCenters;
    try {
      //get all registered exam centers by district
      examCenters = await ExamCenter.find({ district: district });
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieve all exam centers - ${error.message}`,
          500
        )
      );
    }

    //no exam center found, return an empty array
    if (!examCenters) {
      res.json({ examCenters: [] });
    }

    //return all found exam centers
    res.json({
      examCenters: examCenters.map((center) =>
        center.toObject({ getters: true })
      ),
    });
  };

  getAllExamCentersResolvedSchool = async (req, res, next) => {
    const district = req.params.district;

    let examCenters;
    try {
      //get all registered exam centers by district
      examCenters = await ExamCenter.find({ district: district }).populate(
        "school"
      );
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieve all exam centers with resolved school - ${error.message}`,
          500
        )
      );
    }

    //no exam center found, return an empty array
    if (!examCenters) {
      res.json({ examCenters: [] });
    }

    //return all found exam centers
    res.json({
      examCenters: examCenters.map((center) =>
        center.toObject({ getters: true })
      ),
    });
  };

  getExamCenterByIdAndDistrict = async (req, res, next) => {
    const examCenterId = req.params.id;
    const district = req.params.district;

    let examCenter;
    try {
      //get exam center by id & district
      examCenter = await ExamCenter.findOne({
        _id: examCenterId,
        district: district,
      });
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieve exam center by id & district - ${error.message}`,
          500
        )
      );
    }

    //exam center not found
    if (!examCenter) {
      return next(
        new HttpError(
          "Could not find any exam center with provided id & district",
          404
        )
      );
    }

    res.json({ examCenter: examCenter.toObject({ getters: true }) });
    //return the found exam center
  };

  getExamCenterByIdAndDistrictResolvedAll = async (req, res, next) => {
    const examCenterId = req.params.id;
    const district = req.params.district;

    let examCenter;
    try {
      //get exam center by id & district
      examCenter = await ExamCenter.findOne({
        _id: examCenterId,
        district: district,
      })
        .populate("school")
        .populate("assignmentTasks");
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieve exam center by id & district with all fields resolved - ${error.message}`,
          500
        )
      );
    }

    //exam center not found
    if (!examCenter) {
      return next(
        new HttpError(
          "Could not find any exam center with provided id & district with all fields resolved",
          404
        )
      );
    }

    res.json({ examCenter: examCenter.toObject({ getters: true }) });
    //return the found exam center
  };
}

module.exports = new ExamCenterController();
