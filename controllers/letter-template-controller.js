const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const _ = require("lodash");
const pdfGenerator = require("html-pdf-node");
const style = require("../letters/source/letter");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
require("dotenv").config();

const HttpError = require("../models/http-error");
const LetterTemplate = require("../models/letter-template");
const AssignmentTask = require("../models/assignment-task");
const AssignmentResult = require("../models/assignment-result");
const ExamCenter = require("../models/exam-center");
const Teacher = require("../models/teacher");

//create transporter for email sending - with oAuth 2 authentication
const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject("Failed to create access token");
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    pool: true,
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      accessToken,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    },
  });

  return transporter;
};

class LetterTemplateController {
  constructor() {}

  createLetterTemplate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const { title, content, tags } = req.body;
    const letterTemplate = new LetterTemplate({
      title: title,
      content: content,
      tags: tags,
      district: req.district,
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
    let letterTemplates;
    try {
      //get all letter templates by district
      letterTemplates = await LetterTemplate.find({ district: req.district });
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

    let letterTemplate;
    try {
      //get letter template by id and district
      letterTemplate = await LetterTemplate.findOne({
        _id: templateId,
        district: req.district,
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

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

  compileLetter = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return next(new HttpError(errors.errors[0].msg, 422));
    }

    const templateId = req.body.letterTemplate;
    const role = req.body.role;
    const taskId = req.body.taskId;

    let letterTemplate;
    let assignmentTask;
    let letterContents = [];
    try {
      //get the selected letter template
      letterTemplate = await LetterTemplate.findById(templateId);

      if (!letterTemplate) {
        return next(
          new HttpError(
            "Could not find any letter template with the provided id",
            404
          )
        );
      }

      //get the assignment task
      assignmentTask = await AssignmentTask.findById(taskId).populate({
        path: "assignmentResults",
        populate: [
          { path: "results.examCenter", populate: { path: "school" } },
          { path: "results.invigilators" },
        ],
      });

      let assignmentResultIndex;
      //finding the target result which match the role
      const targetResult = assignmentTask.assignmentResults.find(
        (result, index) => {
          assignmentResultIndex = index; //setting the assignmentResultIndex
          return result.role == role;
        }
      );

      //loop through each results
      targetResult.results.forEach((result, resultIndex) => {
        //loop through each invigilators
        result.invigilators.forEach((invigilator, invigilatorIndex) => {
          //resolved the tag in the content
          let resolvedContent = letterTemplate.content;
          //loop through each tag
          letterTemplate.tags.forEach((tag, tagIndex) => {
            let value = tag.value;
            value = _.replace(
              value,
              "assignmentResultIndex",
              assignmentResultIndex
            );
            value = _.replace(value, "resultIndex", resultIndex);
            value = _.replace(value, "invigilatorIndex", invigilatorIndex);
            resolvedContent = _.replace(
              resolvedContent,
              `&lt;${tagIndex + 1}&gt;`,
              _.get(assignmentTask, value)
            );
          });

          letterContents.push({
            invigilator: invigilator,
            content: resolvedContent,
          });
        });
      });

      //initialize transporter with pool connection - authentication with oAuth2
      const transporter = await createTransporter();

      //generate pdf and emails
      let emails = await Promise.all(
        letterContents.map(async (letter) => {
          //setting up options of pdf (format, name, path to store and margin)
          let options = {
            format: "A4",
            path: `letters/compiled/${letterTemplate.title}_${letter.invigilator.teacherName}.pdf`,
            margin: { top: "10mm", left: "10mm", right: "10mm" },
          };
          //replace the content of basic template
          const newLetterContent = _.replace(
            style.letterBasicTemplate,
            "letter-content",
            letter.content
          );

          let file = {
            content: newLetterContent,
          };

          //generate pdf and save in file
          await pdfGenerator.generatePdf(file, options);

          //generate email with attachment of the newly created pdf
          let email = {
            from: "chuanwj65@gmail.com",
            to: "wei.jian@graduate.utm.my", //letter.invigilator.teacherEmailAddress
            subject: letterTemplate.title,
            text: "Please refer to the attachment: ",
            attachments: [
              {
                path: `letters/compiled/${letterTemplate.title}_${letter.invigilator.teacherName}.pdf`,
              },
            ],
          };

          //return the generated email into array
          return email;
        })
      );

      //run after the emails and pdfs have been generated
      if (emails.length > 0) {
        while (emails.length) {
          const email = emails.shift();
          transporter.sendMail(email, (error, info) => {
            if (error) {
              return next(
                new HttpError(`Failed to send letter - ${error}`, 500)
              );
            } else {
              //delete the attachment after sent email synchronous
              fs.unlink(email.attachments[0].path, (err) => {
                if (err) {
                  console.log(err);
                }
              });
            }
          });
        }
      }
    } catch (error) {
      console.log(error);
      return next(
        new HttpError(
          `Failed to compile letter for ${role} - ${error.message}`,
          500
        )
      );
    }

    res.json({ message: "success" });
  };
}

module.exports = new LetterTemplateController();
