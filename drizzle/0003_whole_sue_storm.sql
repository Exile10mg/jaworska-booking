CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_date" varchar(10) NOT NULL,
	"slot_time" varchar(5) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "availability_slots_date_time_unique" ON "availability_slots" USING btree ("slot_date","slot_time");--> statement-breakpoint
CREATE INDEX "availability_slots_date_idx" ON "availability_slots" USING btree ("slot_date");--> statement-breakpoint
CREATE INDEX "availability_slots_created_at_idx" ON "availability_slots" USING btree ("created_at");