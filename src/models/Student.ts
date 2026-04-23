import mongoose, { Schema, model, models } from "mongoose";

export interface IStudent {
  _id: mongoose.Types.ObjectId;
  atcId: mongoose.Types.ObjectId;
  tpCode: string;
  registrationNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  mobile: string;
  parentsMobile?: string;
  email: string;
  currentAddress: string;
  permanentAddress: string;
  course: string; // or Schema.Types.ObjectId if referencing Course
  courseId?: mongoose.Types.ObjectId;
  courseType?: "Regular" | "ODL" | "OL";
  session: string;
  classRollNo?: string;
  nationality: string;
  category: string;
  maritalStatus?: string;
  religion?: string;
  disability: boolean;
  disabilityDetails?: string;
  admissionFees: string;
  highestQualification: string;
  qualificationDoc?: string;
  photo?: string;
  idProof?: string;
  aadharNo?: string;
  aadharDoc?: string;
  studentSignature?: string;
  otherDocs?: string;
  marksheet12th?: string;
  graduationDoc?: string;
  highestQualDoc?: string;
  referredBy?: string;
  admissionDate: string;
  password?: string; // hashed
  status: "pending" | "approved" | "rejected" | "active";
  userStatus: "active" | "disabled";
  
  // Offline Exam Tracking
  offlineExamStatus: "not_appeared" | "appeared" | "review_pending" | "published";
  offlineExamMarks: string;
  offlineExamResult: "Pass" | "Fail" | "Waiting";
  offlineExamCopy?: string; // PDF URL
  examMode?: string;

  totalFee: number;
  paidAmount: number;
  duesAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    atcId: { type: Schema.Types.ObjectId, ref: "AtcUser", required: true },
    tpCode: { type: String, required: true },
    registrationNo: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    mobile: { type: String, required: true },
    parentsMobile: { type: String },
    email: { type: String, default: "" },
    currentAddress: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    course: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    courseType: { type: String, enum: ["Regular", "ODL", "OL", "ODL (Open Distance Learning)", "OL (Online Learning)"], default: "Regular" },
    session: { type: String, required: true },
    classRollNo: { type: String },
    nationality: { type: String, default: "Indian" },
    category: { type: String, required: true },
    maritalStatus: { type: String },
    religion: { type: String },
    disability: { type: Boolean, default: false },
    disabilityDetails: { type: String },
    admissionFees: { type: String, required: true },
    admissionDate: { type: String, required: true },
    highestQualification: { type: String, required: true },
    qualificationDoc: { type: String },
    photo: { type: String },
    idProof: { type: String },
    aadharNo: { type: String },
    aadharDoc: { type: String },
    studentSignature: { type: String },
    otherDocs: { type: String },
    marksheet12th: { type: String },
    graduationDoc: { type: String },
    highestQualDoc: { type: String },
    referredBy: { type: String },
    password: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected", "active"], default: "pending" },
    userStatus: { type: String, enum: ["active", "disabled"], default: "active" },

    // Offline Exam Tracking
    offlineExamStatus: { type: String, enum: ["not_appeared", "appeared", "review_pending", "published"], default: "not_appeared" },
    offlineExamMarks: { type: String, default: "" },
    offlineExamResult: { type: String, enum: ["Pass", "Fail", "Waiting"], default: "Waiting" },
    offlineExamCopy: { type: String, default: "" },
    examMode: { type: String, default: "online" },

    // Fee Management
    totalFee: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    duesAmount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Add Indexes for Performance
StudentSchema.index({ atcId: 1, status: 1 });
StudentSchema.index({ atcId: 1, userStatus: 1 });
StudentSchema.index({ atcId: 1, createdAt: -1 });
StudentSchema.index({ registrationNo: 1 });

export const AtcStudent = models.AtcStudent || model<IStudent>("AtcStudent", StudentSchema);
