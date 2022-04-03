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

    const { name, schoolCode, address } = req.body;

    const newSchool = new School({
      name: name,
      schoolCode: schoolCode,
      address: address,
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
      const hashPassword = await bcrypt.hash(password, 12);
      //generate username
      const username = "sec" + schoolCode;
      newExamSecretary = new User({
        username: username,
        password: hashPassword,
        userGroup: "Exam Secretary",
        school: school,
      });
      await newExamSecretary.save({ session: session });
      newSchool.examSecretary = newExamSecretary.id;
      await newSchool.save({ session: session });
      await session.commitTransaction();
      //end transaction
    } catch (error) {
      console.log(error);
      return next(new HttpError(`Failed to register new school - ${error.message}`, 500));
    }

    res
      .status(201)
      .json({ username: newExamSecretary.username, password: password });
  };
}

module.exports = new SchoolController();
