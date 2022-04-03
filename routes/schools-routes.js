const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/school-controller");

const router = express.Router();

router.post(
  "/",
  [
    check("name").not().isEmpty().withMessage("Name field is required"),
    check("schoolCode").not().isEmpty().withMessage("School Code field is required"),
    check("address").not().isEmpty().withMessage("Address field is required"),
  ],
  controller.registerSchool
);

module.exports = router;
