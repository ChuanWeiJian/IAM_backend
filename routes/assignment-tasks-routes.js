const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/assignment-task-controller");

const router = express.Router();

//get all assignment tasks by district: /api/assignments/:district
router.get("/:district", controller.getAllAssignmentTasks);

//get one assignment task by id and district: /api/assignments/:id/:district
router.get("/:id/:district", controller.getAssignmentTaskByIdAndDistrict);

//get one assignment task by id and district with resolved exam center & exam center data: /api/assignments/resolve/:id/:district
router.get("/resolve/:id/:district", controller.getAssignmentTaskByIdAndDistrictResolvedAll);

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
    check("district")
      .not()
      .isEmpty()
      .withMessage("District information is missing"),
  ],
  controller.createNewAssignmentTask
);

module.exports = router;
