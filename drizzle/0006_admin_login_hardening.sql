CREATE TABLE "admin_login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"ip_address" varchar(128) NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_login_attempts_email_ip_unique" ON "admin_login_attempts" USING btree ("email","ip_address");--> statement-breakpoint
CREATE INDEX "admin_login_attempts_locked_until_idx" ON "admin_login_attempts" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "admin_login_attempts_updated_at_idx" ON "admin_login_attempts" USING btree ("updated_at");
