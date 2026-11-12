CREATE TABLE "slot_holds" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slot_holds" ADD CONSTRAINT "slot_holds_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "slot_holds_room_slot" ON "slot_holds" USING btree ("room_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "slot_holds_token" ON "slot_holds" USING btree ("token");