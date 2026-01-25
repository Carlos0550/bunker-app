export type Period = "today" | "yesterday" | "week" | "month" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}
