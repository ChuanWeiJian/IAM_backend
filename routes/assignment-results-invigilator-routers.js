const express = require("express");

const checkAuth = require("../middleware/check-teacher-auth");
const controller = require("../controllers/assignment-result-controller");

const router = express.Router();

//check the authentication & authorization
router.use(checkAuth);

//get all assignment results by user id: /api/results-invigilator/:id
router.get("/:id", controller.getAllAssignmentResultInvigilator);

module.exports = router;
