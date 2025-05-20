import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';

import * as schema from '../shared/schema';
import { users, questions, sessions, answers, configs } from '../shared/schema';
import { type User, type InsertUser, type Question, type InsertQuestion, 
         type Session, type InsertSession, type Answer, type InsertAnswer, 
         type Config, type InsertConfig } from '../shared/schema';
import { IStorage } from './storage';

/**
 * Supabase implementation of storage interface
 */
export class SupabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    const sql = neon(connectionString);
    this.db = drizzle(sql, { schema });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  // Question operations
  async getQuestions(): Promise<Question[]> {
    return await this.db.select().from(questions).orderBy(questions.order);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const result = await this.db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return result[0];
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const result = await this.db.insert(questions).values(question).returning();
    return result[0];
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const result = await this.db
      .update(questions)
      .set({ ...question, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return result[0];
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await this.db.delete(questions).where(eq(questions.id, id)).returning();
    return result.length > 0;
  }

  // Session operations
  async getSessions(): Promise<Session[]> {
    return await this.db.select().from(sessions).orderBy(sessions.createdAt, 'desc');
  }

  async getSession(id: number): Promise<Session | undefined> {
    const result = await this.db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return result[0];
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(sessions.createdAt, 'desc');
  }

  async createSession(session: InsertSession): Promise<Session> {
    const result = await this.db.insert(sessions).values(session).returning();
    return result[0];
  }

  async updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined> {
    const result = await this.db
      .update(sessions)
      .set(session)
      .where(eq(sessions.id, id))
      .returning();
    return result[0];
  }

  // Answer operations
  async getSessionAnswers(sessionId: number): Promise<Answer[]> {
    return await this.db
      .select()
      .from(answers)
      .where(eq(answers.sessionId, sessionId));
  }

  async getAnswer(id: number): Promise<Answer | undefined> {
    const result = await this.db.select().from(answers).where(eq(answers.id, id)).limit(1);
    return result[0];
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const result = await this.db.insert(answers).values(answer).returning();
    return result[0];
  }

  async updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer | undefined> {
    const result = await this.db
      .update(answers)
      .set(answer)
      .where(eq(answers.id, id))
      .returning();
    return result[0];
  }

  // Config operations
  async getConfig(): Promise<Config | undefined> {
    const result = await this.db.select().from(configs).limit(1);
    return result[0];
  }

  async updateConfig(config: Partial<InsertConfig>): Promise<Config | undefined> {
    // Check if config exists first
    const existingConfig = await this.getConfig();
    
    if (existingConfig) {
      // Update existing config
      const result = await this.db
        .update(configs)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(configs.id, existingConfig.id))
        .returning();
      return result[0];
    } else {
      // Create initial config with ID 1
      const result = await this.db
        .insert(configs)
        .values({
          id: 1,
          aiPrompt: "You are an insurance assistant helping collect fact-find information. Be polite, clear, and concise. Ask one question at a time and wait for the user's response before continuing. Use the user's name when appropriate. If the user seems confused, offer clarification. For yes/no questions, present them as clear choices.",
          aiModel: "gpt-4o",
          aiTemperature: "0.7",
          emailTemplate: "",
          emailRecipients: "",
          excelTemplate: "",
          ...config,
        })
        .returning();
      return result[0];
    }
  }
}