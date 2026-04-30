import mongoose, { Schema, model, models } from "mongoose";

export interface IWalletRequest {
  _id: mongoose.Types.ObjectId;
  atcId: mongoose.Types.ObjectId;
  tpCode: string;
  amount: number;
  transactionId: string;
  paymentScreenshot: string;
  paymentNote?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const WalletRequestSchema = new Schema<IWalletRequest>(
  {
    atcId: { type: Schema.Types.ObjectId, ref: "AtcUser", required: true },
    tpCode: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    transactionId: { type: String, required: true, trim: true },
    paymentScreenshot: { type: String, required: true },
    paymentNote: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

WalletRequestSchema.index({ atcId: 1, status: 1, createdAt: -1 });

if (models.WalletRequest) {
  delete (models as any).WalletRequest;
}

export const WalletRequest = model<IWalletRequest>("WalletRequest", WalletRequestSchema);
