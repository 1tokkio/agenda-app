ALTER TABLE "staff_users" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_username_unique" UNIQUE("username");