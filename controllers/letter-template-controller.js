const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const LetterTemplate = require("../models/letter-template");

class LetterTemplateController {
  constructor() {}

  createLetterTemplate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { title, content, tags, district } = req.body;
    const letterTemplate = new LetterTemplate({
      title: title,
      content: content,
      tags: tags,
      district: district,
    });

    try {
      //save new letter template
      await letterTemplate.save();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to create new letter template - ${error.message}`,
          500
        )
      );
    }

    res
      .status(201)
      .json({ letterTemplate: letterTemplate.toObject({ getters: true }) });
  };
}

module.exports = new LetterTemplateController();
