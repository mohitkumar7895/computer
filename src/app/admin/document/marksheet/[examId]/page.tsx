"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminMarksheetPage() {
  const { examId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/documents/marksheet?examId=${examId}`)
      .then((res) => res.json())
      .then((d) => (d.data ? setData(d.data) : router.push("/admin/panel")))
      .catch(() => router.push("/admin/panel"));
  }, [examId, router]);

  if (!data) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <div className="mb-4 print:hidden flex gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 border rounded">Back</button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded">Print</button>
      </div>
      <div className="mx-auto w-[210mm] min-h-[297mm] border p-10 print:border-0">
        <h1 className="text-3xl font-bold text-center">Marksheet</h1>
        <div className="mt-8 grid grid-cols-2 text-sm gap-2">
          <p>Name: {data.studentId?.name}</p>
          <p>Enrollment: {data.enrollmentNo}</p>
          <p>Roll No: {data.rollNo}</p>
          <p>Course: {data.courseName}</p>
        </div>
        <table className="w-full mt-8 border">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Subject</th>
              <th className="p-2">Max</th>
              <th className="p-2">Obtained</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects?.map((s: any, i: number) => (
              <tr key={i} className="border-b">
                <td className="p-2">{s.subjectName}</td>
                <td className="p-2 text-center">{s.totalMarks}</td>
                <td className="p-2 text-center">{s.marksObtained}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
