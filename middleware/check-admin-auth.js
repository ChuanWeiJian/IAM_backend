const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // There are some string infront of the token
    if (!token) {
      throw new Error("Authentication Failed");
    }
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    if (decodedToken.userGroup !== "Admin") {
      throw new Error("Not Authorized");
    }

    next();
  } catch (err) {
    const error = new HttpError("Authentication/Authorization failed", 401);
    return next(error);
  }
};
