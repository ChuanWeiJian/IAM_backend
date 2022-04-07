const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/letter-template-controller");

const router = express.Router();

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

module.exports = router;
