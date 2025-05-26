import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { InferModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  type: text("type", {
    enum: ["text", "number", "multiple-choice", "checkbox-multiple", "date"],
  }).notNull(),
  options: jsonb("options"),
  order: integer("order").notNull(),
  dependsOn: jsonb("depends_on"),
  placeholder: text("placeholder"),
  prefix: text("prefix"),
  suffix: text("suffix"),
  conditionalLogic: jsonb("conditional_logic"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  status: text("status").notNull().default("in-progress"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  signatureData: text("signature_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Answers table
export const answers = pgTable(
  "answers",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").references(() => sessions.id, {
      onDelete: "cascade",
    }),
    questionId: integer("question_id").references(() => questions.id, {
      onDelete: "cascade",
    }),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    sessionQuestionUnique: unique().on(table.sessionId, table.questionId),
  })
);

// Configs table
export const configs = pgTable("configs", {
  id: serial("id").primaryKey(),
  aiPrompt: text("ai_prompt"),
  aiModel: text("ai_model").default("gpt-4"),
  aiTemperature: text("ai_temperature").default("0.7"),
  emailTemplate: text("email_template"),
  emailRecipients: text("email_recipients"),
  excelTemplate: text("excel_template"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type User = InferModel<typeof users>;
export type Question = InferModel<typeof questions>;
export type Session = InferModel<typeof sessions>;
export type Answer = InferModel<typeof answers>;
export type Config = InferModel<typeof configs>;

// Insert Types
export type InsertUser = InferModel<typeof users, "insert">;
export type InsertQuestion = InferModel<typeof questions, "insert">;
export type InsertSession = InferModel<typeof sessions, "insert">;
export type InsertAnswer = InferModel<typeof answers, "insert">;
export type InsertConfig = InferModel<typeof configs, "insert">;

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertSessionSchema = createInsertSchema(sessions);
export const insertAnswerSchema = createInsertSchema(answers);
export const insertConfigSchema = createInsertSchema(configs);

export const selectUserSchema = createSelectSchema(users);
export const selectQuestionSchema = createSelectSchema(questions);
export const selectSessionSchema = createSelectSchema(sessions);
export const selectAnswerSchema = createSelectSchema(answers);
export const selectConfigSchema = createSelectSchema(configs);
