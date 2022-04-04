const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/school-controller");

const router = express.Router();

//get all schools by district: /api/schools/:district
router.get("/:district", controller.getAllSchools);

//get school by id & district: /api/schools/:id/:district
router.get("/:id/:district", controller.getSchoolByIdAndDistrict);

//get school by id & district: /api/schools/examcenters/:id/:district
router.get("/examcenters/:id/:district", controller.getSchoolByIdAndDistrictWithResolvedExamCenters);

//register new school route : /api/schools/
router.post(
  "/",
  [
    check("name").not().isEmpty().withMessage("Name field is required"),
    check("schoolCode")
      .not()
      .isEmpty()
      .withMessage("School Code field is required"),
    check("address").not().isEmpty().withMessage("Address field is required"),
    check("district").not().isEmpty().withMessage("District field is missing"),
  ],
  controller.registerSchool
);

module.exports = router;
