"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/components/auth/ClerkProvider"
import { useToast } from "@/hooks/use-toast"
import { useFactFind } from "@/hooks/useFactFind"

// Utility function for class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}

// UI Components
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70")

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { className?: string }
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

// Types
type QuestionType = "multiple-choice" | "text" | "checkbox-multiple" | "number"

type Question = {
  id: number
  text: string
  type: QuestionType
  options?: string[]
  dependsOn?: {
    questionId: number
    value: string | boolean
  }
  placeholder?: string
  prefix?: string
  suffix?: string
}

type QuestionState = {
  question: Question | null
  isTyping: boolean
  showOptions: boolean
  isIntro: boolean
  isComplete: boolean
}

// Questions data
const questions: Question[] = [
  {
    id: 1,
    text: "Are you UK domiciled and a UK tax resident?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 2,
    text: "What is your marital status?",
    type: "multiple-choice",
    options: ["Single", "Married", "Divorced"],
  },
  {
    id: 3,
    text: "What is your relationship to the other applicant (if applicable)?",
    type: "text",
    placeholder: "e.g., Spouse, Partner, Sibling",
  },
  {
    id: 4,
    text: "Do you have any dependents? (Would you like to add any dependants to your policy?)",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 5,
    text: "If yes, how many dependents do you have? (under 18)",
    type: "number",
    dependsOn: {
      questionId: 4,
      value: "Yes",
    },
    placeholder: "Enter number",
  },
  {
    id: 6,
    text: "How old are your dependents?",
    type: "text",
    dependsOn: {
      questionId: 4,
      value: "Yes",
    },
    placeholder: "e.g., 5, 8, 12",
  },
  {
    id: 7,
    text: "What is your occupation?",
    type: "text",
    placeholder: "Enter your occupation",
  },
  {
    id: 8,
    text: "What is your employment status?",
    type: "multiple-choice",
    options: ["Employed", "Self-Employed", "Unemployed"],
  },
  {
    id: 9,
    text: "If unemployed, please explain why.",
    type: "text",
    dependsOn: {
      questionId: 8,
      value: "Unemployed",
    },
    placeholder: "Provide details",
  },
  {
    id: 10,
    text: "Do you smoke?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 11,
    text: "If no, have you smoked in the last 12 months?",
    type: "multiple-choice",
    dependsOn: {
      questionId: 10,
      value: "No",
    },
    options: ["Yes", "No"],
  },
  {
    id: 12,
    text: "Are you classed as vulnerable?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 13,
    text: "If yes, please explain your vulnerability.",
    type: "text",
    dependsOn: {
      questionId: 12,
      value: "Yes",
    },
    placeholder: "Provide details",
  },
  {
    id: 14,
    text: "Are you currently taking any medication?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 15,
    text: "If yes, please list the medication you are taking.",
    type: "text",
    dependsOn: {
      questionId: 14,
      value: "Yes",
    },
    placeholder: "List medications",
  },
  {
    id: 16,
    text: "Do you do any exercise?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 17,
    text: "What is your height?",
    type: "text",
    placeholder: "e.g., 175cm or 5'10\"",
  },
  {
    id: 18,
    text: "What is your weight?",
    type: "text",
    placeholder: "e.g., 70kg or 154lbs",
  },
  {
    id: 19,
    text: "Are any of the following of interest to you? (Please select all that apply)",
    type: "checkbox-multiple",
    options: [
      "Life Insurance",
      "Critical Illness Cover",
      "Income Protection",
      "Mortgage Protection",
      "Pensions",
      "Investments",
      "Other",
    ],
  },
  {
    id: 20,
    text: "Is there anything else you would like to add?",
    type: "text",
    placeholder: "Additional information",
  },
  {
    id: 21,
    text: "Gross Annual Income:",
    type: "number",
    prefix: "£",
    placeholder: "Enter amount",
  },
  {
    id: 22,
    text: "Do you have any other income? (e.g., Child Support, Maintenance)",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 23,
    text: "If yes, please specify amount and source:",
    type: "text",
    dependsOn: {
      questionId: 22,
      value: "Yes",
    },
    prefix: "£",
    placeholder: "Amount and source",
  },
  {
    id: 24,
    text: "Mortgage Costs:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 25,
    text: "Rental Costs:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 26,
    text: "Household Bills:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 27,
    text: "Gym/Sports Clubs:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 28,
    text: "Insurance Costs:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 29,
    text: "Overdraft, Loans, Credit Card Costs:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 30,
    text: "Food/Clothes:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 31,
    text: "Entertainment:",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 32,
    text: "Other expenses (please specify):",
    type: "text",
    prefix: "£",
    placeholder: "Amount and details",
  },
  {
    id: 33,
    text: "If you were off work due to sickness/accident, what would you receive?",
    type: "text",
    placeholder: "Provide details",
  },
  {
    id: 34,
    text: "Is this SSP?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 35,
    text: "Do you have Death in Service benefit at work?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 36,
    text: "Are you paying into a pension (Company/Personal)?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 37,
    text: "What is your National Insurance number?",
    type: "text",
    placeholder: "e.g., AB123456C",
  },
  {
    id: 38,
    text: "Do you have any other Life Insurances in place?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 39,
    text: "If yes, please provide the company name:",
    type: "text",
    dependsOn: {
      questionId: 38,
      value: "Yes",
    },
    placeholder: "Company name",
  },
  {
    id: 40,
    text: "Sum Assured:",
    type: "number",
    dependsOn: {
      questionId: 38,
      value: "Yes",
    },
    prefix: "£",
    placeholder: "Enter amount",
  },
  {
    id: 41,
    text: "Do you have Buildings/Contents Insurance?",
    type: "multiple-choice",
    options: ["Yes", "No"],
  },
  {
    id: 42,
    text: "What is your current rent amount (if applicable)?",
    type: "number",
    prefix: "£",
    placeholder: "Monthly amount",
  },
  {
    id: 43,
    text: "What is the remaining term on your mortgage?",
    type: "text",
    placeholder: "e.g., 15 years",
  },
  {
    id: 44,
    text: "What is the outstanding balance on your mortgage?",
    type: "number",
    prefix: "£",
    placeholder: "Enter amount",
  },
  {
    id: 45,
    text: "How much do you have in savings or investments?",
    type: "number",
    prefix: "£",
    placeholder: "Enter amount",
  },
]

