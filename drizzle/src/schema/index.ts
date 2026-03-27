import {
  mysqlTable,
  serial,
  varchar,
  decimal,
  boolean,
  timestamp,
  int,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable('users', {
  id:                serial('id').primaryKey(),
  name:              varchar('name', { length: 255 }).notNull(),
  email:             varchar('email', { length: 255 }).notNull().unique(),
  emailVerifiedAt:   timestamp('email_verified_at'),
  password:          varchar('password', { length: 255 }).notNull(),
  rememberToken:     varchar('remember_token', { length: 100 }),
  createdAt:         timestamp('created_at').defaultNow(),
  updatedAt:         timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ── Stations ─────────────────────────────────────────────────────────────────

export const stations = mysqlTable('stations', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  latitude:  decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  country:   varchar('country', { length: 100 }).notNull(),
  city:      varchar('city', { length: 100 }).notNull(),
  type:      mysqlEnum('type', ['air_quality', 'weather', 'emissions']).notNull(),
  isActive:  boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (t) => ({
  countryTypeIdx: index('country_type_idx').on(t.country, t.type),
  activeIdx:      index('active_idx').on(t.isActive),
}));

// ── Readings ─────────────────────────────────────────────────────────────────

export const readings = mysqlTable('readings', {
  id:          serial('id').primaryKey(),
  stationId:   int('station_id').notNull().references(() => stations.id, { onDelete: 'cascade' }),
  metric:      varchar('metric', { length: 50 }).notNull(),
  value:       decimal('value', { precision: 12, scale: 4 }).notNull(),
  unit:        varchar('unit', { length: 20 }).notNull(),
  recordedAt:  timestamp('recorded_at').notNull(),
  source:      varchar('source', { length: 100 }),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow().onUpdateNow(),
}, (t) => ({
  stationMetricTimeIdx: index('station_metric_time_idx').on(t.stationId, t.metric, t.recordedAt),
  uniqueReading:        uniqueIndex('unique_reading').on(t.stationId, t.metric, t.recordedAt, t.source),
}));

// ── Alerts ───────────────────────────────────────────────────────────────────

export const alerts = mysqlTable('alerts', {
  id:              serial('id').primaryKey(),
  userId:          int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stationId:       int('station_id').notNull().references(() => stations.id, { onDelete: 'cascade' }),
  metric:          varchar('metric', { length: 50 }).notNull(),
  operator:        mysqlEnum('operator', ['gt', 'lt', 'gte', 'lte', 'eq']).notNull(),
  threshold:       decimal('threshold', { precision: 12, scale: 4 }).notNull(),
  isActive:        boolean('is_active').default(true).notNull(),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow().onUpdateNow(),
}, (t) => ({
  userActiveIdx: index('user_active_idx').on(t.userId, t.isActive),
}));

// ── Relations ─────────────────────────────────────────────────────────────────

export const stationsRelations = relations(stations, ({ many }) => ({
  readings: many(readings),
  alerts:   many(alerts),
}));

export const readingsRelations = relations(readings, ({ one }) => ({
  station: one(stations, { fields: [readings.stationId], references: [stations.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  station: one(stations, { fields: [alerts.stationId], references: [stations.id] }),
  user:    one(users,    { fields: [alerts.userId],    references: [users.id] }),
}));