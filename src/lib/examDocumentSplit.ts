/**
 * Helpers for marksheet (Internal/External split) and certificate
 * "From ___" + "___ Duration" display lines.
 *
 * The marksheet layout has two pairs of columns: Internal (Obt | Max)
 * and External (Obt | Max). When the admin/result API hasn't supplied an
 * explicit split, we derive a deterministic ~30/70 weighting from the
 * subject's totals so the overlay always has clean numbers to print.
 */

export type MarksSplit = {
  internalObtained: number;
  internalMax: number;
  externalObtained: number;
  externalMax: number;
};

export function splitInternalExternal(obtained: number, totalMax: number): MarksSplit {
  const safeTotal = Math.max(1, Math.round(totalMax));
  const safeObt = Math.max(0, Math.min(Math.round(obtained), safeTotal));

  // ~30% internal max, capped so external still has at least 1 mark.
  let internalMax = Math.round(safeTotal * 0.3);
  internalMax = Math.max(1, Math.min(internalMax, safeTotal - 1));
  const externalMax = safeTotal - internalMax;

  // Distribute obtained marks proportionally and clamp.
  let externalObtained = Math.round((safeObt / safeTotal) * externalMax);
  externalObtained = Math.min(externalMax, Math.max(0, externalObtained));
  let internalObtained = safeObt - externalObtained;
  if (internalObtained > internalMax) {
    internalObtained = internalMax;
    externalObtained = safeObt - internalObtained;
  }
  if (externalObtained > externalMax) {
    externalObtained = externalMax;
    internalObtained = safeObt - externalObtained;
  }

  return {
    internalObtained: Math.max(0, internalObtained),
    internalMax,
    externalObtained: Math.max(0, externalObtained),
    externalMax,
  };
}

/** Format admission date → "APR-2025"-style label. Returns undefined if unparseable. */
export function formatCertificateFromLabel(admissionDate?: string | null): string | undefined {
  if (!admissionDate?.trim()) return undefined;
  const d = new Date(admissionDate.trim());
  if (Number.isNaN(d.getTime())) return undefined;
  const mon = d
    .toLocaleDateString("en-GB", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return `${mon}-${d.getFullYear()}`;
}

/** Fallback when no admission date — derives APR-{first session year}. */
export function formatFromSessionFallback(session?: string | null): string {
  const s = (session || "").trim();
  const y = s.split(/[-–]/)[0]?.trim();
  if (!y || !/^\d{4}$/.test(y)) return "";
  return `APR-${y}`;
}

/** "3 MONTHS" / "1 MONTH" — falls back to session label when months unknown. */
export function formatDurationMonths(months?: number | null, sessionFallback?: string | null): string {
  if (typeof months === "number" && months > 0) {
    return `${months} MONTH${months === 1 ? "" : "S"}`;
  }
  if (sessionFallback?.trim()) return sessionFallback.trim();
  return "";
}

/** Course subject (admin-defined) used as a template for the marksheet rows. */
export type CourseSubjectInput = {
  name: string;
  fullMarks: number;
  theoryMarks: number;
  practicalMarks: number;
};

/** Marksheet row produced for the printed marksheet. */
export type MarksheetRow = {
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  internalObtained: number;
  internalMax: number;
  externalObtained: number;
  externalMax: number;
};

export type BuiltMarksheet = {
  rows: MarksheetRow[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
};

/**
 * Build the marksheet's per-subject rows from the course's syllabus.
 *
 * The exam's overall percentage `obtained / max` is applied uniformly to each
 * subject, so the printed marksheet stays consistent with the score the
 * student actually achieved while still showing each course subject with its
 * configured Theory / Practical breakdown.
 *
 * If the course has no subjects defined, we fall back to a single
 * `splitInternalExternal` row using the exam totals — matches the legacy
 * behaviour for courses that haven't been migrated to the new flow yet.
 */
export function buildMarksheetFromCourse(
  examObtained: number,
  examMax: number,
  subjects: CourseSubjectInput[],
): BuiltMarksheet {
  if (!subjects || subjects.length === 0) {
    const safeMax = Math.max(1, Math.round(examMax || 0));
    const safeObt = Math.max(0, Math.min(Math.round(examObtained || 0), safeMax));
    const split = splitInternalExternal(safeObt, safeMax);
    return {
      rows: [
        {
          subjectName: "Course",
          marksObtained: safeObt,
          totalMarks: safeMax,
          ...split,
        },
      ],
      totalObtained: safeObt,
      totalMax: safeMax,
      percentage: Math.round((safeObt / safeMax) * 100),
    };
  }

  const pct =
    examMax > 0 ? Math.max(0, Math.min(1, (examObtained || 0) / examMax)) : 0;

  const rows: MarksheetRow[] = subjects.map((sub) => {
    const fullMarks = Math.max(0, Math.round(sub.fullMarks || 0));
    const internalMax = Math.max(0, Math.round(sub.practicalMarks || 0));
    const externalMax = Math.max(0, Math.round(sub.theoryMarks || 0));

    let internalObtained = Math.round(internalMax * pct);
    let externalObtained = Math.round(externalMax * pct);

    if (internalObtained > internalMax) internalObtained = internalMax;
    if (externalObtained > externalMax) externalObtained = externalMax;
    if (internalObtained < 0) internalObtained = 0;
    if (externalObtained < 0) externalObtained = 0;

    return {
      subjectName: sub.name,
      marksObtained: internalObtained + externalObtained,
      totalMarks: fullMarks,
      internalObtained,
      internalMax,
      externalObtained,
      externalMax,
    };
  });

  const totalObtained = rows.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = rows.reduce((sum, r) => sum + r.totalMarks, 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  return { rows, totalObtained, totalMax, percentage };
}

/** Letter grade from total percentage (marksheet legend style; &lt;50% maps to D like printed legend). */
export function gradeFromPercentage(pct: number): string {
  const p = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  if (p >= 85) return "S";
  if (p >= 75) return "A";
  if (p >= 65) return "B";
  if (p >= 55) return "C";
  if (p >= 50) return "D";
  return "D";
}
