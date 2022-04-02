class HttpError extends Error {
    constructor(message, errorCode) {
      super(message); //Add message attr to Error class
      this.code = errorCode;
    }
  }
  
  module.exports = HttpError;
  