ALTER TABLE "bookings"
ADD COLUMN "reminder_sms_sid" text;

ALTER TABLE "bookings"
ADD COLUMN "reminder_scheduled_for" timestamp with time zone;

CREATE INDEX "bookings_reminder_scheduled_for_idx"
ON "bookings" USING btree ("reminder_scheduled_for");
