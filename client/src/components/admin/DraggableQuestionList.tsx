import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { GripVertical, Pencil, Trash } from "lucide-react";
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

export default function DraggableQuestionList({ onAddQuestion, onEditQuestion }: QuestionListProps) {
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
      return apiRequest("DELETE", `/api/questions/${id}`);
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

  // Update question order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number; order: number }) => {
      return apiRequest("PATCH", `/api/questions/${id}`, { order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update question order: ${error.message}`,
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

  // Handle drag end event
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped to the same position
    if (source.index === destination.index) {
      return;
    }

    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
    const draggedQuestion = sortedQuestions[source.index];
    
    // Remove from original position
    sortedQuestions.splice(source.index, 1);
    
    // Insert at new position
    sortedQuestions.splice(destination.index, 0, draggedQuestion);
    
    // Update order of all affected questions
    sortedQuestions.forEach((question, index) => {
      if (question.order !== index + 1) {
        updateOrderMutation.mutate({ id: question.id, order: index + 1 });
      }
    });

    toast({
      title: "Question order updated",
      description: "The question order has been successfully updated.",
    });
  };

  // Function to render question type badge
  const renderTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string }> = {
      text: { bg: "bg-blue-100", text: "text-blue-800" },
      date: { bg: "bg-green-100", text: "text-green-800" },
      "multiple-choice": { bg: "bg-purple-100", text: "text-purple-800" },
      "checkbox-multiple": { bg: "bg-yellow-100", text: "text-yellow-800" },
      number: { bg: "bg-pink-100", text: "text-pink-800" },
    };

    const config = typeConfig[type] || { bg: "bg-gray-100", text: "text-gray-800" };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
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

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Questions Management</h2>
          <Button onClick={onAddQuestion}>Add Question</Button>
        </div>
        <div className="p-4">
          <div className="overflow-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <table 
                    className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Question</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Depends On</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {sortedQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No questions yet. Click "Add Question" to create your first question.
                          </td>
                        </tr>
                      ) : (
                        sortedQuestions.map((question, index) => (
                          <Draggable key={question.id.toString()} draggableId={question.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${snapshot.isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <span className="font-medium">{question.order}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="max-w-sm text-sm truncate">{question.text}</div>
                                </td>
                                <td className="px-6 py-4">
                                  {renderTypeBadge(question.type)}
                                </td>
                                <td className="px-6 py-4">
                                  {question.dependsOn ? (
                                    <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-full">
                                      Q{question.dependsOn.questionId}: {question.dependsOn.value}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex space-x-4">
                                    <button 
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                      onClick={() => onEditQuestion(question)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span>Edit</span>
                                    </button>
                                    <button 
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                                      onClick={() => setDeleteQuestionId(question.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </tbody>
                  </table>
                )}
              </Droppable>
            </DragDropContext>
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
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}