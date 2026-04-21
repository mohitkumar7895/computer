"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AtcCertificatePage() {
  const { examId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/atc/documents/certificate?examId=${examId}`)
      .then((res) => res.json())
      .then((d) => (d.data ? setData(d.data) : router.push("/atc/dashboard")))
      .catch(() => router.push("/atc/dashboard"));
  }, [examId, router]);

  if (!data) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <div className="mb-4 print:hidden flex gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 border rounded">Back</button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded">Print</button>
      </div>
      <div className="mx-auto w-[210mm] min-h-[297mm] border p-10 print:border-0">
        <h1 className="text-3xl font-bold text-center">Certificate</h1>
        <p className="mt-10 text-center">This certifies that</p>
        <p className="text-center text-4xl font-bold mt-4">{data.studentId?.name}</p>
        <p className="mt-6 text-center">has successfully completed</p>
        <p className="text-center text-2xl font-semibold mt-2">{data.courseName}</p>
      </div>
    </div>
  );
}
