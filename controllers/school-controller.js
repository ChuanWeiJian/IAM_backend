const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const passwordGenerator = require("generate-password");
const bcrypt = require("bcryptjs");

const HttpError = require("../models/http-error");
const School = require("../models/school");
const User = require("../models/user");

class SchoolController {
  constructor() {}

  registerSchool = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { name, schoolCode, address, district } = req.body;

    const newSchool = new School({
      name: name,
      schoolCode: schoolCode,
      address: address,
      district: district,
    });

    let newExamSecretary, password;
    try {
      //start transaction session
      const session = await mongoose.startSession();
      session.startTransaction();

      //save new school
      const school = await newSchool.save({ session: session });
      console.log(school.id);

      //register new exam secretary
      //random generate a password
      password = passwordGenerator.generate({
        length: 10,
        numbers: true,
      });
      //hashing the password
      const hashPassword = await bcrypt.hash(password, 10);
      //generate username
      const login = "sec" + schoolCode;
      newExamSecretary = new User({
        login: login,
        password: hashPassword,
        userGroup: "Exam Secretary",
        school: school,
        district: district,
      });
      await newExamSecretary.save({ session: session });
      newSchool.examSecretary = newExamSecretary.id;
      await newSchool.save({ session: session });
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
      .json({ login: newExamSecretary.login, password: password });
  };

  getAllSchools = async (req, res, next) => {
    const district = req.params.district;

    let schools;
    try {
      //get all schools by district
      schools = await School.find({ district: district });
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(`Failed to retrieve all schools - ${error.message}`, 500)
      );
    }

    //if no school found, return an empty array
    if (!schools) {
      res.json({ schools: [] });
    }

    //return all schools found
    return res.json({
      schools: schools.map((school) => school.toObject({ getters: true })),
    });
  };

  getSchoolByIdAndDistrict = async (req, res, next) => {
    const schoolId = req.params.id;
    const district = req.params.district;

    let school;
    try {
      //get school by id & district
      school = await School.findOne({ _id: schoolId, district: district });
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieve school by id & district - ${error.message}`,
          500
        )
      );
    }

    //school not found
    if (!school) {
      return next(
        new HttpError(
          "Could not find any school with provided id & district",
          404
        )
      );
    }

    return res.json({ school: school.toObject({ getters: true }) });
  };

  getSchoolByIdAndDistrictWithResolvedExamCenters = async (req, res, next) => {
    const schoolId = req.params.id;
    const district = req.params.district;

    let school;
    try {
      //get school by id & district with resolved exam centers
      school = await School.findOne({
        _id: schoolId,
        district: district,
      }).populate("examCenters");
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to retrieve school by id & district with resolved exam centers - ${error.message}`,
          500
        )
      );
    }

    //school not found
    if (!school) {
      return next(
        new HttpError(
          "Could not find any school with provided id & district with resolved exam centers",
          404
        )
      );
    }

    return res.json({ school: school.toObject({ getters: true }) });
  };

  editSchoolInformation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { name, schoolCode, address } = req.body;
    const schoolId = req.params.id;

    let school;
    try {
      //retrieve the school information by id
      school = await School.findById(schoolId);

      if (!school) {
        return next(
          new HttpError("Could not find any school with provided id", 404)
        );
      }

      //update school information
      school.name = name;
      school.schoolCode = schoolCode;
      school.address = address;
      await school.save();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to edit school information - ${error.message}`,
          500
        )
      );
    }

    return res.status(200).json({ school: school.toObject({ getters: true }) });
  };
}

module.exports = new SchoolController();
