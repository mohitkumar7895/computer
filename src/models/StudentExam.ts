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
  setId: mongoose.Types.ObjectId;
  answers: IStudentExamAnswer[];
  totalScore: number;
  maxScore: number;
  status: "pending" | "completed";
  admitCardIssued: boolean;
  startedAt: Date;
  submittedAt?: Date;
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
    setId: { type: Schema.Types.ObjectId, ref: "QuestionSet", required: true },
    answers: { type: [StudentExamAnswerSchema], default: [] },
    totalScore: { type: Number, required: true, default: 0 },
    maxScore: { type: Number, required: true, default: 100 },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    admitCardIssued: { type: Boolean, default: false },
    startedAt: { type: Date, required: true, default: () => new Date() },
    submittedAt: { type: Date },
  },
  { timestamps: true },
);

export const StudentExam = models.StudentExam ?? model<IStudentExam>("StudentExam", StudentExamSchema);
