const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-officer-auth");
const controller = require("../controllers/exam-center-controller");

const router = express.Router();

//check the authentication & authorization
router.use(checkAuth);

//get all registered exam centers by district: /api/examcenters
router.get("/", controller.getAllExamCenters);

//get all registered exam centers by district with resolved school : /api/examcenters/school
router.get("/school", controller.getAllExamCentersResolvedSchool);

//get exam center by id & district : /api/examcenters/:id
router.get("/:id", controller.getExamCenterByIdAndDistrict);

//get exam center by id & district with all fields resolved : /api/examcenters/resolve/:id/:district
router.get("/resolve/:id", controller.getExamCenterByIdAndDistrictResolvedAll);

//register new exam center: /api/examcenters
router.post(
  "/",
  [
    check("examCenterCode")
      .not()
      .isEmpty()
      .withMessage("Exam Center Code field is required"),
    check("safeRoomNo")
      .not()
      .isEmpty()
      .withMessage("Safe Room Numeber field is required"),
    check("schoolId").not().isEmpty().withMessage("School Id is missing"),
  ],
  controller.registerExamCenter
);

//edit exam center information: /api/examcenters/:id
router.patch(
  "/:id",
  [
    check("examCenterCode")
      .not()
      .isEmpty()
      .withMessage("Exam Center Code field is required"),
    check("safeRoomNo")
      .not()
      .isEmpty()
      .withMessage("Safe Room Numeber field is required"),
  ],
  controller.editExamCenterInformation
);

module.exports = router;
