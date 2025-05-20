import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertQuestionSchema, Question } from "@shared/schema";
import { useUser } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Extend the insert schema with validations
const formSchema = insertQuestionSchema.extend({
  text: z.string().min(5, "Question text must be at least 5 characters"),
  options: z.any().optional(), // Will be converted to JSON string
  conditionalLogic: z.any().optional(), // Will be converted to JSON string
});

type FormValues = z.infer<typeof formSchema>;

interface QuestionEditorProps {
  question: Question | null; // null for new question, Question for editing
  onCancel: () => void;
}

export default function QuestionEditor({ question, onCancel }: QuestionEditorProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [conditionalType, setConditionalType] = useState<string>("none");
  const [multiChoiceOptions, setMultiChoiceOptions] = useState<string[]>([""]);
  
  // Fetch questions for conditional logic selectors
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  // Set up form with defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: question?.text || "",
      type: question?.type || "text",
      order: question?.order || (questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 1),
      options: question?.options || [],
      conditionalLogic: question?.conditionalLogic || null,
    }
  });

  // Initialize multi-choice options from existing question
  useEffect(() => {
    if (question?.options) {
      try {
        const parsedOptions = typeof question.options === 'string'
          ? JSON.parse(question.options)
          : question.options;

        if (Array.isArray(parsedOptions)) {
          setMultiChoiceOptions(parsedOptions);
        }
      } catch (e) {
        console.error("Error parsing options:", e);
      }
    }
  }, [question]);

  // Initialize conditional logic UI state
  useEffect(() => {
    if (question?.conditionalLogic) {
      try {
        const logic = typeof question.conditionalLogic === 'string'
          ? JSON.parse(question.conditionalLogic)
          : question.conditionalLogic;

        if (logic && logic.if) {
          setConditionalType(logic.if.type || "none");
        }
      } catch (e) {
        console.error("Error parsing conditional logic:", e);
      }
    }
  }, [question]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/questions", data, {
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormValues }) => {
      return apiRequest("PUT", `/api/questions/${id}`, data, {
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle adding a new option for multiple choice
  const handleAddOption = () => {
    setMultiChoiceOptions([...multiChoiceOptions, ""]);
  };

  // Handle changing an option text
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...multiChoiceOptions];
    newOptions[index] = value;
    setMultiChoiceOptions(newOptions);
  };

  // Handle removing an option
  const handleRemoveOption = (index: number) => {
    const newOptions = multiChoiceOptions.filter((_, i) => i !== index);
    setMultiChoiceOptions(newOptions);
  };

  // Submit handler
  const onSubmit = (values: FormValues) => {
    const formData = { ...values };

    // Handle options based on question type
    if (formData.type === "multiple-choice") {
      formData.options = multiChoiceOptions.filter(Boolean);
    } else if (formData.type === "yes/no") {
      formData.options = ["Yes", "No"];
    } else {
      delete formData.options;
    }

    // Handle conditional logic
    if (conditionalType !== "none") {
      // Build conditional logic object
      formData.conditionalLogic = {
        if: {
          type: conditionalType,
          answer: form.getValues("conditionalAnswer"),
        },
        then: {
          action: form.getValues("conditionalAction"),
          target: form.getValues("conditionalTarget"),
        }
      };
    } else {
      delete formData.conditionalLogic;
    }

    if (question) {
      // Update existing question
      updateMutation.mutate({ id: question.id, data: formData });
    } else {
      // Create new question
      createMutation.mutate(formData);
    }
  };

  // Get current form type
  const currentType = form.watch("type");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{question ? "Edit Question" : "Add Question"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your question here..." 
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a question type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="yes/no">Yes/No</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Questions are displayed in ascending order
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Multiple choice options */}
            {currentType === "multiple-choice" && (
              <div className="space-y-3">
                <FormLabel>Options</FormLabel>
                {multiChoiceOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={e => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <i className="fas fa-times" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                  className="mt-2"
                >
                  <i className="fas fa-plus mr-2" />
                  Add Option
                </Button>
              </div>
            )}

            {/* Conditional Logic */}
            <div className="space-y-4 border rounded-md p-4">
              <h3 className="font-medium">Conditional Logic</h3>
              
              <div>
                <FormLabel>If answer is:</FormLabel>
                <Select 
                  value={conditionalType} 
                  onValueChange={setConditionalType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No condition</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="yes">Is Yes</SelectItem>
                    <SelectItem value="no">Is No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {conditionalType !== "none" && conditionalType !== "yes" && conditionalType !== "no" && (
                <div>
                  <FormLabel>Value:</FormLabel>
                  <Input {...form.register("conditionalAnswer")} placeholder="Answer value" />
                </div>
              )}

              {conditionalType !== "none" && (
                <div className="space-y-4">
                  <div>
                    <FormLabel>Then:</FormLabel>
                    <Select defaultValue="show" {...form.register("conditionalAction")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">Show question</SelectItem>
                        <SelectItem value="skip">Skip to question</SelectItem>
                        <SelectItem value="end">End form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FormLabel>Target Question:</FormLabel>
                    <Select defaultValue="" {...form.register("conditionalTarget")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target question" />
                      </SelectTrigger>
                      <SelectContent>
                        {questions
                          .filter(q => q.id !== question?.id)
                          .map(q => (
                            <SelectItem key={q.id} value={`Q${q.id}`}>
                              Q{q.order}: {q.text.substring(0, 30)}...
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {question ? "Save Changes" : "Create Question"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
