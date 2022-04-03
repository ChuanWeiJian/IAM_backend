const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/exam-center-controller");

const router = express.Router();

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

module.exports = router;
