import mongoose, { Schema, model, models } from "mongoose";

export interface ICertificate {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  atcId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  enrollmentNo: string;
  serialNo: string; // Unique Certificate ID
  issueDate: Date;
  session: string; // e.g. 2025-26
  courseName: string;
  centerCode: string;
  centerName: string;
  grade: string;
  isApproved: boolean;
  createdAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "AtcStudent", required: true },
    atcId: { type: Schema.Types.ObjectId, ref: "AtcUser", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "StudentExam", required: true },
    enrollmentNo: { type: String, required: true },
    serialNo: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    session: { type: String, required: true },
    courseName: { type: String, required: true },
    centerCode: { type: String, required: true },
    centerName: { type: String, required: true },
    grade: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Certificate = models.Certificate || model<ICertificate>("Certificate", CertificateSchema);
