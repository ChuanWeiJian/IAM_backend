const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/exam-center-controller");

const router = express.Router();

//get all registered exam centers by district: /api/examcenters/:district
router.get("/:district", controller.getAllExamCenters);

//get all registered exam centers by district with resolved school : /api/examcenters/school/:district
router.get("/school/:district", controller.getAllExamCentersResolvedSchool);

//get exam center by id & district : /api/examcenters/:id/:district
router.get("/:id/:district", controller.getExamCenterByIdAndDistrict);

//get exam center by id & district with all fields resolved : /api/examcenters/resolve/:id/:district
router.get("/resolve/:id/:district", controller.getExamCenterByIdAndDistrictResolvedAll);

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
    check("district").not().isEmpty().withMessage("District field is missing"),
  ],
  controller.registerExamCenter
);

module.exports = router;
