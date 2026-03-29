import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

export const paymentMethodEnum = pgEnum("payment_method", ["cash_on_site"]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceId: varchar("service_id", { length: 120 }).notNull(),
    serviceName: text("service_name").notNull(),
    price: integer("price"),
    appointmentDate: varchar("appointment_date", { length: 10 }).notNull(),
    appointmentTime: varchar("appointment_time", { length: 5 }).notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    notes: text("notes").notNull().default(""),
    status: bookingStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("cash_on_site"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bookings_appointment_idx").on(
      table.appointmentDate,
      table.appointmentTime,
    ),
    index("bookings_created_at_idx").on(table.createdAt),
  ],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_users_email_unique").on(table.email),
    index("admin_users_created_at_idx").on(table.createdAt),
  ],
);

export const services = pgTable(
  "services",
  {
    id: varchar("id", { length: 120 }).primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    duration: integer("duration").notNull(),
    isFixedPrice: boolean("is_fixed_price").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("services_active_sort_idx").on(table.isActive, table.sortOrder),
    index("services_created_at_idx").on(table.createdAt),
  ],
);

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slotDate: varchar("slot_date", { length: 10 }).notNull(),
    slotTime: varchar("slot_time", { length: 5 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("availability_slots_date_time_unique").on(
      table.slotDate,
      table.slotTime,
    ),
    index("availability_slots_date_idx").on(table.slotDate),
    index("availability_slots_created_at_idx").on(table.createdAt),
  ],
);
