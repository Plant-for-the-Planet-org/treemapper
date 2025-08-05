ALTER TABLE "species_request" DROP CONSTRAINT "valid_urgency";--> statement-breakpoint
ALTER TABLE "species_request" DROP CONSTRAINT "reviewed_status_has_reviewer";--> statement-breakpoint
ALTER TABLE "species_request" DROP CONSTRAINT "rejected_has_reason";--> statement-breakpoint
ALTER TABLE "species_request" DROP CONSTRAINT "approved_has_species";--> statement-breakpoint
ALTER TABLE "species_request" DROP CONSTRAINT "duplicate_has_reference";--> statement-breakpoint
ALTER TABLE "species_request" DROP CONSTRAINT "reviewed_at_after_created";--> statement-breakpoint
ALTER TABLE "species_request" DROP CONSTRAINT "scientific_name_format";