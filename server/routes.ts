import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertQuestionSchema,
  insertSessionSchema,
  insertAnswerSchema,
  insertConfigSchema,
} from "@shared/schema";
import {
  generateAIResponse,
  AIAssistantConfig,
  analyzeResponse,
} from "./lib/openai";
import { generateFactFindPDF } from "./lib/pdf";
import { generateFactFindExcel, formatFactFindDataForExcel } from "./lib/excel";
import { sendFactFindEmail } from "./lib/email";
import {
  requireAuth,
  requireAdmin,
  type AuthenticatedRequest,
} from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const api = "/api";

  // Health check endpoint
  app.get(`${api}/health`, (req, res) => {
    res.json({ status: "ok" });
  });

  // User APIs
  app.post(
    `${api}/users`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;

        // Get user metadata from request
        const isAdmin = req.body.metadata?.isAdmin === true;

        // Validate request body
        const result = insertUserSchema.safeParse({
          ...req.body,
          clerkId: user.clerkId,
          isAdmin: isAdmin || false,
        });

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid request", errors: result.error.errors });
        }

        // Create new user
        const newUser = await storage.createUser(result.data);
        res.status(201).json(newUser);
      } catch (error) {
        console.error("User creation error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get(`${api}/me`, requireAuth, async (req: AuthenticatedRequest, res) => {
    res.json(req.user);
  });

  // Question APIs
  app.get(`${api}/questions`, async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${api}/questions`, requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = insertQuestionSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Invalid request", errors: result.error.errors });
      }

      const question = await storage.createQuestion(result.data);
      res.status(201).json(question);
    } catch (error) {
      console.error("Create question error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(
    `${api}/questions/:id`,
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const questionId = parseInt(req.params.id);

        // Validate the update data
        const result = insertQuestionSchema.partial().safeParse(req.body);

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid request", errors: result.error.errors });
        }

        const question = await storage.updateQuestion(questionId, result.data);

        if (!question) {
          return res.status(404).json({ message: "Question not found" });
        }

        res.json(question);
      } catch (error) {
        console.error("Update question error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.delete(
    `${api}/questions/:id`,
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const questionId = parseInt(req.params.id);
        const result = await storage.deleteQuestion(questionId);

        if (!result) {
          return res.status(404).json({ message: "Question not found" });
        }

        res.status(204).end();
      } catch (error) {
        console.error("Delete question error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Session APIs
  app.get(
    `${api}/sessions`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        let sessions;

        if (user.isAdmin) {
          sessions = await storage.getSessions();
        } else {
          sessions = await storage.getUserSessions(user.id);
        }

        res.json(sessions);
      } catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get(
    `${api}/sessions/:id`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const sessionId = parseInt(req.params.id);
        const session = await storage.getSession(sessionId);

        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        const user = req.user!;

        // Check if user has access to this session
        if (!user.isAdmin && session.userId !== user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const answers = await storage.getSessionAnswers(sessionId);
        res.json({ session, answers });
      } catch (error) {
        console.error("Get session error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    `${api}/sessions`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;

        const result = insertSessionSchema.safeParse({
          ...req.body,
          userId: user.id,
        });

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid request", errors: result.error.errors });
        }

        const session = await storage.createSession(result.data);
        res.status(201).json(session);
      } catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.put(
    `${api}/sessions/:id`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const sessionId = parseInt(req.params.id);
        const session = await storage.getSession(sessionId);

        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        const user = req.user!;

        // Check if user has access to this session
        if (!user.isAdmin && session.userId !== user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const result = insertSessionSchema.partial().safeParse(req.body);

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid request", errors: result.error.errors });
        }

        const updatedSession = await storage.updateSession(
          sessionId,
          result.data
        );
        res.json(updatedSession);
      } catch (error) {
        console.error("Update session error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Answer APIs
  app.post(
    `${api}/sessions/:sessionId/answers`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const sessionId = parseInt(req.params.sessionId);
        const session = await storage.getSession(sessionId);

        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        const user = req.user!;

        // Check if user has access to this session
        if (!user.isAdmin && session.userId !== user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const result = insertAnswerSchema.safeParse({
          ...req.body,
          sessionId,
        });

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid request", errors: result.error.errors });
        }

        const answer = await storage.createAnswer(result.data);
        res.status(201).json(answer);
      } catch (error) {
        console.error("Create answer error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // AI APIs
  app.post(`${api}/ai/generate`, requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string(),
          })
        ),
      });

      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Invalid request", errors: result.error.errors });
      }

      // Get AI config
      const config = await storage.getConfig();

      if (!config) {
        return res.status(500).json({ message: "AI configuration not found" });
      }

      const aiConfig: AIAssistantConfig = {
        model: config.aiModel || "gpt-3.5-turbo",
        systemPrompt: config.aiPrompt || "",
        temperature: config.aiTemperature
          ? parseFloat(config.aiTemperature)
          : 0.7,
      };

      const aiResponse = await generateAIResponse(
        result.data.messages,
        aiConfig
      );
      res.json(aiResponse);
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Config APIs
  app.get(`${api}/config`, requireAuth, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Get config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(`${api}/config`, requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = insertConfigSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Invalid request", errors: result.error.errors });
      }

      const config = await storage.updateConfig(result.data);

      if (!config) {
        return res.status(500).json({ message: "Config not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Update config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PDF Generation API
  app.post(
    `${api}/sessions/:id/pdf`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const sessionId = parseInt(req.params.id);
        const session = await storage.getSession(sessionId);

        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        const user = req.user!;

        // Check if user has access to this session
        if (!user.isAdmin && session.userId !== user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Get all answers for the session
        const answers = await storage.getSessionAnswers(sessionId);

        // Get questions for each answer
        const questionsMap = new Map();

        for (const answer of answers) {
          const questionId = answer.questionId;
          if (typeof questionId === "number" && !questionsMap.has(questionId)) {
            const question = await storage.getQuestion(questionId);
            if (question) {
              questionsMap.set(questionId, question);
            }
          }
        }

        // Format data for PDF
        const formattedAnswers = answers.map((answer) => {
          const question = questionsMap.get(answer.questionId);
          return {
            question: question?.text || "Unknown Question",
            answer: answer.value,
          };
        });

        const pdfBuffer = await generateFactFindPDF({
          userName: user.email,
          answers: formattedAnswers,
          signatureData: session.signatureData ?? undefined,
          date: new Date().toLocaleDateString(),
        });

        // Update session with PDF data
        await storage.updateSession(sessionId, {
          completedAt: new Date(),
        });

        // Send email if configured
        const config = await storage.getConfig();

        if (config?.emailRecipients) {
          // Create HTML summary for email
          const summaryHtml = formattedAnswers
            .map(
              (item) =>
                `<p><strong>${item.question}</strong>: ${item.answer}</p>`
            )
            .join("");

          await sendFactFindEmail(
            {
              userName: user.email,
              sessionId,
              summary: summaryHtml,
              pdfAttachment: pdfBuffer,
            },
            {
              recipients: config.emailRecipients,
              template:
                typeof config.emailTemplate === "string"
                  ? config.emailTemplate
                  : undefined,
            }
          );
        }

        // Set response headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=fact-find-${sessionId}.pdf`
        );
        res.send(pdfBuffer);
      } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Excel Export API
  app.get(
    `${api}/sessions/:id/excel`,
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const sessionId = parseInt(req.params.id);
        const session = await storage.getSession(sessionId);

        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        const user = req.user!;

        // Check if user has access to this session
        if (!user.isAdmin && session.userId !== user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Get session user
        const userId = session.userId;
        if (typeof userId !== "number") {
          return res.status(400).json({ message: "Invalid user ID" });
        }
        const sessionUser = await storage.getUser(userId);

        if (!sessionUser) {
          return res.status(404).json({ message: "Session user not found" });
        }

        // Get all answers for the session
        const answers = await storage.getSessionAnswers(sessionId);

        // Get questions for each answer
        const questionsMap = new Map();

        for (const answer of answers) {
          const questionId = answer.questionId;
          if (typeof questionId === "number" && !questionsMap.has(questionId)) {
            const question = await storage.getQuestion(questionId);
            if (question) {
              questionsMap.set(questionId, question);
            }
          }
        }

        // Format data for Excel
        const formattedAnswers = answers.map((answer) => {
          const question = questionsMap.get(answer.questionId);
          return {
            question: { text: question?.text || "Unknown Question" },
            value: answer.value,
          };
        });

        const excelData = formatFactFindDataForExcel(
          session,
          sessionUser,
          formattedAnswers
        );

        const excelBuffer = await generateFactFindExcel(excelData);

        // Set response headers for Excel download
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=fact-find-${sessionId}.xlsx`
        );
        res.send(excelBuffer);
      } catch (error) {
        console.error("Excel generation error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
