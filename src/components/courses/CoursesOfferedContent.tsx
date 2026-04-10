import { courses } from "@/data/courses";

export default function CoursesOfferedContent() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <h2 className="text-2xl font-extrabold text-slate-800 sm:text-4xl lg:text-5xl">Courses Offered</h2>

      <div className="mt-5 overflow-x-auto border border-slate-300 bg-white">
        <table className="w-full min-w-180 border-collapse text-left">
          <thead className="bg-[#f1f1f1] text-slate-700">
            <tr>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Code</th>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Course Name</th>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Modules</th>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Enqiry</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {courses.map((course, index) => (
              <tr key={course.title} className="align-top">
                <td className="border border-slate-300 px-4 py-3 font-medium">YC-{(index + 1).toString().padStart(2, "0")}</td>
                <td className="border border-slate-300 px-4 py-3 font-semibold">{course.title}</td>
                <td className="border border-slate-300 px-4 py-3 text-slate-600">{course.description}</td>
                <td className="border border-slate-300 px-4 py-3">
                  <button
                    type="button"
                    className="rounded-sm bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Enquiry
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
