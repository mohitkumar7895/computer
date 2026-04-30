import mongoose, { Schema, model, models } from "mongoose";

export interface ICourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortName: string;
  durationMonths: number;
  registrationFee: number;
  zone: string; // Software Zone, Hardware Zone, Vocational Zone, Others (Custom)
  hasMarksheet: boolean;
  hasCertificate: boolean;
  status: "active" | "inactive";
  createdAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    registrationFee: { type: Number, required: true, min: 0, default: 0 },
    zone: { type: String, required: true },
    hasMarksheet: { type: Boolean, default: true },
    hasCertificate: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Course = models.Course || model<ICourse>("Course", CourseSchema);
