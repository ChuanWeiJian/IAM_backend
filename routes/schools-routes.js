const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-officer-auth");
const controller = require("../controllers/school-controller");

const router = express.Router();

//check the authentication & authorization
router.use(checkAuth);

//get all schools by district: /api/schools
router.get("/", controller.getAllSchools);

//get school by id & district: /api/schools/:id
router.get("/:id", controller.getSchoolByIdAndDistrict);

//get school by id & district: /api/schools/examcenters/:id
router.get(
  "/examcenters/:id",
  controller.getSchoolByIdAndDistrictWithResolvedExamCenters
);

//register new school route : /api/schools/
router.post(
  "/",
  [
    check("schoolName").not().isEmpty().withMessage("Name field is required"),
    check("schoolCode")
      .not()
      .isEmpty()
      .withMessage("School Code field is required"),
    check("schoolAddress")
      .not()
      .isEmpty()
      .withMessage("Address field is required"),
    check("postcode").not().isEmpty().withMessage("Postcode field is required"),
    check("city").not().isEmpty().withMessage("City field is required"),
    check("stateCode")
      .not()
      .isEmpty()
      .withMessage("StateCode field is required"),
    check("areaCode").not().isEmpty().withMessage("AreaCode field is required"),
    check("schoolPhoneNumber")
      .not()
      .isEmpty()
      .withMessage("School Phone Number field is required"),
    check("taxNumber")
      .not()
      .isEmpty()
      .withMessage("Tax Number field is required"),
    check("codeDun").not().isEmpty().withMessage("CodeDUN field is required"),
    check("codeParlimen")
      .not()
      .isEmpty()
      .withMessage("CodeParlimen field is required"),
    check("typeOfSchool")
      .not()
      .isEmpty()
      .withMessage("Type Of School field is required"),
    check("schoolEmailAddress")
      .not()
      .isEmpty()
      .withMessage("School Email Address field is required"),
    check("schoolEmailAddress")
      .isEmail()
      .withMessage("School Email Address field is invalid"),
  ],
  controller.registerSchool
);

//edit school information: /api/schools/:id
router.patch(
  "/:id",
  [
    check("schoolName").not().isEmpty().withMessage("Name field is required"),
    check("schoolCode")
      .not()
      .isEmpty()
      .withMessage("School Code field is required"),
    check("schoolAddress")
      .not()
      .isEmpty()
      .withMessage("Address field is required"),
    check("postcode").not().isEmpty().withMessage("Postcode field is required"),
    check("city").not().isEmpty().withMessage("City field is required"),
    check("stateCode")
      .not()
      .isEmpty()
      .withMessage("StateCode field is required"),
    check("areaCode").not().isEmpty().withMessage("AreaCode field is required"),
    check("schoolPhoneNumber")
      .not()
      .isEmpty()
      .withMessage("School Phone Number field is required"),
    check("taxNumber")
      .not()
      .isEmpty()
      .withMessage("Tax Number field is required"),
    check("codeDun").not().isEmpty().withMessage("CodeDUN field is required"),
    check("codeParlimen")
      .not()
      .isEmpty()
      .withMessage("CodeParlimen field is required"),
    check("typeOfSchool")
      .not()
      .isEmpty()
      .withMessage("Type Of School field is required"),
    check("schoolEmailAddress")
      .not()
      .isEmpty()
      .withMessage("School Email Address field is required"),
    check("schoolEmailAddress")
      .isEmail()
      .withMessage("School Email Address field is invalid"),
  ],
  controller.editSchoolInformation
);

module.exports = router;
