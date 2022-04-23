const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

class UserController {
  constructor() {}

  login = async (req, res, next) => {
    const { login, password } = req.body;

    let user, token;
    try {
      //restrict that only admin & officer account can login to the IAM module

      user = await User.findOne({
        login: login,
        status: 1,
        userGroup: { $in: ["Admin", "Officer"] },
      });

      //validating login
      if (!user) {
        return next(
          new HttpError("Incorrect credentials, please try again", 401)
        );
      }

      //validating password
      let isValidPassword = false;
      isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return next(
          new HttpError("Incorrect credentials, please try again", 401)
        );
      }

      token = jwt.sign(
        {
          userId: user.id,
          login: user.login,
          district: user.district,
          userGroup: user.userGroup,
        },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(`Failed to sign in user - ${error.message}`, 500)
      );
    }

    res
      .status(200)
      .json({
        user: {
          id: user.id,
          login: user.login,
          userGroup: user.userGroup,
          district: user.district,
        },
        token: token,
      });
  };

  signUpOfficerAccount = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { login, password, district } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newOfficer = new User({
      login: login,
      password: hashedPassword,
      userGroup: "Officer",
      district: district,
      school: null,
    });

    try {
      await newOfficer.save();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to sign up new officer account - ${error.message}`,
          500
        )
      );
    }

    res.status(201).json({ message: "success" });
  };

  getAllOfficerAccounts = async (req, res, next) => {
    let accounts;

    try {
      accounts = await User.find({ userGroup: "Officer" }, "-password");
    } catch (err) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to get all officer accounts - ${error.message}`,
          500
        )
      );
    }

    if (!accounts) {
      res.json({ accounts: [] });
    }

    res.status(200).json({
      accounts: accounts.map((account) => account.toObject({ getters: true })),
    });
  };

  getOfficerAccountById = async (req, res, next) => {
    const accountId = req.params.id;
    let account;

    try {
      account = await User.findById(accountId, "-password");

      if (!account) {
        return next(
          new HttpError(
            "Could not find any officer account with the provided id",
            404
          )
        );
      }
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to get the officer account - ${error.message}`,
          500
        )
      );
    }

    res.status(200).json({ account: account.toObject({ getters: true }) });
  };

  editAccountInformation = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    let account;
    const accountId = req.params.id;
    const { district, status } = req.body;

    try {
      account = await User.findById(accountId);

      if (!account) {
        return next(
          new HttpError(
            "Could not find any officer account with the provided id",
            404
          )
        );
      }

      account.district = district;
      account.status = status;

      account.save();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to edit the officer account - ${error.message}`,
          500
        )
      );
    }

    res.status(200).json({ message: "success" });
  };

  editAccountPassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    let account;
    const accountId = req.params.id;
    const { password } = req.body;

    try {
      account = await User.findById(accountId);

      if (!account) {
        return next(
          new HttpError(
            "Could not find any officer account with the provided id",
            404
          )
        );
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      account.password = hashedPassword;

      account.save();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to change the officer account's password - ${error.message}`,
          500
        )
      );
    }

    res.status(200).json({ message: "success" });
  };

  deleteAccount = async (req, res, next) => {
    const accountId = req.params.id;
    let account;
    try {
      account = await User.findById(accountId);
      if (!account) {
        return next(
          new HttpError(
            "Could not find any officer account with the provided id",
            404
          )
        );
      }

      await account.remove();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to change the officer account's password - ${error.message}`,
          500
        )
      );
    }

    res.status(200).json({ message: "success" });
  };
}

module.exports = new UserController();
