import mongoose, { Schema, model, models } from "mongoose";

export type AtcApplicationStatus = "pending" | "approved" | "rejected";

export interface IAtcApplication {
  _id: mongoose.Types.ObjectId;
  processFee: string;
  trainingPartnerName: string;
  trainingPartnerAddress: string;
  totalName: string;
  district: string;
  state: string;
  pin: string;
  country: string;
  mobile: string;
  email: string;
  statusOfInstitution: string;
  yearOfEstablishment: string;
  chiefName: string;
  designation: string;
  educationQualification: string;
  professionalExperience: string;
  dob: string;
  photo?: string; // Base64 or URL
  paymentMode: string;
  paymentScreenshot?: string; // Base64 or URL
  instituteDocument?: string; // Base64 or URL
  infrastructure: string; // JSON string
  paidAmount: string;
  transactionNo: string;
  status: AtcApplicationStatus;
  tpCode?: string; // Generated after approval
  submittedByAdmin: boolean; // true if Admin filled and directly approved
  postalAddressOffice: string;
  zones: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AtcApplicationSchema = new Schema<IAtcApplication>(
  {
    processFee: { type: String, required: true },
    trainingPartnerName: { type: String, required: true },
    trainingPartnerAddress: { type: String, required: true },
    postalAddressOffice: { type: String, default: "" },
    zones: { type: [String], default: [] },
    totalName: { type: String, default: "" },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pin: { type: String, required: true },
    country: { type: String, default: "INDIA" },
    mobile: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    statusOfInstitution: { type: String, required: true },
    yearOfEstablishment: { type: String, required: true },
    chiefName: { type: String, required: true },
    designation: { type: String, required: true },
    educationQualification: { type: String, required: true },
    professionalExperience: { type: String, required: true },
    dob: { type: String, required: true },
    photo: { type: String },
    paymentMode: { type: String, required: true },
    paymentScreenshot: { type: String },
    instituteDocument: { type: String },
    infrastructure: { type: String, default: "{}" },
    paidAmount: { type: String, default: "" },
    transactionNo: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    tpCode: { type: String, default: "" },
    submittedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const AtcApplication =
  models.AtcApplication ?? model<IAtcApplication>("AtcApplication", AtcApplicationSchema);
