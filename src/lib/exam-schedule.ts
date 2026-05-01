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
    const dateRaw = typeof exam.examDate === "string"
      ? exam.examDate.slice(0, 10)
      : `${exam.examDate.getFullYear()}-${String(exam.examDate.getMonth() + 1).padStart(2, "0")}-${String(exam.examDate.getDate()).padStart(2, "0")}`;

    const timeRaw = String(exam.examTime).trim();
    let hh = 0;
    let mm = 0;
    const ampmMatch = timeRaw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const twentyFourMatch = timeRaw.match(/^(\d{1,2}):(\d{2})$/);

    if (ampmMatch) {
      hh = Number(ampmMatch[1]);
      mm = Number(ampmMatch[2]);
      const meridiem = ampmMatch[3].toUpperCase();
      if (meridiem === "PM" && hh < 12) hh += 12;
      if (meridiem === "AM" && hh === 12) hh = 0;
    } else if (twentyFourMatch) {
      hh = Number(twentyFourMatch[1]);
      mm = Number(twentyFourMatch[2]);
    } else {
      // Keep old fallback behavior for unexpected formats.
      const fallback = timeRaw.slice(0, 5);
      const parsed = new Date(`${dateRaw}T${fallback}:00`);
      startsAt = Number.isNaN(parsed.getTime()) ? null : parsed;
      if (startsAt) {
        const duration = Math.max(1, Number(exam.durationMinutes ?? 0) || 0);
        const endsAt = new Date(startsAt.getTime() + duration * 60_000);
        return { startsAt, endsAt, now };
      }
    }

    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      const parsed = new Date(`${dateRaw}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`);
      startsAt = Number.isNaN(parsed.getTime()) ? null : parsed;
    }
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

