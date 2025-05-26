import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Create Postgres client
const queryClient = postgres(process.env.DATABASE_URL);

// Create Drizzle client
export const db = drizzle(queryClient, { schema });

// Run migrations
export async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}

// Helper function to get user by Clerk ID
export async function getUserByClerkId(clerkId: string) {
  const result = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkId, clerkId));
  return result[0] || null;
}

// Helper function to create user
export async function createUser(data: schema.InsertUser) {
  const result = await db.insert(schema.users).values(data).returning();
  return result[0];
}

// Helper function to get questions
export async function getQuestions() {
  return await db
    .select()
    .from(schema.questions)
    .orderBy(schema.questions.order);
}

// Helper function to create session
export async function createSession(userId: number) {
  const result = await db
    .insert(schema.sessions)
    .values({ userId })
    .returning();
  return result[0];
}

// Helper function to save answer
export async function saveAnswer(data: schema.InsertAnswer) {
  const result = await db.insert(schema.answers).values(data).returning();
  return result[0];
}

// Helper function to get session answers
export async function getSessionAnswers(sessionId: number) {
  return await db
    .select({
      answer: schema.answers,
      question: schema.questions,
    })
    .from(schema.answers)
    .innerJoin(
      schema.questions,
      eq(schema.answers.questionId, schema.questions.id)
    )
    .where(eq(schema.answers.sessionId, sessionId))
    .orderBy(schema.questions.order);
}

// Helper function to update session
export async function updateSession(id: number, data: Partial<schema.Session>) {
  const result = await db
    .update(schema.sessions)
    .set(data)
    .where(eq(schema.sessions.id, id))
    .returning();
  return result[0];
}
