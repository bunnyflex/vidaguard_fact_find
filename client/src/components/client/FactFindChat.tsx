import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFactFind } from "@/hooks/useFactFind";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Question } from "@shared/schema";
import { useUser } from "@clerk/clerk-react";

interface FactFindChatProps {
  onComplete: (
    sessionId: number,
    answers: Array<{ question: string; answer: string }>
  ) => void;
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  questionId?: number;
  inputType?: string;
  options?: string[];
  isLoading?: boolean;
};

export default function FactFindChat({ onComplete }: FactFindChatProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sessionId, createSession, saveAnswer, getSessionAnswers } =
    useFactFind();

  // Fetch questions
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    staleTime: 60000, // 1 minute
  });

  // Generate AI message
  const aiMutation = useMutation({
    mutationFn: async (messages: Array<{ role: string; content: string }>) => {
      return apiRequest<{ content: string; role: string }>(
        "POST",
        "/api/ai/generate",
        { messages }
      );
    },
    onSuccess: (data) => {
      appendMessage({
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.content,
        isLoading: false,
      });
      setIsTyping(false);
      prepareNextQuestion();
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: `Failed to generate AI response: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Initialize chat
  useEffect(() => {
    if (questions.length > 0 && messages.length === 0) {
      startChat();
    }
  }, [questions]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Update progress
  useEffect(() => {
    if (questions.length > 0) {
      setProgress(
        Math.min(100, (currentQuestionIndex / questions.length) * 100)
      );
    }
  }, [currentQuestionIndex, questions.length]);

  // Create a new session
  const startChat = async () => {
    if (!user) return;

    // Start with welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm your AI assistant and I'll be helping you complete your insurance fact find form. Let's start with some basic information.",
      },
    ]);

    // Create session if needed
    if (!sessionId) {
      try {
        await createSession();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create session.",
          variant: "destructive",
        });
      }
    }

    // Show first question
    prepareNextQuestion();
  };

  // Add message to chat
  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  // Handle user input submission
  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (isTyping || !currentInput.trim()) return;

    const currentQuestion = questions[currentQuestionIndex - 1];

    if (!currentQuestion) return;

    // Add user message
    appendMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: currentInput,
      questionId: currentQuestion.id,
    });

    // Save answer
    try {
      await saveAnswer(currentQuestion.id, currentInput);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your answer.",
        variant: "destructive",
      });
    }

    // Clear input and show AI typing indicator
    setCurrentInput("");
    setIsTyping(true);

    // Get conversation history for AI
    const conversationHistory = messages
      .filter((m) => !m.isLoading)
      .map((m) => ({ role: m.role, content: m.content }));

    // Add user's latest message
    conversationHistory.push({ role: "user", content: currentInput });

    // Generate AI response
    aiMutation.mutate(conversationHistory);
  };

  // Prepare next question to show
  const prepareNextQuestion = () => {
    if (currentQuestionIndex >= questions.length) {
      // All questions answered, prepare for completion
      completeFactFind();
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];

    // Add question message with appropriate input type
    setTimeout(() => {
      appendMessage({
        id: `question-${currentQuestion.id}`,
        role: "assistant",
        content: currentQuestion.text,
        questionId: currentQuestion.id,
        inputType: currentQuestion.type,
        options: currentQuestion.options
          ? typeof currentQuestion.options === "string"
            ? JSON.parse(currentQuestion.options)
            : currentQuestion.options
          : undefined,
      });
      setCurrentQuestionIndex(currentQuestionIndex + 1);

      // Focus on input field if it's a text question
      if (currentQuestion.type === "text" && inputRef.current) {
        inputRef.current.focus();
      }
    }, 800); // Slight delay for natural conversation flow
  };

  // Handle special input types (multiple choice, yes/no, etc.)
  const handleSpecialInput = async (questionId: number, value: string) => {
    // Save the answer
    try {
      await saveAnswer(questionId, value);

      // Add user message
      appendMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: value,
        questionId: questionId,
      });

      // Show AI typing indicator
      setIsTyping(true);

      // Get conversation history for AI
      const conversationHistory = messages
        .filter((m) => !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }));

      // Add user's choice
      conversationHistory.push({ role: "user", content: value });

      // Generate AI response
      aiMutation.mutate(conversationHistory);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your answer.",
        variant: "destructive",
      });
    }
  };

  // Complete the fact find process
  const completeFactFind = async () => {
    if (!sessionId) return;

    try {
      // Get all answers for summary
      const answers = await getSessionAnswers();

      // Format answers for display
      const formattedAnswers = answers.map((answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        return {
          question: question?.text || "Unknown Question",
          answer: answer.value,
        };
      });

      // Call onComplete with session ID and answers
      onComplete(sessionId, formattedAnswers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete the fact find process.",
        variant: "destructive",
      });
    }
  };

  // Function to handle manually saving and exiting
  const handleSaveAndExit = () => {
    toast({
      title: "Progress Saved",
      description: "Your answers have been saved. You can continue later.",
    });
  };

  // Render message based on type
  const renderMessage = (message: Message) => {
    if (message.role === "assistant") {
      // AI message with potential form inputs
      return (
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fas fa-robot text-primary"></i>
            </div>
          </div>
          <div className="chat-bubble ai-bubble bg-blue-50 p-3 rounded-lg w-full sm:w-auto sm:max-w-[80%]">
            <p className="text-gray-800 mb-3">{message.content}</p>

            {/* Different input types based on question type */}
            {message.inputType === "date" && (
              <div className="mt-2">
                <Input
                  type="date"
                  className="w-full"
                  onChange={(e) => setCurrentInput(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    className="bg-primary hover:bg-blue-600 text-white"
                    onClick={() =>
                      message.questionId &&
                      handleSpecialInput(message.questionId, currentInput)
                    }
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {message.inputType === "multiple-choice" && message.options && (
              <div className="space-y-2">
                {message.options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      id={`option${index}`}
                      type="radio"
                      name={`question-${message.questionId}`}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      onChange={() =>
                        message.questionId &&
                        handleSpecialInput(message.questionId, option)
                      }
                    />
                    <label
                      htmlFor={`option${index}`}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {message.inputType === "yes/no" && (
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center">
                  <input
                    id="yes"
                    type="radio"
                    name={`question-${message.questionId}`}
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    onChange={() =>
                      message.questionId &&
                      handleSpecialInput(message.questionId, "Yes")
                    }
                  />
                  <label
                    htmlFor="yes"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Yes
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="no"
                    type="radio"
                    name={`question-${message.questionId}`}
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    onChange={() =>
                      message.questionId &&
                      handleSpecialInput(message.questionId, "No")
                    }
                  />
                  <label
                    htmlFor="no"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    No
                  </label>
                </div>
              </div>
            )}

            {message.inputType === "number" && (
              <div className="mt-2">
                <Input
                  type="number"
                  className="w-full"
                  onChange={(e) => setCurrentInput(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    className="bg-primary hover:bg-blue-600 text-white"
                    onClick={() =>
                      message.questionId &&
                      handleSpecialInput(message.questionId, currentInput)
                    }
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // User message
      const initials = user?.fullName
        ? user.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() ||
          "U";

      return (
        <div className="flex items-start mb-4 justify-end">
          <div className="chat-bubble user-bubble bg-primary text-white p-3 rounded-lg">
            <p>{message.content}</p>
          </div>
          <div className="flex-shrink-0 ml-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Progress bar */}
      <div className="w-full bg-gray-100 h-1">
        <div className="bg-primary h-1" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Chat header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Insurance Fact Find</h2>
        <p className="text-sm text-gray-500">
          Please answer the following questions to help us understand your
          insurance needs.
        </p>
      </div>

      {/* Chat messages container */}
      <div
        className="p-4 h-[calc(100vh-350px)] overflow-y-auto"
        id="chat-container"
        ref={chatContainerRef}
      >
        {/* Render all messages */}
        {messages.map((message) => (
          <div key={message.id}>{renderMessage(message)}</div>
        ))}

        {/* Typing indicator when AI is "thinking" */}
        {isTyping && (
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 mr-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fas fa-robot text-primary"></i>
              </div>
            </div>
            <div className="chat-bubble ai-bubble bg-blue-50 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center">
            <Input
              type="text"
              id="user-input"
              placeholder="Type your response..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              ref={inputRef}
              disabled={isTyping}
            />
            <Button
              className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-r-md"
              disabled={isTyping || !currentInput.trim()}
              type="submit"
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
        </form>
        <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            <i className="fas fa-save mr-1"></i>
            <span>Auto-saving</span>
          </div>
          <Button
            variant="ghost"
            className="text-primary hover:underline p-0 h-auto"
            onClick={handleSaveAndExit}
          >
            Save & exit
          </Button>
        </div>
      </div>
    </div>
  );
}
