CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	CONSTRAINT "blocks_valid_range" CHECK ("blocks"."ends_at" > "blocks"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"target_company_id" text NOT NULL,
	"title" text NOT NULL,
	"requester_name" text NOT NULL,
	"requester_company" text NOT NULL,
	"requester_email" text NOT NULL,
	"guest_email" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_status_valid" CHECK ("bookings"."status" in ('confirmed', 'cancelled')),
	CONSTRAINT "bookings_valid_range" CHECK ("bookings"."ends_at" > "bookings"."starts_at"),
	CONSTRAINT "bookings_title_length" CHECK (length("bookings"."title") between 3 and 120)
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"logo_url" text
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company_id" text NOT NULL,
	CONSTRAINT "staff_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_target_company_id_companies_id_fk" FOREIGN KEY ("target_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blocks_room_slot" ON "blocks" USING btree ("room_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_room_slot_confirmed" ON "bookings" USING btree ("room_id","starts_at") WHERE "bookings"."status" = 'confirmed';--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_company_slot_confirmed" ON "bookings" USING btree ("target_company_id","starts_at") WHERE "bookings"."status" = 'confirmed';