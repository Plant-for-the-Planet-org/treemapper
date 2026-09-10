-- Monitoring plots no longer go through the approval board.
--
-- The board reviews claims about work done. A plot claims nothing: it is a
-- measured area someone walked, and its value is the measurements themselves,
-- which a reviewer has no way to judge. Plots that were gated under the old rule
-- would otherwise sit in a queue that no longer accepts them, wearing a review
-- badge that can never resolve.
--
-- Clearing review_status makes them published under publishedInterventionFilter
-- (null reads as never gated), which matches how the plots page has always
-- shown them: it never filtered on review state.
UPDATE "intervention"
SET "review_status" = NULL,
    "submitted_at" = NULL,
    "approved_at" = NULL,
    "approved_by_id" = NULL,
    "rejected_at" = NULL,
    "rejected_by_id" = NULL
WHERE "discriminator" = 'plot'
  AND "review_status" IS NOT NULL;
