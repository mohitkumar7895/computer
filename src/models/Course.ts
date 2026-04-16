import mongoose, { Schema, model, models } from "mongoose";

export interface ICourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortName: string;
  durationMonths: number;
  zone: string; // Software Zone, Hardware Zone, Vocational Zone, Others (Custom)
  status: "active" | "inactive";
  createdAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    zone: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Course = models.Course || model<ICourse>("Course", CourseSchema);
