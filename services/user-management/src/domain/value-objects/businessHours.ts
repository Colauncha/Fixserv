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

export class BusinessHours {
  private readonly _schedule: BusinessHoursSchedule;

  constructor(schedule: Partial<BusinessHoursSchedule>) {
    const defaultHours: DayHours = { open: "09:00", close: "17:00" };

    this._schedule = {
      monday: schedule.monday || defaultHours,
      tuesday: schedule.tuesday || defaultHours,
      wednesday: schedule.wednesday || defaultHours,
      thursday: schedule.thursday || defaultHours,
      friday: schedule.friday || defaultHours,
      saturday: schedule.saturday || { open: "closed", close: "closed" },
      sunday: schedule.sunday || { open: "closed", close: "closed" },
    };
  }
  isOpen(day: Day, time: string): boolean {
    const hours = this._schedule[day];
    if (hours.open === "closed") return false;
    return time >= hours.open && time <= hours.close;
  }

  get schedule(): Record<Day, string> {
    return Object.entries(this._schedule).reduce((acc, [day, hours]) => {
      acc[day as Day] = `${hours.open}- ${hours.close}`;
      return acc;
    }, {} as Record<Day, string>);
  }
}
