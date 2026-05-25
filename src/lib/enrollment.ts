import { prisma } from "@/lib/prisma";

export const MAX_UNITS = 24;

export interface ScheduleSpan {
  day: string;
  startTime: string;
  endTime: string;
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function schedulesOverlap(a: ScheduleSpan, b: ScheduleSpan): boolean {
  if (a.day !== b.day) return false;
  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

export async function checkEnrollmentRules(opts: {
  studentId: string;
  sectionId: string;
}) {
  const section = await prisma.section.findUnique({
    where: { id: opts.sectionId },
    include: {
      schedules: true,
      subject: { include: { prerequisites: { select: { prerequisiteId: true } } } },
      semester: true,
    },
  });
  if (!section) return { ok: false, reason: "Section not found" };

  // capacity / waitlist
  if (section.enrolled >= section.capacity) {
    return { ok: true, waitlist: true, section };
  }

  // existing enrollments this semester
  const existing = await prisma.enrollment.findMany({
    where: {
      studentId: opts.studentId,
      semesterId: section.semesterId,
      status: { in: ["PENDING", "APPROVED", "WAITLISTED"] },
    },
    include: {
      section: {
        include: { subject: true, schedules: true },
      },
    },
  });

  // duplicate subject
  if (existing.some((e) => e.section.subjectId === section.subjectId)) {
    return { ok: false, reason: "Already enrolled in this subject" };
  }

  // schedule conflict
  for (const e of existing) {
    for (const s1 of e.section.schedules) {
      for (const s2 of section.schedules) {
        if (schedulesOverlap(s1, s2)) {
          return {
            ok: false,
            reason: `Schedule conflict with ${e.section.subject.code}`,
          };
        }
      }
    }
  }

  // unit limit
  const enrolledUnits = existing.reduce(
    (sum, e) => sum + ((e.section as { subject: { units: number } }).subject.units ?? 0),
    0,
  );
  if (enrolledUnits + section.subject.units > MAX_UNITS) {
    return {
      ok: false,
      reason: `Exceeds max units per semester (${MAX_UNITS})`,
    };
  }

  // prerequisites: must have a COMPLETED enrollment with passing grade
  const prereqIds = section.subject.prerequisites.map((p) => p.prerequisiteId);
  if (prereqIds.length) {
    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: opts.studentId,
        status: "COMPLETED",
        section: { subjectId: { in: prereqIds } },
      },
      include: { grade: true, section: { select: { subjectId: true } } },
    });
    const passedIds = new Set(
      completedEnrollments
        .filter((e) => (e.grade?.finalGrade ?? 0) >= 75)
        .map((e) => e.section.subjectId),
    );
    const missing = prereqIds.filter((id) => !passedIds.has(id));
    if (missing.length) {
      return {
        ok: false,
        reason: `Missing prerequisite(s)`,
        missingPrereqs: missing,
      };
    }
  }

  return { ok: true, waitlist: false, section };
}
