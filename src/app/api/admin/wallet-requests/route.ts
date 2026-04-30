import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/auth";
import { WalletRequest } from "@/models/WalletRequest";
import { AtcUser } from "@/models/AtcUser";
import { WalletTransaction } from "@/models/WalletTransaction";

export async function GET(request: Request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const requests = await WalletRequest.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({ path: "atcId", select: "trainingPartnerName tpCode walletBalance" })
      .lean();

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { requestId, action } = await request.json();
    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    await connectDB();
    const walletRequest = await WalletRequest.findById(requestId);
    if (!walletRequest) return NextResponse.json({ message: "Request not found" }, { status: 404 });
    if (walletRequest.status !== "pending") {
      return NextResponse.json({ message: "Request already processed" }, { status: 400 });
    }

    if (action === "approve") {
      const updatedAtc = await AtcUser.findByIdAndUpdate(walletRequest.atcId, {
        $inc: { walletBalance: walletRequest.amount },
      }, { new: true }).lean() as any;
      walletRequest.status = "approved";
      if (updatedAtc) {
        await WalletTransaction.create({
          atcId: updatedAtc._id,
          tpCode: updatedAtc.tpCode,
          type: "credit",
          amount: walletRequest.amount,
          reason: "Wallet request approved by admin",
        });
      }
    } else {
      walletRequest.status = "rejected";
    }

    await walletRequest.save();
    return NextResponse.json({ message: `Request ${action}d successfully`, request: walletRequest });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
