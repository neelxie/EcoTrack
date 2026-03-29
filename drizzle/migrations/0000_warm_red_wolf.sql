CREATE TABLE `alerts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`station_id` bigint unsigned NOT NULL,
	`metric` varchar(50) NOT NULL,
	`operator` enum('gt','lt','gte','lte','eq') NOT NULL,
	`threshold` decimal(12,4) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_triggered_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `readings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`station_id` bigint unsigned NOT NULL,
	`metric` varchar(50) NOT NULL,
	`value` decimal(12,4) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`recorded_at` timestamp NOT NULL,
	`source` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `readings_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_reading` UNIQUE(`station_id`,`metric`,`recorded_at`)
);
--> statement-breakpoint
CREATE TABLE `stations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`country` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`type` enum('air_quality','weather','emissions') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_station_id_stations_id_fk` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `readings` ADD CONSTRAINT `readings_station_id_stations_id_fk` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_active_idx` ON `alerts` (`user_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `station_metric_time_idx` ON `readings` (`station_id`,`metric`,`recorded_at`);--> statement-breakpoint
CREATE INDEX `country_type_idx` ON `stations` (`country`,`type`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `stations` (`is_active`);