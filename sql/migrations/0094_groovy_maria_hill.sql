ALTER TABLE "evidence_sources" DROP CONSTRAINT "evidence_sources_pmid_or_doi_check";--> statement-breakpoint
DROP INDEX "evidence_sources_pmid_unique_idx";--> statement-breakpoint
DROP INDEX "evidence_sources_doi_unique_idx";--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD CONSTRAINT "evidence_sources_pmid_or_doi_check" CHECK ((("pmid" IS NOT NULL AND "pmid" != '') OR ("doi" IS NOT NULL AND "doi" != '')));