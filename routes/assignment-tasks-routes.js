const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/assignment-task-controller");

const router = express.Router();

//create new assignment task: /api/assignments
router.post(
  "/",
  [
    check("title").not().isEmpty().withMessage("Title field is required"),
    check("examType")
      .not()
      .isEmpty()
      .withMessage("Exam Type field is required"),
    check("collectionDate")
      .not()
      .isEmpty()
      .withMessage("Collection Date field is required"),
    check("assignmentDate")
      .not()
      .isEmpty()
      .withMessage("Assignment Date field is required"),
    check("examCenters")
      .isArray({ min: 1 })
      .withMessage(
        "Exam Centers is empty, must contain at least one exam center"
      ),
  ],
  controller.createNewAssignmentTask
);

module.exports = router;
