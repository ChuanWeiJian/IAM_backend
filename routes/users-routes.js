const express = require("express");
const { check } = require("express-validator");

const checkAuth = require("../middleware/check-admin-auth");
const controller = require("../controllers/user-controller");

const router = express.Router();

//login user: /api/users/login
router.post("/login", controller.login);

//middleware to check authorization and authentication
router.use(checkAuth);

//sign up new officer account: /api/users
router.post(
  "/",
  [
    check("login").not().isEmpty().withMessage("Login field is required"),
    check("password").not().isEmpty().withMessage("Password field is required"),
    check("district").not().isEmpty().withMessage("District field is required"),
  ],
  controller.signUpOfficerAccount
);

//get all officer accounts: /api/users/officer
router.get("/officer", controller.getAllOfficerAccounts);

//get one officer accounts: /api/users/officer/:id
router.get("/officer/:id", controller.getOfficerAccountById);

//edit officer account information: /api/users/officer/:id
router.patch(
  "/officer/:id",
  [
    check("district").not().isEmpty().withMessage("District field is required"),
    check("status").not().isEmpty().withMessage("Status field is required"),
  ],
  controller.editAccountInformation
);

//edit account password: /api/users/officer/password/:id
router.patch(
  "/officer/password/:id",
  [check("password").not().isEmpty().withMessage("Password field is required")],
  controller.editAccountPassword
);

//delete account: /api/users/officer
router.delete("/officer/:id", controller.deleteAccount);

module.exports = router;
