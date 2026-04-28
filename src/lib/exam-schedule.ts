export type ExamLifecycleStatus = "upcoming" | "active" | "completed";

type ExamLike = {
  examDate?: string | Date | null;
  examTime?: string | null;
  examDateTime?: string | Date | null;
  durationMinutes?: number | null;
  status?: string | null;
};

export type ExamWindow = {
  startsAt: Date | null;
  endsAt: Date | null;
  now: Date;
};

export function buildExamWindow(exam: ExamLike, now = new Date()): ExamWindow {
  let startsAt: Date | null = null;
  // Prefer explicit date + time entered by admin (local wall-clock intent).
  // examDateTime can be shifted when created on UTC servers.
  if (exam.examDate && exam.examTime) {
    // Build local datetime directly from provided date + time (avoid UTC date shift).
    const dateSource = new Date(exam.examDate);
    const y = dateSource.getFullYear();
    const m = String(dateSource.getMonth() + 1).padStart(2, "0");
    const d = String(dateSource.getDate()).padStart(2, "0");
    const hhmm = String(exam.examTime).slice(0, 5);
    const parsed = new Date(`${y}-${m}-${d}T${hhmm}:00`);
    const dObj = Number.isNaN(parsed.getTime()) ? null : parsed;
    startsAt = dObj;
  } else if (exam.examDateTime) {
    startsAt = new Date(exam.examDateTime);
  } else if (exam.examDate) {
    const d = new Date(exam.examDate);
    startsAt = Number.isNaN(d.getTime()) ? null : d;
  }
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return { startsAt: null, endsAt: null, now };
  }

  const duration = Math.max(1, Number(exam.durationMinutes ?? 0) || 0);
  const endsAt = new Date(startsAt.getTime() + duration * 60_000);
  return { startsAt, endsAt, now };
}

export function lifecycleStatusForExam(exam: ExamLike, now = new Date()): ExamLifecycleStatus {
  if (exam.status === "completed") return "completed";
  // Backward compatibility: old approved online exams had no schedule fields.
  // If no usable schedule exists, treat as active so students can still attempt.
  if (!exam.examDateTime && !exam.examDate) return "active";
  const { startsAt, endsAt } = buildExamWindow(exam, now);
  if (!startsAt || !endsAt) return "upcoming";
  if (now < startsAt) return "upcoming";
  if (now >= startsAt && now <= endsAt) return "active";
  return "completed";
}

export function msUntil(value: Date | null, now = new Date()): number {
  if (!value) return 0;
  return value.getTime() - now.getTime();
}

export function isWithinCountdownWindow(exam: ExamLike, now = new Date()): boolean {
  const { startsAt } = buildExamWindow(exam, now);
  if (!startsAt) return false;
  const diff = msUntil(startsAt, now);
  return diff > 0 && diff <= 60 * 60_000;
}

