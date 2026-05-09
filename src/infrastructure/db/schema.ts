import { sql } from "drizzle-orm";
import {
  bigint,
  date,
  doublePrecision,
  index,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Enums de Postgres para columnas con valores discretos.
 */
export const exchangeEnum = pgEnum("exchange", ["BMV", "SIC"]);
export const tradeActionEnum = pgEnum("trade_action", ["BUY", "SELL", "DIVIDEND"]);
export const paperTradeActionEnum = pgEnum("paper_trade_action", ["BUY", "SELL"]);
export const currencyEnum = pgEnum("currency", ["MXN", "USD"]);
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);
export const tableDensityEnum = pgEnum("table_density", ["compact", "comfortable"]);
export const riskProfileEnum = pgEnum("risk_profile", ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]);
export const timeframeEnum = pgEnum("timeframe", ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"]);

/**
 * Espejo del usuario de Clerk.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Posiciones reales del usuario. Vista derivada de los trades.
 */
export const holdings = pgTable(
  "holdings",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    avgCostMxn: numeric("avg_cost_mxn", { precision: 20, scale: 4 }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTickerIdx: uniqueIndex("holdings_user_ticker_idx").on(t.userId, t.ticker, t.exchange),
    userIdx: index("holdings_user_idx").on(t.userId),
  }),
);

/**
 * Bitácora inmutable de trades reales. Fuente de verdad.
 */
export const trades = pgTable(
  "trades",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    action: tradeActionEnum("action").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    priceMxn: numeric("price_mxn", { precision: 20, scale: 4 }).notNull(),
    commissionMxn: numeric("commission_mxn", { precision: 20, scale: 4 }).notNull().default("0"),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userExecutedAtIdx: index("trades_user_executed_at_idx").on(t.userId, t.executedAt),
  }),
);

/**
 * Portafolio paper (simulado). Un solo registro por usuario en v1.
 */
export const paperPortfolios = pgTable("paper_portfolios", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Mi portafolio de práctica"),
  cashBalanceMxn: numeric("cash_balance_mxn", { precision: 20, scale: 2 })
    .notNull()
    .default("100000"),
  initialBalanceMxn: numeric("initial_balance_mxn", { precision: 20, scale: 2 })
    .notNull()
    .default("100000"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resetAt: timestamp("reset_at", { withTimezone: true }),
});

/**
 * Posiciones simuladas por portafolio paper.
 */
export const paperPositions = pgTable(
  "paper_positions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    paperPortfolioId: text("paper_portfolio_id")
      .notNull()
      .references(() => paperPortfolios.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    avgCostMxn: numeric("avg_cost_mxn", { precision: 20, scale: 4 }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    portfolioTickerIdx: uniqueIndex("paper_positions_portfolio_ticker_idx").on(
      t.paperPortfolioId,
      t.ticker,
      t.exchange,
    ),
  }),
);

/**
 * Trades simulados en el portafolio paper.
 */
export const paperTrades = pgTable(
  "paper_trades",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    paperPortfolioId: text("paper_portfolio_id")
      .notNull()
      .references(() => paperPortfolios.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    action: paperTradeActionEnum("action").notNull(),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    priceMxn: numeric("price_mxn", { precision: 20, scale: 4 }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    portfolioExecutedAtIdx: index("paper_trades_portfolio_executed_at_idx").on(
      t.paperPortfolioId,
      t.executedAt,
    ),
  }),
);

/**
 * Items del watchlist de un usuario.
 */
export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    alertPriceAbove: numeric("alert_price_above", { precision: 20, scale: 4 }),
    alertPriceBelow: numeric("alert_price_below", { precision: 20, scale: 4 }),
    notes: text("notes"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTickerIdx: uniqueIndex("watchlist_user_ticker_idx").on(t.userId, t.ticker, t.exchange),
  }),
);

/**
 * Preferencias del usuario, una fila por usuario (PK = userId).
 */
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayCurrency: currencyEnum("display_currency").notNull().default("MXN"),
  defaultTimeframe: timeframeEnum("default_timeframe").notNull().default("3M"),
  theme: themeEnum("theme").notNull().default("system"),
  tableDensity: tableDensityEnum("table_density").notNull().default("comfortable"),
  riskProfile: riskProfileEnum("risk_profile").notNull().default("MODERATE"),
  disclaimerAcceptedAt: timestamp("disclaimer_accepted_at", { withTimezone: true }),
});

/**
 * Cache de cotizaciones. TTL lógico de 10 min lo enforza CachedMarketDataProvider.
 */
export const quoteCache = pgTable(
  "quote_cache",
  {
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    priceUsd: numeric("price_usd", { precision: 20, scale: 4 }),
    priceMxn: numeric("price_mxn", { precision: 20, scale: 4 }).notNull(),
    openMxn: numeric("open_mxn", { precision: 20, scale: 4 }).notNull(),
    highMxn: numeric("high_mxn", { precision: 20, scale: 4 }).notNull(),
    lowMxn: numeric("low_mxn", { precision: 20, scale: 4 }).notNull(),
    volume: bigint("volume", { mode: "number" }).notNull(),
    asOf: timestamp("as_of", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ticker, t.exchange] }),
  }),
);

/**
 * Precios históricos OHLCV diarios. Cacheados para no golpear Yahoo en cada render.
 */
export const historicalPrice = pgTable(
  "historical_price",
  {
    ticker: text("ticker").notNull(),
    exchange: exchangeEnum("exchange").notNull(),
    date: date("date").notNull(),
    open: doublePrecision("open").notNull(),
    high: doublePrecision("high").notNull(),
    low: doublePrecision("low").notNull(),
    close: doublePrecision("close").notNull(),
    volume: bigint("volume", { mode: "number" }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ticker, t.exchange, t.date] }),
  }),
);

// Tipos inferidos
export type DbUser = typeof users.$inferSelect;
export type DbNewUser = typeof users.$inferInsert;
export type DbHolding = typeof holdings.$inferSelect;
export type DbNewHolding = typeof holdings.$inferInsert;
export type DbTrade = typeof trades.$inferSelect;
export type DbNewTrade = typeof trades.$inferInsert;
export type DbPaperPortfolio = typeof paperPortfolios.$inferSelect;
export type DbNewPaperPortfolio = typeof paperPortfolios.$inferInsert;
export type DbPaperPosition = typeof paperPositions.$inferSelect;
export type DbNewPaperPosition = typeof paperPositions.$inferInsert;
export type DbPaperTrade = typeof paperTrades.$inferSelect;
export type DbNewPaperTrade = typeof paperTrades.$inferInsert;
export type DbWatchlistItem = typeof watchlistItems.$inferSelect;
export type DbNewWatchlistItem = typeof watchlistItems.$inferInsert;
export type DbUserPreferences = typeof userPreferences.$inferSelect;
export type DbNewUserPreferences = typeof userPreferences.$inferInsert;
export type DbQuoteCache = typeof quoteCache.$inferSelect;
export type DbNewQuoteCache = typeof quoteCache.$inferInsert;
export type DbHistoricalPrice = typeof historicalPrice.$inferSelect;
export type DbNewHistoricalPrice = typeof historicalPrice.$inferInsert;
