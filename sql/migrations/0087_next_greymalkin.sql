CREATE TYPE "public"."target_tag_category" AS ENUM('epigenetics', 'metastasis', 'metabolism', 'inflammation', 'immune', 'hormone', 'neuro', 'recovery');--> statement-breakpoint
CREATE TABLE "target_tags" (
	"target_id" uuid NOT NULL,
	"tag_category" "target_tag_category" NOT NULL,
	"tag_value" text NOT NULL,
	CONSTRAINT "target_tags_target_id_tag_category_tag_value_pk" PRIMARY KEY("target_id","tag_category","tag_value")
);
--> statement-breakpoint
ALTER TABLE "target_tags" ADD CONSTRAINT "target_tags_target_id_natural_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."natural_targets"("id") ON DELETE cascade ON UPDATE no action;