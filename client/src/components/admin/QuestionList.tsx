import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface QuestionListProps {
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
}

export default function QuestionList({ onAddQuestion, onEditQuestion }: QuestionListProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    staleTime: 60000, // 1 minute
  });

  // Delete question mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/questions/${id}`, undefined, {
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Question deleted",
        description: "The question has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteQuestion = async () => {
    if (deleteQuestionId !== null) {
      await deleteMutation.mutateAsync(deleteQuestionId);
      setDeleteQuestionId(null);
    }
  };

  // Function to render question type badge
  const renderTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string }> = {
      text: { bg: "bg-blue-100", text: "text-blue-800" },
      date: { bg: "bg-green-100", text: "text-green-800" },
      "multiple-choice": { bg: "bg-purple-100", text: "text-purple-800" },
      "yes/no": { bg: "bg-yellow-100", text: "text-yellow-800" },
      number: { bg: "bg-pink-100", text: "text-pink-800" },
    };

    const config = typeConfig[type] || { bg: "bg-gray-100", text: "text-gray-800" };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  // Function to render conditional logic description
  const renderConditionalLogic = (question: Question) => {
    if (!question.conditionalLogic) return <span className="text-sm text-gray-500">None</span>;

    try {
      const logic = typeof question.conditionalLogic === 'string'
        ? JSON.parse(question.conditionalLogic)
        : question.conditionalLogic;

      if (!logic || !logic.if || !logic.then) {
        return <span className="text-sm text-gray-500">None</span>;
      }

      return (
        <span className="text-sm">
          If {logic.if.answer} → {logic.then.action} {logic.then.target}
        </span>
      );
    } catch {
      return <span className="text-sm text-gray-500">Invalid logic</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Questions Management</h2>
          <Button disabled>Loading...</Button>
        </div>
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Questions Management</h2>
          <Button onClick={onAddQuestion}>Add Question</Button>
        </div>
        <div className="p-4">
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logic</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No questions yet. Click "Add Question" to create your first question.
                    </td>
                  </tr>
                ) : (
                  questions
                    .sort((a, b) => a.order - b.order)
                    .map((question) => (
                      <tr key={question.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <i className="fas fa-grip-vertical text-gray-400 cursor-grab"></i>
                            <span>{question.order}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{question.text}</div>
                        </td>
                        <td className="px-6 py-4">
                          {renderTypeBadge(question.type)}
                        </td>
                        <td className="px-6 py-4">
                          {renderConditionalLogic(question)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => onEditQuestion(question)}
                            >
                              Edit
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => setDeleteQuestionId(question.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteQuestionId !== null} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question and may affect any conditional logic referring to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
