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

  getAllLetterTemplates = async (req, res, next) => {
    const district = req.params.district;

    let letterTemplates;
    try {
      //get all letter templates by district
      letterTemplates = await LetterTemplate.find({ district: district });
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to get all letter templates - ${error.message}`,
          500
        )
      );
    }

    if (!letterTemplates) {
      res.res(200).json({ letterTemplates: [] });
    }

    res.status(200).json({
      letterTemplates: letterTemplates.map((template) =>
        template.toObject({ getters: true })
      ),
    });
  };

  getLetterTemplateByIdAndDistrict = async (req, res, next) => {
    const templateId = req.params.id;
    const district = req.params.district;

    let letterTemplate;
    try {
      //get letter template by id and district
      letterTemplate = await LetterTemplate.findOne({
        _id: templateId,
        district: district,
      });
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to get letter template by id and district - ${error.message}`,
          500
        )
      );
    }

    if (!letterTemplate) {
      return next(
        new HttpError(
          "Could not find any letter template with the provided id and district",
          404
        )
      );
    }

    res
      .status(200)
      .json({ letterTemplate: letterTemplate.toObject({ getters: true }) });
  };

  editLetterTemplate = async (req, res, next) => {
    const templateId = req.params.id;

    const { title, content, tags } = req.body;
    let letterTemplate;
    try {
      //get the letter template by id
      letterTemplate = await LetterTemplate.findById(templateId);

      if (!letterTemplate) {
        return next(
          new HttpError(
            "Could not find any letter template with the provided id",
            404
          )
        );
      }

      //edit letter template
      letterTemplate.title = title;
      letterTemplate.content = content;
      letterTemplate.tags = tags;
      //save modified letter template
      await letterTemplate.save();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(`Failed to edit letter template - ${error.message}`, 500)
      );
    }

    res
      .status(200)
      .json({ letterTemplate: letterTemplate.toObject({ getters: true }) });
  };

  deleteLetterTemplate = async (req, res, next) => {
    const templateId = req.params.id;

    let letterTemplate;
    try {
      //get the letter template by id
      letterTemplate = await LetterTemplate.findById(templateId);

      if (!letterTemplate) {
        return next(
          new HttpError(
            "Could not find any letter template with the provided id",
            404
          )
        );
      }

      //delete the letter template
      await letterTemplate.remove();
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to delete letter template - ${error.message}`,
          500
        )
      );
    }

    res.status(200).json({ message: "Success" });
  };
}

module.exports = new LetterTemplateController();
