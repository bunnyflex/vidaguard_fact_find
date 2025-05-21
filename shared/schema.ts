import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  clerkId: text("clerk_id").notNull().unique(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Question model for fact find
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  type: text("type").notNull(), // text, date, multiple-choice, yes/no, number
  order: integer("order").notNull(),
  options: jsonb("options"), // For multiple choice questions
  placeholder: text("placeholder"), // Placeholder text for input fields
  prefix: text("prefix"), // Currency symbol or other prefix
  suffix: text("suffix"), // Units or other suffix
  dependsOn: jsonb("depends_on"), // For conditional questions
  conditionalLogic: jsonb("conditional_logic"), // JSON for conditional branching
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Session model to track fact-finding progress
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  pdfUrl: text("pdf_url"),
  signatureData: text("signature_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

// Answer model to store responses
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
});

// Config model for application settings
export const configs = pgTable("configs", {
  id: serial("id").primaryKey(),
  aiPrompt: text("ai_prompt"),
  aiModel: text("ai_model").default("gpt-4o"),
  aiTemperature: text("ai_temperature").default("0.7"),
  emailTemplate: text("email_template"),
  emailRecipients: text("email_recipients"),
  excelTemplate: text("excel_template"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConfigSchema = createInsertSchema(configs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions for schema
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type Config = typeof configs.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;
