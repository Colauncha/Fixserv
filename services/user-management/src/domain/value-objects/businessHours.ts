export type Day =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayHours = {
  open: string;
  close: string;
};

export type BusinessHoursSchedule = Record<Day, DayHours>;

const DEFAULT_OPEN: DayHours = { open: "09:00", close: "17:00" };
const DEFAULT_CLOSED: DayHours = { open: "closed", close: "closed" };

// ── Helper: normalise whatever comes in for a single day ─────────────
// Accepts: undefined | null | string "09:00-17:00" | { open, close }
function normaliseDay(value: any, fallback: DayHours): DayHours {
  if (!value) return fallback;

  // Legacy string format "09:00-17:00" or "09:00- 17:00"
  if (typeof value === "string") {
    if (value.toLowerCase() === "closed") {
      return DEFAULT_CLOSED;
    }
    const [open, close] = value.split("-").map((s: string) => s.trim());
    return open && close ? { open, close } : fallback;
  }

  // Object format { open, close }
  if (typeof value === "object" && value.open !== undefined) {
    return { open: value.open, close: value.close };
  }

  return fallback;
}

export class BusinessHours {
  private readonly _schedule: BusinessHoursSchedule;

  constructor(
    schedule: Partial<BusinessHoursSchedule> | Record<string, any> = {},
  ) {
    this._schedule = {
      monday: normaliseDay(schedule.monday, DEFAULT_OPEN),
      tuesday: normaliseDay(schedule.tuesday, DEFAULT_OPEN),
      wednesday: normaliseDay(schedule.wednesday, DEFAULT_OPEN),
      thursday: normaliseDay(schedule.thursday, DEFAULT_OPEN),
      friday: normaliseDay(schedule.friday, DEFAULT_OPEN),
      saturday: normaliseDay(schedule.saturday, DEFAULT_CLOSED),
      sunday: normaliseDay(schedule.sunday, DEFAULT_CLOSED),
    };
  }
  isOpen(day: Day, time: string): boolean {
    const hours = this._schedule[day];
    if (hours.open === "closed") return false;
    return time >= hours.open && time <= hours.close;
  }

  // get schedule(): Record<Day, string> {
  //   return Object.entries(this._schedule).reduce((acc, [day, hours]) => {
  //     acc[day as Day] = `${hours.open}- ${hours.close}`;
  //     return acc;
  //   }, {} as Record<Day, string>);
  // }

  get schedule(): BusinessHoursSchedule {
    return { ...this._schedule };
  }

  toJSON(): BusinessHoursSchedule {
    return this._schedule;
  }

  // ✅ Deserialize from JSON (used in fromJSON of UserAggregate)
  static fromJSON(
    schedule: BusinessHoursSchedule | Record<string, any>,
  ): BusinessHours {
    //  return new BusinessHours(schedule);
    // Handle case where days might be stored as "09:00- 17:00" strings
    // const normalized = Object.entries(schedule).reduce(
    //   (acc, [day, value]: [string, DayHours | string]) => {
    //     if (typeof value === "string") {
    //       const [open, close] = value.split("-").map((s: string) => s.//trim());
    //       acc[day as Day] = { open, close };
    //     } else {
    //       acc[day as Day] = value;
    //     }
    //     return acc;
    //   },
    //   {} as BusinessHoursSchedule,
    // );

    // return new BusinessHours(normalized);
    return new BusinessHours(schedule);
  }
}
