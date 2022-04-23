const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-officer-auth");
const controller = require("../controllers/assignment-task-controller");

const router = express.Router();

//check the authentication & authorization
router.use(checkAuth);

//get all assignment tasks by district: /api/assignments
router.get("/", controller.getAllAssignmentTasks);

//get one assignment task by id and district: /api/assignments/:id
router.get("/:id", controller.getAssignmentTaskByIdAndDistrict);

//get one assignment task by id and district with resolved exam center & exam center data: /api/assignments/resolve/:id
router.get(
  "/resolve/:id",
  controller.getAssignmentTaskByIdAndDistrictResolvedAll
);

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
    check("examCenters")
      .isArray({ min: 2 })
      .withMessage(
        "Exam Centers is empty, must contain at least two exam center"
      ),
  ],
  controller.createNewAssignmentTask
);

//assign invigilator: /api/assignments/assign/:id/:role
router.get("/assign/:id/:role", controller.assignInvigilators);

//edit assignment task by id: /api/assignments/:id
router.patch(
  "/:id",
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
    check("examCenters")
      .isArray({ min: 1 })
      .withMessage(
        "Exam Centers is empty, must contain at least one exam center"
      ),
  ],
  controller.editAssignmentTask
);

//delete assignment task: /api/assignments/:id
router.delete("/:id", controller.deleteAssignmentTask);

module.exports = router;
