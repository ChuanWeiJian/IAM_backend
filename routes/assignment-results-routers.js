const express = require("express");
const { check } = require("express-validator");

const controller = require("../controllers/assignment-result-controller");

const router = express.Router();

//get all assignment tasks by district: /api/results/:id/:role
router.get("/:id/:role", controller.getAssignmentResultByIdAndRoleResolvedAll);

module.exports = router;