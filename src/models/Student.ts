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
  referredBy?: string;
  password?: string; // hashed
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    atcId: { type: Schema.Types.ObjectId, ref: "AtcUser", required: true },
    tpCode: { type: String, required: true },
    registrationNo: { type: String, required: true, unique: true },
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
    session: { type: String, required: true },
    classRollNo: { type: String },
    nationality: { type: String, default: "Indian" },
    category: { type: String, required: true },
    maritalStatus: { type: String },
    religion: { type: String },
    disability: { type: Boolean, default: false },
    disabilityDetails: { type: String },
    admissionFees: { type: String, required: true },
    highestQualification: { type: String, required: true },
    qualificationDoc: { type: String },
    photo: { type: String },
    idProof: { type: String },
    aadharNo: { type: String },
    aadharDoc: { type: String },
    studentSignature: { type: String },
    referredBy: { type: String },
    password: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const AtcStudent = models.AtcStudent || model<IStudent>("AtcStudent", StudentSchema);