interface QuestionnaireChatProps {
  onComplete: (sessionId: number, answers: Array<{ question: string; answer: string }>) => void;
}

// Main component
export function QuestionnaireChat({ onComplete }: QuestionnaireChatProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const { sessionId, createSession, saveAnswer } = useFactFind()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [state, setState] = useState<QuestionState>({
    question: null,
    isTyping: false,
    showOptions: false,
    isIntro: false,
    isComplete: false,
  })
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [textInput, setTextInput] = useState<string>("")
  const [numberInput, setNumberInput] = useState<string>("")
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get the next valid question index based on dependencies
  const getNextQuestionIndex = (currentIndex: number, direction: "next" | "prev" = "next") => {
    const increment = direction === "next" ? 1 : -1
    let nextIndex = currentIndex + increment

    while (
      nextIndex >= 0 &&
      nextIndex < questions.length &&
      questions[nextIndex].dependsOn &&
      questions[nextIndex].dependsOn?.questionId !== undefined && 
      (answers[questions[nextIndex].dependsOn?.questionId] !== questions[nextIndex].dependsOn?.value)
    ) {
      nextIndex += increment
    }

    return nextIndex >= 0 && nextIndex < questions.length ? nextIndex : -1
  }

  // Initialize with intro
  useEffect(() => {
    setState({
      question: null,
      isTyping: true,
      showOptions: false,
      isIntro: false,
      isComplete: false,
    })

    // Create a session if needed
    const initSession = async () => {
      if (!sessionId) {
        try {
          await createSession();
        } catch (error) {
          console.error("Failed to create session:", error);
          toast({
            title: "Error",
            description: "Failed to create session."
          });
        }
      }
    };
    
    initSession();

    // Simulate typing delay for intro
    setTimeout(() => {
      setState({
        question: {
          id: 0,
          text: "Let's start fresh with the fact find questionnaire. I'll ask you the questions one by one, and you can skip any questions you prefer not to answer. At the end, I'll create a PDF summary of your answers with the truth declaration.",
          type: "text",
        },
        isTyping: false,
        showOptions: false,
        isIntro: true,
        isComplete: false,
      })

      // Show first question after intro
      setTimeout(() => {
        setState({
          question: questions[0],
          isTyping: false,
          showOptions: true,
          isIntro: false,
          isComplete: false,
        })
      }, 1000)
    }, 1500)
  }, [])

  // Focus input when question changes
  useEffect(() => {
    if (state.question && (state.question.type === "text" || state.question.type === "number") && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state.question])

  // Reset input values when question changes
  useEffect(() => {
    if (state.question) {
      setTextInput("")
      setNumberInput("")
      setCheckboxValues({})
    }
  }, [state.question])

  // Handle moving to the next question
  const handleNextQuestion = async () => {
    if (state.isIntro) {
      setState({
        question: questions[0],
        isTyping: false,
        showOptions: true,
        isIntro: false,
        isComplete: false,
      })
      setCurrentQuestionIndex(0)
      return
    }

    if (!state.question) return

    // Save the current answer
    const questionId = state.question.id
    let answerValue: any

    if (state.question.type === "text") {
      answerValue = textInput.trim()
      if (!answerValue) {
        answerValue = "Not provided"
      }
    } else if (state.question.type === "number") {
      answerValue = numberInput ? numberInput : "Not provided"
    } else if (state.question.type === "checkbox-multiple") {
      const selectedOptions = Object.entries(checkboxValues)
        .filter(([_, checked]) => checked)
        .map(([option]) => option)
      answerValue = selectedOptions.length ? selectedOptions.join(", ") : "None selected"
    } else {
      // Multiple choice
      if (!answers[questionId]) {
        toast({
          title: "Please select an option",
          description: "Please select at least one option to continue.",
          variant: "destructive",
        })
        return
      }
      answerValue = answers[questionId]
    }

    try {
      setLoading(true)
      // Save to our fact-find system
      if (sessionId) {
        await saveAnswer(questionId, answerValue.toString())
      }
    } catch (error) {
      console.error("Error saving answer:", error)
      toast({
        title: "Error",
        description: "Failed to save your answer.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }

    // Store answer locally
    setAnswers((prev) => ({ ...prev, [questionId]: answerValue }))

    // Move to the next question
    const nextIndex = getNextQuestionIndex(currentQuestionIndex)
    if (nextIndex !== -1) {
      setCurrentQuestionIndex(nextIndex)
      setState({
        question: questions[nextIndex],
        isTyping: false,
        showOptions: true,
        isIntro: false,
        isComplete: false,
      })
    } else {
      // All questions completed
      setState({
        question: {
          id: -1,
          text: "Thank you for completing the questionnaire! I'm preparing your summary now.",
          type: "text",
        },
        isTyping: false,
        showOptions: false,
        isIntro: false,
        isComplete: true,
      })

      // Format answers for the callback
      const formattedAnswers = Object.entries(answers).map(([id, value]) => {
        const question = questions.find(q => q.id === parseInt(id));
        return {
          question: question ? question.text : `Question ${id}`,
          answer: value.toString()
        };
      });

      // Call the onComplete callback with the session ID and formatted answers
      if (sessionId) {
        onComplete(sessionId, formattedAnswers);
      }
    }
  }

  // Handle moving to the previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = getNextQuestionIndex(currentQuestionIndex, "prev")
      if (prevIndex !== -1) {
        setCurrentQuestionIndex(prevIndex)
        setState({
          question: questions[prevIndex],
          isTyping: false,
          showOptions: true,
          isIntro: false,
          isComplete: false,
        })
      }
    }
  }

  // Handle multiple choice selection
  const handleOptionSelect = async (value: string) => {
    if (!state.question) return
    setAnswers((prev) => ({ ...prev, [state.question!.id]: value }))
    
    // Automatically proceed to the next question after a short delay
    setTimeout(() => {
      handleNextQuestion()
    }, 500)
  }

  // Handle checkbox selection
  const handleCheckboxChange = (option: string, checked: boolean) => {
    setCheckboxValues((prev) => ({ ...prev, [option]: checked }))
  }

  // Variant styles for UI elements
  const messageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  }

  const optionsVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const optionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (questions.length === 0) return 0
    const percentage = (currentQuestionIndex / questions.length) * 100
    return Math.min(100, Math.max(0, percentage))
  }

  // Validate input based on question type
  const isInputValid = () => {
    if (!state.question) return false
    
    switch (state.question.type) {
      case "text":
        return textInput.trim().length > 0
      case "number":
        return numberInput.trim().length > 0 && !isNaN(Number(numberInput))
      case "multiple-choice":
        return !!answers[state.question.id]
      case "checkbox-multiple":
        return Object.values(checkboxValues).some(v => v === true)
      default:
        return true
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800 w-full">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-400 to-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${calculateProgress()}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    
      {/* Chat container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {/* Intro or AI message */}
          {(state.isIntro || state.question) && (
            <motion.div
              className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg max-w-4xl shadow-sm border border-blue-100 dark:border-blue-800"
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              key={state.question ? `question-${state.question.id}` : "intro"}
            >
              {state.isTyping ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-500"></div>
                </div>
              ) : (
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  <p className="text-gray-800 dark:text-gray-200">{state.question?.text}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* User answer display if already answered */}
          {state.question && answers[state.question.id] && !state.isIntro && (
            <motion.div
              className="bg-primary text-primary-foreground p-4 rounded-lg max-w-4xl ml-auto shadow-sm"
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              key={`answer-${state.question.id}`}
            >
              <p>{answers[state.question.id]}</p>
            </motion.div>
          )}

          {/* Input options based on question type */}
          {state.showOptions && state.question && !state.isIntro && !answers[state.question.id] && (
            <motion.div
              className="space-y-4 max-w-4xl"
              variants={optionsVariants}
              initial="hidden"
              animate="visible"
              key={`options-${state.question.id}`}
              layout
            >
              {state.question.type === "multiple-choice" && state.question.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.question.options.map((option) => (
                    <motion.div key={option} variants={optionVariants}>
                      <Button
                        variant={answers[state.question!.id] === option ? "default" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => handleOptionSelect(option)}
                      >
                        {option}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {state.question.type === "text" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Textarea
                      placeholder={state.question.placeholder}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && textInput.trim().length > 0) {
                          e.preventDefault();
                          handleNextQuestion();
                        }
                      }}
                      className={`w-full border-2 ${
                        textInput.trim() === '' ? 'border-red-200 focus:border-red-300' : 'border-green-200 focus:border-green-300'
                      } transition-colors duration-200`}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: textInput.trim() ? 1 : 0, y: textInput.trim() ? 0 : 10 }}
                      className="absolute right-3 top-3 text-green-500"
                    >
                      {textInput.trim() && <Check className="h-4 w-4" />}
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {textInput.trim() === '' && 
                        <span className="text-red-500">This field is required</span>
                      }
                    </div>
                    <div className="text-xs text-gray-500">Press Enter to continue</div>
                  </div>
                </div>
              )}

              {state.question.type === "number" && (
                <div className="space-y-2">
                  <div className="relative flex items-center space-x-2">
                    {state.question.prefix && (
                      <span className="text-gray-500 absolute left-3 z-10">{state.question.prefix}</span>
                    )}
                    <Input
                      ref={inputRef}
                      type="number"
                      placeholder={state.question.placeholder}
                      value={numberInput}
                      onChange={(e) => setNumberInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && numberInput.trim().length > 0) {
                          e.preventDefault();
                          handleNextQuestion();
                        }
                      }}
                      className={`w-full ${state.question.prefix ? 'pl-6' : ''} border-2 ${
                        numberInput.trim() === '' ? 'border-red-200 focus:border-red-300' : 'border-green-200 focus:border-green-300'
                      } transition-colors duration-200`}
                    />
                    {state.question.suffix && <span className="text-gray-500">{state.question.suffix}</span>}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: numberInput.trim() ? 1 : 0, 
                        scale: numberInput.trim() ? 1 : 0.8 
                      }}
                      className="absolute right-3 text-green-500"
                    >
                      {numberInput.trim() && <Check className="h-4 w-4" />}
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {numberInput.trim() === '' && 
                        <span className="text-red-500">This field is required</span>
                      }
                    </div>
                    <div className="text-xs text-gray-500">Press Enter to continue</div>
                  </div>
                </div>
              )}

              {state.question.type === "checkbox-multiple" && state.question.options && (
                <div className="space-y-4">
                  <div className="space-y-3 p-1">
                    {state.question.options.map((option) => (
                      <motion.div 
                        key={option} 
                        variants={optionVariants} 
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Checkbox
                          id={`checkbox-${option}`}
                          checked={checkboxValues[option] || false}
                          onCheckedChange={(checked) => handleCheckboxChange(option, checked === true)}
                          className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label 
                          htmlFor={`checkbox-${option}`}
                          className="cursor-pointer select-none flex-1"
                        >
                          {option}
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    {!Object.values(checkboxValues).some(v => v === true) && 
                      <span className="text-xs text-red-500">Please select at least one option</span>
                    }
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextQuestion}
                      disabled={!Object.values(checkboxValues).some(v => v === true)}
                      className={Object.values(checkboxValues).some(v => v === true) ? "ml-auto block border-green-200 hover:border-green-300" : "ml-auto block"}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Completion message */}
          {state.isComplete && (
            <motion.div
              className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg max-w-4xl shadow-sm border border-green-100 dark:border-green-800"
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              key="completion"
            >
              <div className="prose prose-green dark:prose-invert max-w-none">
                <h3 className="text-green-800 dark:text-green-300">Questionnaire Complete!</h3>
                <p className="text-gray-800 dark:text-gray-200">
                  Thank you for completing the insurance fact find questionnaire. Your answers have been saved.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="border-t p-4 bg-background">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0 || state.isComplete}
            className={`${currentQuestionIndex === 0 ? "opacity-50" : ""}`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="text-xs text-gray-500">
            {!state.isComplete && state.question && !state.isIntro
              ? `Question ${currentQuestionIndex + 1} of ${questions.length}`
              : ""}
          </div>

          <Button
            size="sm"
            onClick={handleNextQuestion}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Please wait
              </>
            ) : state.isComplete ? (
              "View Summary"
            ) : (
              <>
                {state.isIntro ? "Start" : "Next"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}