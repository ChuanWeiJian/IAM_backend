const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-officer-auth");
const controller = require("../controllers/letter-template-controller");

const router = express.Router();

//check the authentication & authorization
router.use(checkAuth);

//get all letter templates by district: /api/letters
router.get("/", controller.getAllLetterTemplates);

//get letter template by id and district: /api/letters/:id
router.get("/:id", controller.getLetterTemplateByIdAndDistrict);

//create new letter template: /api/letters
router.post(
  "/",
  [
    check("title").not().isEmpty().withMessage("Title field is required"),
    check("content").not().isEmpty().withMessage("Content field is required"),
  ],
  controller.createLetterTemplate
);

//edit letter template: /api/letters/:id
router.patch(
  "/:id",
  [
    check("title").not().isEmpty().withMessage("Title field is required"),
    check("content").not().isEmpty().withMessage("Content field is required"),
  ],
  controller.editLetterTemplate
);

//delete letter template: /api/letters/:id
router.delete("/:id", controller.deleteLetterTemplate);

//compile letter: /api/letters/compile
router.post(
  "/compile",
  [
    check("letterTemplate")
      .not()
      .isEmpty()
      .withMessage("Letter template is not chosen"),
    check("taskId")
      .not()
      .isEmpty()
      .withMessage("Assignment task id is missing"),
    check("role").not().isEmpty().withMessage("Role is missing"),
  ],
  controller.compileLetter
);

module.exports = router;
