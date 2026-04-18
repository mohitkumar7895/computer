import mongoose, { Schema, model, models } from "mongoose";

export interface IStudentExamAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOption: string;
  correct: boolean;
  marksEarned: number;
}

export interface IStudentExam {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  atcId: mongoose.Types.ObjectId;
  setId?: mongoose.Types.ObjectId;
  examMode?: "online" | "offline";
  offlineDetails?: {
    preferredDate?: string;
    preferredCenter?: string;
    preferredTimeSlot?: string;
  };
  approvalStatus: "none" | "pending" | "approved" | "rejected";
  admitCardReleased: boolean;
  examDate?: Date;
  examTime?: string;
  answers: IStudentExamAnswer[];
  totalScore: number;
  maxScore: number;
  status: "pending" | "completed";
  startedAt?: Date;
  submittedAt?: Date;
  resultDeclared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentExamAnswerSchema = new Schema<IStudentExamAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "ExamQuestion", required: true },
    selectedOption: { type: String, required: true },
    correct: { type: Boolean, required: true },
    marksEarned: { type: Number, required: true },
  },
  { _id: false },
);

const StudentExamSchema = new Schema<IStudentExam>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "AtcStudent", required: true },
    atcId: { type: Schema.Types.ObjectId, ref: "AtcUser", required: true },
    setId: { type: Schema.Types.ObjectId, ref: "QuestionSet" },
    examMode: { type: String, enum: ["online", "offline"] },
    offlineDetails: {
      preferredDate: String,
      preferredCenter: String,
      preferredTimeSlot: String,
    },
    approvalStatus: { 
      type: String, 
      enum: ["none", "pending", "approved", "rejected"],
      default: "none" 
    },
    admitCardReleased: { type: Boolean, default: false },
    examDate: { type: Date },
    examTime: { type: String },
    answers: { type: [StudentExamAnswerSchema], default: [] },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    resultDeclared: { type: Boolean, default: false },
    // Offline specific tracking
    offlineExamStatus: { type: String, enum: ["not_appeared", "appeared", "published"], default: "not_appeared" },
    offlineExamResult: { type: String, enum: ["Pass", "Fail", "Waiting"], default: "Waiting" },
    offlineExamCopy: { type: String }, // Base64 PDF
  },
  { timestamps: true },
);

export const StudentExam = models.StudentExam ?? model<IStudentExam>("StudentExam", StudentExamSchema);
