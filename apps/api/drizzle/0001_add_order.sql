ALTER TABLE `folders` ADD `order` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `order` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
-- Backfill: assign order within each (user_id, parent_id) group by created_at ASC
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (
           PARTITION BY user_id, COALESCE(parent_id, '__root__')
           ORDER BY created_at ASC
         ) - 1) AS new_order
  FROM folders
)
UPDATE folders SET `order` = (SELECT new_order FROM ranked WHERE ranked.id = folders.id);
--> statement-breakpoint
-- Backfill: assign order within each (user_id, folder_id) group by created_at ASC
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (
           PARTITION BY user_id, COALESCE(folder_id, '__root__')
           ORDER BY created_at ASC
         ) - 1) AS new_order
  FROM bookmarks
)
UPDATE bookmarks SET `order` = (SELECT new_order FROM ranked WHERE ranked.id = bookmarks.id);
