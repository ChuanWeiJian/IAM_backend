const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/letter-template-controller");

const router = express.Router();

//get all letter templates by district: /api/letters/:district
router.get("/:district", controller.getAllLetterTemplates);

//get letter template by id and district: /api/letters/:id/:district
router.get("/:id/:district", controller.getLetterTemplateByIdAndDistrict);

//create new letter template: /api/letters
router.post(
  "/",
  [
    check("title").not().isEmpty().withMessage("Title field is required"),
    check("content").not().isEmpty().withMessage("Content field is required"),
    check("tags").isArray({ min: 1 }).withMessage("Tags cannot be empty"),
    check("district").not().isEmpty().withMessage("District field is missing"),
  ],
  controller.createLetterTemplate
);

//edit letter template: /api/letters/:id
router.patch(
  "/:id",
  [
    check("title").not().isEmpty().withMessage("Title field is required"),
    check("content").not().isEmpty().withMessage("Content field is required"),
    check("tags").isArray({ min: 1 }).withMessage("Tags cannot be empty"),
  ],
  controller.editLetterTemplate
);

//delete letter template: /api/letters/:id
router.delete("/:id", controller.deleteLetterTemplate);

//compile letter: /api/letters/compile
router.post(
  "/compile",
  [
    check("letterTemplate").not().isEmpty().withMessage("Letter template is not chosen"),
    check("taskId").not().isEmpty().withMessage("Assignment task id is missing"),
    check("role").not().isEmpty().withMessage("Role is missing"),
  ],
  controller.compileLetter
);

module.exports = router;
