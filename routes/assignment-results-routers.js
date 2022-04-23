const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-officer-auth");
const controller = require("../controllers/assignment-result-controller");

const router = express.Router();

//check the authentication & authorization
router.use(checkAuth);

//get assignment result by district: /api/results/:id/:role
router.get("/:id/:role", controller.getAssignmentResultByIdAndRoleResolvedAll);

//edit assignment result: /api/results/:id
router.patch(
  "/:id",
  [
    check("results")
      .isArray({ min: 1 })
      .withMessage("Results are not submitted"),
  ],
  controller.editAssignmentResult
);

module.exports = router;
