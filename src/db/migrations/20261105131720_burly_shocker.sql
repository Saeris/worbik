CREATE TABLE `scores` (
	`puzzle` text NOT NULL,
	`did` text NOT NULL,
	`handle` text,
	`moves` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`puzzle`, `did`)
);
--> statement-breakpoint
CREATE INDEX `scores_ranking` ON `scores` (`puzzle`,`moves`,`created_at`);