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
  email: string;
  address: string;
  course: string;
  qualification: string;
  photo?: string;
  idProof?: string;
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
    email: { type: String, default: "" },
    address: { type: String, required: true },
    course: { type: String, required: true },
    qualification: { type: String, required: true },
    photo: { type: String },
    idProof: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Student = models.Student ?? model<IStudent>("Student", StudentSchema);
