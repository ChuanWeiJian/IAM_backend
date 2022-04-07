const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const examCenterDataSchema = new Schema({
  examCenter:{type:mongoose.Types.ObjectId, required: true, ref:"ExamCenter"},
  assignmentTaskId: {type:mongoose.Types.ObjectId, required: true, ref:"AssignmentTask"},
  roomAvailable: {type: Number},
  specialRoomAvailable: {type: Number},
  hallAvailable: {type: Number},
  roomCandidateNumber: {type: Number},
  specialRoomCandidateNumber: {type: Number},
  hallCandidateNumber: {type: Number},
  numberOfChiefInvigilatorRequired: {type: Number},
  numberOfViceChiefInvigilatorRequired: {type: Number},
  numberOfEnvironmentalSupervisorRequired: {type: Number},
  numberOfRoomKeeperRequired: {type: Number},
  numberOfReservedInvigilatorRequired: {type: Number},
  numberOfInvigilatorRequired: {type: Number},
  listChiefInvigilatorRequired:[{type:mongoose.Types.ObjectId, ref: "Teacher"}],
  listViceChiefInvigilatorRequired:[{type:mongoose.Types.ObjectId, ref: "Teacher"}],
  listEnvironmentalSupervisorRequired:[{type:mongoose.Types.ObjectId, ref: "Teacher"}],
  listRoomKeeperRequired:[{type:mongoose.Types.ObjectId, ref: "Teacher"}],
  listInvigilatorRequired:[{type:mongoose.Types.ObjectId, ref: "Teacher"}],
  listReservedInvigilatorRequired:[{type:mongoose.Types.ObjectId, ref: "Teacher"}],
});


module.exports = mongoose.model("ExamCenterData", examCenterDataSchema);
