import { index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

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
