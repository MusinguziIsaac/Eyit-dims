CREATE TABLE "password_resets" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"fullname" text NOT NULL,
	"username" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
