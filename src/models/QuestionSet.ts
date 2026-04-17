import mongoose, { Schema, model, models } from "mongoose";

export interface IQuestionSet {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  questionCount: number;
  durationMinutes: number;
  totalMarks: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSetSchema = new Schema<IQuestionSet>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    questionCount: { type: Number, required: true, default: 100 },
    durationMinutes: { type: Number, required: true, default: 120 },
    totalMarks: { type: Number, required: true, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const QuestionSet = models.QuestionSet ?? model<IQuestionSet>("QuestionSet", QuestionSetSchema);
