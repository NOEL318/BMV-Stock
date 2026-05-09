CREATE TYPE "public"."currency" AS ENUM('MXN', 'USD');--> statement-breakpoint
CREATE TYPE "public"."exchange" AS ENUM('BMV', 'SIC');--> statement-breakpoint
CREATE TYPE "public"."paper_trade_action" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TYPE "public"."risk_profile" AS ENUM('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');--> statement-breakpoint
CREATE TYPE "public"."table_density" AS ENUM('compact', 'comfortable');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."timeframe" AS ENUM('1D', '5D', '1M', '3M', '6M', '1Y', '5Y');--> statement-breakpoint
CREATE TYPE "public"."trade_action" AS ENUM('BUY', 'SELL', 'DIVIDEND');--> statement-breakpoint
CREATE TABLE "historical_price" (
	"ticker" text NOT NULL,
	"exchange" "exchange" NOT NULL,
	"date" date NOT NULL,
	"open" double precision NOT NULL,
	"high" double precision NOT NULL,
	"low" double precision NOT NULL,
	"close" double precision NOT NULL,
	"volume" bigint NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "historical_price_ticker_exchange_date_pk" PRIMARY KEY("ticker","exchange","date")
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"ticker" text NOT NULL,
	"exchange" "exchange" NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"avg_cost_mxn" numeric(20, 4) NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paper_portfolios" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Mi portafolio de práctica' NOT NULL,
	"cash_balance_mxn" numeric(20, 2) DEFAULT '100000' NOT NULL,
	"initial_balance_mxn" numeric(20, 2) DEFAULT '100000' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reset_at" timestamp with time zone,
	CONSTRAINT "paper_portfolios_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "paper_positions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"paper_portfolio_id" text NOT NULL,
	"ticker" text NOT NULL,
	"exchange" "exchange" NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"avg_cost_mxn" numeric(20, 4) NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paper_trades" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"paper_portfolio_id" text NOT NULL,
	"ticker" text NOT NULL,
	"exchange" "exchange" NOT NULL,
	"action" "paper_trade_action" NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"price_mxn" numeric(20, 4) NOT NULL,
	"executed_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_cache" (
	"ticker" text NOT NULL,
	"exchange" "exchange" NOT NULL,
	"price_usd" numeric(20, 4),
	"price_mxn" numeric(20, 4) NOT NULL,
	"open_mxn" numeric(20, 4) NOT NULL,
	"high_mxn" numeric(20, 4) NOT NULL,
	"low_mxn" numeric(20, 4) NOT NULL,
	"volume" bigint NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_cache_ticker_exchange_pk" PRIMARY KEY("ticker","exchange")
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"ticker" text NOT NULL,
	"exchange" "exchange" NOT NULL,
	"action" "trade_action" NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"price_mxn" numeric(20, 4) NOT NULL,
	"commission_mxn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"executed_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_currency" "currency" DEFAULT 'MXN' NOT NULL,
	"default_timeframe" timeframe DEFAULT '3M' NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"table_density" "table_density" DEFAULT 'comfortable' NOT NULL,
	"risk_profile" "risk_profile" DEFAULT 'MODERATE' NOT NULL,
	"disclaimer_accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" text NOT NULL,
	"ticker" text NOT NULL,
	"exchange" "exchange" NOT NULL,
	"alert_price_above" numeric(20, 4),
	"alert_price_below" numeric(20, 4),
	"notes" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_portfolios" ADD CONSTRAINT "paper_portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_positions" ADD CONSTRAINT "paper_positions_paper_portfolio_id_paper_portfolios_id_fk" FOREIGN KEY ("paper_portfolio_id") REFERENCES "public"."paper_portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_trades" ADD CONSTRAINT "paper_trades_paper_portfolio_id_paper_portfolios_id_fk" FOREIGN KEY ("paper_portfolio_id") REFERENCES "public"."paper_portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "holdings_user_ticker_idx" ON "holdings" USING btree ("user_id","ticker","exchange");--> statement-breakpoint
CREATE INDEX "holdings_user_idx" ON "holdings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paper_positions_portfolio_ticker_idx" ON "paper_positions" USING btree ("paper_portfolio_id","ticker","exchange");--> statement-breakpoint
CREATE INDEX "paper_trades_portfolio_executed_at_idx" ON "paper_trades" USING btree ("paper_portfolio_id","executed_at");--> statement-breakpoint
CREATE INDEX "trades_user_executed_at_idx" ON "trades" USING btree ("user_id","executed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_user_ticker_idx" ON "watchlist_items" USING btree ("user_id","ticker","exchange");