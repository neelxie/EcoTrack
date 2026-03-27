import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { stations, readings, alerts, users } from "../schema";

export type User = InferSelectModel<typeof users>;
export type Station = InferSelectModel<typeof stations>;
export type NewStation = InferInsertModel<typeof stations>;
export type Reading = InferSelectModel<typeof readings>;
export type NewReading = InferInsertModel<typeof readings>;
export type Alert = InferSelectModel<typeof alerts>;
export type NewAlert = InferInsertModel<typeof alerts>;

export type StationType = "air_quality" | "weather" | "emissions";
export type AlertOperator = "gt" | "lt" | "gte" | "lte" | "eq";

export type ReadingSummary = {
  stationId: number;
  metric: string;
  unit: string;
  date: string;
  avg: number;
  min: number;
  max: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};
