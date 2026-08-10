CREATE TABLE "user_device" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"device_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"one_signal_id" text,
	"device_os" text,
	"device_name" text,
	"device_model" text,
	"os_version" text,
	"app_version" text,
	"locale" text,
	"timezone" text,
	"notification_permission" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_device_uid_unique" UNIQUE("uid"),
	CONSTRAINT "user_device_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "user_device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_device_user_idx" ON "user_device" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_device_one_signal_idx" ON "user_device" USING btree ("one_signal_id") WHERE one_signal_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "user_device_last_active_idx" ON "user_device" USING btree ("last_active_at");