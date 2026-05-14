import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { getAuthUser } from "@/utils/auth";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "atc") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all-time";

  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "monthly") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "yearly") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (period === "all-time") {
      startDate = new Date(0);
    }

    const students = await AtcStudent.find({ tpCode: user.tpCode })
      .select("enrollmentNo name fatherName course status createdAt totalFee paidAmount duesAmount admissionDate mobile")
      .lean();

    const periodStudents = students.filter(s => {
      const createdDate = s.createdAt ? new Date(s.createdAt) : new Date(0);
      return createdDate >= startDate;
    });

    if (periodStudents.length === 0) {
      return new NextResponse("No data found for the selected period", { status: 404 });
    }

    // Prepare CSV data
    const headers = [
      "Enrollment No",
      "Student Name",
      "Father's Name",
      "Mobile",
      "Course",
      "Admission Date",
      "Status",
      "Total Fee",
      "Paid Amount",
      "Dues Amount"
    ];

    const rows = periodStudents.map(s => {
      const total = Number(s.totalFee || 0);
      const dues = Number(s.duesAmount || 0);
      const paid = s.paidAmount !== undefined ? Number(s.paidAmount) : Math.max(0, total - dues);

      return [
        `"${s.enrollmentNo || 'N/A'}"`,
        `"${s.name || ''}"`,
        `"${s.fatherName || ''}"`,
        `"${s.mobile || ''}"`,
        `"${s.course || ''}"`,
        `"${s.admissionDate || new Date(s.createdAt).toLocaleDateString('en-IN')}"`,
        `"${s.status || ''}"`,
        `"${total}"`,
        `"${paid}"`,
        `"${dues}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="atc_report_${period}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[api/atc/reports/export]", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
