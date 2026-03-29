CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash_on_site');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(120) NOT NULL,
	"service_name" text NOT NULL,
	"price" integer,
	"appointment_date" varchar(10) NOT NULL,
	"appointment_time" varchar(5) NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cash_on_site' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bookings_appointment_idx" ON "bookings" USING btree ("appointment_date","appointment_time");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");