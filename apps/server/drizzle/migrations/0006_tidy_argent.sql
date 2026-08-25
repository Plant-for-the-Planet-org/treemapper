ALTER TABLE "form" DROP CONSTRAINT "form_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "intervention" DROP CONSTRAINT "intervention_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "plot_group" DROP CONSTRAINT "plot_group_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_api_key" DROP CONSTRAINT "project_api_key_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_invite" DROP CONSTRAINT "project_invite_invited_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_species" DROP CONSTRAINT "project_species_added_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "review_comment" DROP CONSTRAINT "review_comment_author_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "site" DROP CONSTRAINT "site_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tree" DROP CONSTRAINT "tree_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tree_record" DROP CONSTRAINT "tree_record_recorded_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_group" ADD CONSTRAINT "plot_group_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_api_key" ADD CONSTRAINT "project_api_key_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invite" ADD CONSTRAINT "project_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_species" ADD CONSTRAINT "project_species_added_by_id_user_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_record" ADD CONSTRAINT "tree_record_recorded_by_id_user_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;