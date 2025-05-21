import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertQuestionSchema, insertSessionSchema, insertAnswerSchema, insertConfigSchema } from "@shared/schema";
import { generateAIResponse, AIAssistantConfig, analyzeResponse } from "./lib/openai";
import { generateFactFindPDF } from "./lib/pdf";
import { generateFactFindExcel, formatFactFindDataForExcel } from "./lib/excel";
import { sendFactFindEmail } from "./lib/email";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const api = '/api';

  // Simplified middleware that always grants access without authentication checks
  const requireUser = async (req: Request, res: Response, next: Function) => {
    try {
      // Create a default test user
      const defaultUser = {
        id: 1,
        clerkId: 'dev-user-123',
        email: 'test@example.com',
        isAdmin: true,
        createdAt: new Date()
      };
      
      // Always add the default user to the request
      req.body.user = defaultUser;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Simplified admin middleware that always grants admin access
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    // No checks needed - always grant admin access in development mode
    next();
  };

  // Health check endpoint
  app.get(`${api}/health`, (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Initialize with sample questions if none exist
  async function seedSampleQuestions() {
    try {
      const questions = await storage.getQuestions();
      
      // Only seed if no questions exist
      if (questions.length === 0) {
        console.log('No questions found. Adding sample questions...');
        
        const sampleQuestions = [
          {
            text: "Are you UK domiciled and a UK tax resident?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 1,
          },
          {
            text: "What is your marital status?",
            type: "text",
            placeholder: "Enter your marital status",
            order: 2,
          },
          {
            text: "What is your relationship to the other applicant (if applicable)?",
            type: "text",
            placeholder: "Leave blank if not applicable",
            order: 3,
          },
          {
            text: "Do you have any dependents?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 4,
          },
          {
            text: "If yes, how many dependents do you have? (under 18)",
            type: "number",
            placeholder: "Enter number",
            order: 5,
            dependsOn: {
              questionId: 4,
              value: "Yes"
            }
          },
          {
            text: "How old are your dependents?",
            type: "text",
            placeholder: "e.g., 5, 8, 12",
            order: 6,
            dependsOn: {
              questionId: 4,
              value: "Yes"
            }
          },
          {
            text: "What is your occupation?",
            type: "text",
            placeholder: "Enter your job title",
            order: 7,
          },
          {
            text: "What is your employment status?",
            type: "multiple-choice",
            options: ["Employed", "Self-Employed", "Unemployed"],
            order: 8,
          },
          {
            text: "If unemployed, please explain why.",
            type: "text",
            placeholder: "Provide details",
            order: 9,
            dependsOn: {
              questionId: 8,
              value: "Unemployed"
            }
          },
          {
            text: "Do you smoke?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 10,
          },
          {
            text: "If no, have you smoked in the last 12 months?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 11,
            dependsOn: {
              questionId: 10,
              value: "No"
            }
          },
          {
            text: "Are you classed as vulnerable?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 12,
          },
          {
            text: "If yes, please explain your vulnerability.",
            type: "text",
            placeholder: "Provide details",
            order: 13,
            dependsOn: {
              questionId: 12,
              value: "Yes"
            }
          },
          {
            text: "Are you currently taking any medication?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 14,
          },
          {
            text: "If yes, please list the medication you are taking.",
            type: "text",
            placeholder: "List medications",
            order: 15,
            dependsOn: {
              questionId: 14,
              value: "Yes"
            }
          },
          {
            text: "Do you do any exercise?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 16,
          },
          {
            text: "What is your height?",
            type: "number",
            placeholder: "Height in cm",
            suffix: "cm",
            order: 17,
          },
          {
            text: "What is your weight?",
            type: "number",
            placeholder: "Weight in kg",
            suffix: "kg",
            order: 18,
          },
          {
            text: "Are any of the following of interest to you?",
            type: "checkbox-multiple",
            options: ["Life Insurance", "Critical Illness Cover", "Income Protection", "Mortgage Protection", "Pensions", "Investments", "Other"],
            order: 19,
          },
          {
            text: "If you selected 'Other', please specify:",
            type: "text",
            placeholder: "Enter details",
            order: 20,
            dependsOn: {
              questionId: 19,
              value: "Other"
            }
          },
          {
            text: "Is there anything else you would like to add?",
            type: "text",
            placeholder: "Enter any additional information",
            order: 21,
          },
          {
            text: "What is your gross annual income?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 22,
          },
          {
            text: "Monthly take home pay",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 23,
          },
          {
            text: "Do you have any other income?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 24,
          },
          {
            text: "Please specify amount and source of other income",
            type: "text",
            placeholder: "E.g. £500 Child Support",
            order: 25,
            dependsOn: {
              questionId: 24,
              value: "Yes"
            }
          },
          {
            text: "What are your monthly mortgage costs?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 26,
          },
          {
            text: "What are your monthly rental costs?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 27,
          },
          {
            text: "What are your monthly household bills?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 28,
          },
          {
            text: "What are your monthly gym/sports club costs?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 29,
          },
          {
            text: "What are your monthly insurance costs?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 30,
          },
          {
            text: "What are your monthly overdraft, loans, credit card costs?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 31,
          },
          {
            text: "What are your monthly food/clothes costs?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 32,
          },
          {
            text: "What are your monthly entertainment costs?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 33,
          },
          {
            text: "Do you have any other monthly costs?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 34,
          },
          {
            text: "Please specify amount and details of other costs",
            type: "text",
            placeholder: "E.g. £100 for pet care",
            order: 35,
            dependsOn: {
              questionId: 34,
              value: "Yes"
            }
          },
          {
            text: "Please provide details of any Loans/Overdrafts/Credit Cards/IVA/Debt Management",
            type: "text",
            placeholder: "Enter details",
            order: 36,
          },
          {
            text: "If you were off work due to sickness/accident, what would you receive?",
            type: "text",
            placeholder: "Enter details",
            order: 37,
          },
          {
            text: "Is this SSP (Statutory Sick Pay)?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 38,
          },
          {
            text: "Do you have Death in Service benefit at work?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 39,
          },
          {
            text: "Are you paying into a pension (Company/Personal)?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 40,
          },
          {
            text: "What is your National Insurance number?",
            type: "text",
            placeholder: "E.g. AB123456C",
            order: 41,
          },
          {
            text: "Do you have any other Life Insurances in place?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 42,
          },
          {
            text: "What insurance company is your policy with?",
            type: "text",
            placeholder: "Enter company name",
            order: 43,
            dependsOn: {
              questionId: 42,
              value: "Yes"
            }
          },
          {
            text: "What is the sum assured amount?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 44,
            dependsOn: {
              questionId: 42,
              value: "Yes"
            }
          },
          {
            text: "What is the term remaining on your policy?",
            type: "text",
            placeholder: "E.g. 15 years",
            order: 45,
            dependsOn: {
              questionId: 42,
              value: "Yes"
            }
          },
          {
            text: "What is your monthly premium?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 46,
            dependsOn: {
              questionId: 42,
              value: "Yes"
            }
          },
          {
            text: "What is your cover level?",
            type: "multiple-choice",
            options: ["Level", "Increasing", "Decreasing"],
            order: 47,
            dependsOn: {
              questionId: 42,
              value: "Yes"
            }
          },
          {
            text: "What is your premium type?",
            type: "multiple-choice",
            options: ["Guaranteed", "Reviewable"],
            order: 48,
            dependsOn: {
              questionId: 42,
              value: "Yes"
            }
          },
          {
            text: "Do you have Buildings/Contents Insurance?",
            type: "multiple-choice",
            options: ["Yes", "No"],
            order: 49,
          },
          {
            text: "What is your current rent amount?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 50,
          },
          {
            text: "What are your current mortgage payments?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 51,
          },
          {
            text: "What is the remaining term on your mortgage?",
            type: "text",
            placeholder: "E.g. 20 years",
            order: 52,
          },
          {
            text: "What is the outstanding balance on your mortgage?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 53,
          },
          {
            text: "Is your mortgage Interest Only or Repayment?",
            type: "multiple-choice",
            options: ["Interest Only", "Repayment"],
            order: 54,
          },
          {
            text: "Is your mortgage Single or Joint?",
            type: "multiple-choice",
            options: ["Single", "Joint"],
            order: 55,
          },
          {
            text: "How much do you have in savings or investments?",
            type: "number",
            placeholder: "Enter amount",
            prefix: "£",
            order: 56,
          },
          {
            text: "Please provide any additional notes or information you feel is relevant",
            type: "text",
            placeholder: "Enter additional information",
            order: 57,
          },
        ];
        
        // Add each sample question
        for (const question of sampleQuestions) {
          await storage.createQuestion(question);
        }
        
        console.log('Sample questions added successfully');
      }
    } catch (error) {
      console.error('Error seeding sample questions:', error);
    }
  }
  
  // Run the seeding function
  seedSampleQuestions();

  // User APIs
  app.post(`${api}/users`, async (req, res) => {
    try {
      const clerkId = req.headers['x-clerk-user-id'] as string;
      
      if (!clerkId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Check if user already exists
      let user = await storage.getUserByClerkId(clerkId);
      
      if (user) {
        return res.json(user);
      }
      
      // Validate request body
      const result = insertUserSchema.safeParse({
        ...req.body,
        clerkId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      // Create new user
      user = await storage.createUser(result.data);
      
      res.status(201).json(user);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get(`${api}/me`, requireUser, async (req, res) => {
    res.json(req.body.user);
  });

  // Question APIs
  app.get(`${api}/questions`, async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(`${api}/questions`, requireUser, requireAdmin, async (req, res) => {
    try {
      const result = insertQuestionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      const question = await storage.createQuestion(result.data);
      res.status(201).json(question);
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put(`${api}/questions/:id`, requireUser, requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      
      // Validate the update data
      const result = insertQuestionSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      const question = await storage.updateQuestion(questionId, result.data);
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      res.json(question);
    } catch (error) {
      console.error('Update question error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete(`${api}/questions/:id`, requireUser, requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const result = await storage.deleteQuestion(questionId);
      
      if (!result) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Session APIs
  app.get(`${api}/sessions`, requireUser, async (req, res) => {
    try {
      const user = req.body.user;
      
      let sessions;
      if (user.isAdmin) {
        // Admins can see all sessions
        sessions = await storage.getSessions();
      } else {
        // Regular users only see their own sessions
        sessions = await storage.getUserSessions(user.id);
      }
      
      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get(`${api}/sessions/:id`, requireUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const user = req.body.user;
      
      // Check if user has access to this session
      if (!user.isAdmin && session.userId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const answers = await storage.getSessionAnswers(sessionId);
      
      res.json({ session, answers });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(`${api}/sessions`, requireUser, async (req, res) => {
    try {
      const user = req.body.user;
      
      const result = insertSessionSchema.safeParse({
        ...req.body,
        userId: user.id
      });
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      const session = await storage.createSession(result.data);
      res.status(201).json(session);
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put(`${api}/sessions/:id`, requireUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const user = req.body.user;
      
      // Check if user has access to this session
      if (!user.isAdmin && session.userId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const result = insertSessionSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      const updatedSession = await storage.updateSession(sessionId, result.data);
      res.json(updatedSession);
    } catch (error) {
      console.error('Update session error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Answer APIs
  app.post(`${api}/sessions/:sessionId/answers`, requireUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const user = req.body.user;
      
      // Check if user has access to this session
      if (!user.isAdmin && session.userId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const result = insertAnswerSchema.safeParse({
        ...req.body,
        sessionId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      const answer = await storage.createAnswer(result.data);
      res.status(201).json(answer);
    } catch (error) {
      console.error('Create answer error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // AI APIs
  app.post(`${api}/ai/generate`, requireUser, async (req, res) => {
    try {
      const schema = z.object({
        messages: z.array(z.object({
          role: z.string(),
          content: z.string()
        }))
      });
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      // Get AI config
      const config = await storage.getConfig();
      
      if (!config) {
        return res.status(500).json({ message: 'AI configuration not found' });
      }
      
      const aiConfig: AIAssistantConfig = {
        model: config.aiModel,
        systemPrompt: config.aiPrompt,
        temperature: parseFloat(config.aiTemperature),
      };
      
      const aiResponse = await generateAIResponse(result.data.messages, aiConfig);
      res.json(aiResponse);
    } catch (error) {
      console.error('AI generation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Config APIs
  app.get(`${api}/config`, requireUser, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      console.error('Get config error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put(`${api}/config`, requireUser, requireAdmin, async (req, res) => {
    try {
      const result = insertConfigSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid request', errors: result.error.errors });
      }
      
      const config = await storage.updateConfig(result.data);
      
      if (!config) {
        return res.status(500).json({ message: 'Config not found' });
      }
      
      res.json(config);
    } catch (error) {
      console.error('Update config error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // PDF Generation API
  app.post(`${api}/sessions/:id/pdf`, requireUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const user = req.body.user;
      
      // Check if user has access to this session
      if (!user.isAdmin && session.userId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Get all answers for the session
      const answers = await storage.getSessionAnswers(sessionId);
      
      // Get questions for each answer
      const questionsMap = new Map();
      
      for (const answer of answers) {
        if (!questionsMap.has(answer.questionId)) {
          const question = await storage.getQuestion(answer.questionId);
          if (question) {
            questionsMap.set(answer.questionId, question);
          }
        }
      }
      
      // Format data for PDF
      const formattedAnswers = answers.map(answer => {
        const question = questionsMap.get(answer.questionId);
        return {
          question: question?.text || 'Unknown Question',
          answer: answer.value
        };
      });
      
      const pdfBuffer = await generateFactFindPDF({
        userName: user.name || user.email,
        answers: formattedAnswers,
        signatureData: session.signatureData,
        date: new Date().toLocaleDateString()
      });
      
      // Update session with PDF data
      await storage.updateSession(sessionId, {
        completedAt: new Date()
      });
      
      // Send email if configured
      const config = await storage.getConfig();
      
      if (config && config.emailRecipients) {
        // Create HTML summary for email
        const summaryHtml = formattedAnswers
          .map(item => `<p><strong>${item.question}</strong>: ${item.answer}</p>`)
          .join('');
        
        await sendFactFindEmail(
          {
            userName: user.name || user.email,
            sessionId,
            summary: summaryHtml,
            pdfAttachment: pdfBuffer
          },
          {
            recipients: config.emailRecipients,
            template: config.emailTemplate
          }
        );
      }
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=fact-find-${sessionId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Excel Export API
  app.get(`${api}/sessions/:id/excel`, requireUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const user = req.body.user;
      
      // Check if user has access to this session
      if (!user.isAdmin && session.userId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Get session user
      const sessionUser = await storage.getUser(session.userId);
      
      if (!sessionUser) {
        return res.status(404).json({ message: 'Session user not found' });
      }
      
      // Get all answers for the session
      const answers = await storage.getSessionAnswers(sessionId);
      
      // Get questions for each answer
      const questionsMap = new Map();
      
      for (const answer of answers) {
        if (!questionsMap.has(answer.questionId)) {
          const question = await storage.getQuestion(answer.questionId);
          if (question) {
            questionsMap.set(answer.questionId, question);
          }
        }
      }
      
      // Format data for Excel
      const formattedAnswers = answers.map(answer => {
        const question = questionsMap.get(answer.questionId);
        return {
          question: { text: question?.text || 'Unknown Question' },
          value: answer.value
        };
      });
      
      const excelData = formatFactFindDataForExcel(
        session,
        sessionUser,
        formattedAnswers
      );
      
      const excelBuffer = await generateFactFindExcel(excelData);
      
      // Set response headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=fact-find-${sessionId}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Excel generation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
