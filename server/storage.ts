import { users, questions, sessions, answers, configs, type User, type InsertUser, type Question, type InsertQuestion, type Session, type InsertSession, type Answer, type InsertAnswer, type Config, type InsertConfig } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByClerkId(clerkId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Question operations
  getQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;

  // Session operations
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  getUserSessions(userId: number): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined>;

  // Answer operations
  getSessionAnswers(sessionId: number): Promise<Answer[]>;
  getAnswer(id: number): Promise<Answer | undefined>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer | undefined>;

  // Config operations
  getConfig(): Promise<Config | undefined>;
  updateConfig(config: Partial<InsertConfig>): Promise<Config | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private sessions: Map<number, Session>;
  private answers: Map<number, Answer>;
  private configs: Map<number, Config>;
  
  private userCounter: number;
  private questionCounter: number;
  private sessionCounter: number;
  private answerCounter: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.sessions = new Map();
    this.answers = new Map();
    this.configs = new Map();
    
    this.userCounter = 1;
    this.questionCounter = 1;
    this.sessionCounter = 1;
    this.answerCounter = 1;
    
    // Initialize with a default config
    this.configs.set(1, {
      id: 1,
      aiPrompt: "You are an insurance assistant helping collect fact-find information. Be polite, clear, and concise. Ask one question at a time and wait for the user's response before continuing. Use the user's name when appropriate. If the user seems confused, offer clarification. For yes/no questions, present them as clear choices.",
      aiModel: "gpt-4o",
      aiTemperature: "0.7",
      emailTemplate: "",
      emailRecipients: "",
      excelTemplate: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.clerkId === clerkId,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  // Question operations
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values()).sort((a, b) => a.order - b.order);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionCounter++;
    const now = new Date();
    const newQuestion: Question = { ...question, id, createdAt: now, updatedAt: now };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(id);
    if (!existingQuestion) return undefined;
    
    const updatedQuestion: Question = {
      ...existingQuestion,
      ...question,
      updatedAt: new Date(),
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  // Session operations
  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = this.sessionCounter++;
    const newSession: Session = { ...session, id, createdAt: new Date() };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined> {
    const existingSession = this.sessions.get(id);
    if (!existingSession) return undefined;
    
    const updatedSession: Session = {
      ...existingSession,
      ...session,
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Answer operations
  async getSessionAnswers(sessionId: number): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(answer => answer.sessionId === sessionId);
  }

  async getAnswer(id: number): Promise<Answer | undefined> {
    return this.answers.get(id);
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const id = this.answerCounter++;
    const newAnswer: Answer = { ...answer, id, createdAt: new Date() };
    this.answers.set(id, newAnswer);
    return newAnswer;
  }

  async updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer | undefined> {
    const existingAnswer = this.answers.get(id);
    if (!existingAnswer) return undefined;
    
    const updatedAnswer: Answer = {
      ...existingAnswer,
      ...answer,
    };
    
    this.answers.set(id, updatedAnswer);
    return updatedAnswer;
  }

  // Config operations
  async getConfig(): Promise<Config | undefined> {
    return this.configs.get(1);
  }

  async updateConfig(config: Partial<InsertConfig>): Promise<Config | undefined> {
    const existingConfig = this.configs.get(1);
    if (!existingConfig) return undefined;
    
    const updatedConfig: Config = {
      ...existingConfig,
      ...config,
      updatedAt: new Date(),
    };
    
    this.configs.set(1, updatedConfig);
    return updatedConfig;
  }
}

// Import the Supabase storage implementation
import { SupabaseStorage } from './supabaseStorage';

// Choose the appropriate storage implementation based on environment
let storage: IStorage;

// If DATABASE_URL is provided, use Supabase storage, otherwise fall back to MemStorage
if (process.env.DATABASE_URL) {
  try {
    storage = new SupabaseStorage(process.env.DATABASE_URL);
    console.log('Using Supabase storage with PostgreSQL');
  } catch (error) {
    console.error('Failed to initialize Supabase storage:', error);
    storage = new MemStorage();
    console.log('Falling back to in-memory storage');
  }
} else {
  storage = new MemStorage();
  console.log('Using in-memory storage (no DATABASE_URL provided)');
}

export { storage };
