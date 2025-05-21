import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { GripVertical, Trash, Plus, ChevronDown, Edit3, CopyIcon, ArrowDown, ArrowUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

export default function VisualQuestionEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // New question state
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'text',
    options: [] as string[],
    order: 0,
    placeholder: '',
    prefix: '',
    suffix: '',
    dependsOn: null as { questionId: number; value: string | boolean } | null,
  });

  // Option being added
  const [newOption, setNewOption] = useState('');

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    if (questions.length > 0 && isAddingQuestion) {
      const maxOrder = Math.max(...questions.map(q => q.order));
      setNewQuestion(prev => ({ ...prev, order: maxOrder + 1 }));
    }
  }, [questions, isAddingQuestion]);

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

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async (questionData: any) => {
      return apiRequest("POST", "/api/questions", questionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsAddingQuestion(false);
      resetNewQuestion();
      toast({
        title: "Question created",
        description: "The question has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update question mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setEditingQuestionId(null);
      toast({
        title: "Question updated",
        description: "The question has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error.message}`,
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

  const handleAddQuestion = () => {
    const questionToCreate = { ...newQuestion };
    
    // If type requires options but none provided, add a default
    if ((questionToCreate.type === 'multiple-choice' || questionToCreate.type === 'checkbox-multiple') 
        && (!questionToCreate.options || questionToCreate.options.length === 0)) {
      questionToCreate.options = ['Option 1'];
    }
    
    createMutation.mutate(questionToCreate);
  };

  const resetNewQuestion = () => {
    setNewQuestion({
      text: '',
      type: 'text',
      options: [],
      order: 0,
      placeholder: '',
      prefix: '',
      suffix: '',
      dependsOn: null,
    });
    setNewOption('');
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setNewQuestion({
        ...newQuestion,
        options: [...(newQuestion.options || []), newOption.trim()]
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions.splice(index, 1);
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  // Move question up/down in order
  const moveQuestion = (questionId: number, direction: 'up' | 'down') => {
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
    const currentIndex = sortedQuestions.findIndex(q => q.id === questionId);
    
    if (currentIndex === -1) return;
    
    // Can't move first item up or last item down
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === sortedQuestions.length - 1)
    ) {
      return;
    }
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetQuestion = sortedQuestions[targetIndex];
    const currentQuestion = sortedQuestions[currentIndex];
    
    // Swap the orders
    updateOrderMutation.mutate({ id: currentQuestion.id, order: targetQuestion.order });
    updateOrderMutation.mutate({ id: targetQuestion.id, order: currentQuestion.order });
  };

  // Handle drag end event for reordering questions
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
  const renderQuestionTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'text': 'Text',
      'number': 'Number',
      'multiple-choice': 'Multiple Choice',
      'checkbox-multiple': 'Checkboxes',
      'date': 'Date'
    };
    
    return typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Question Editor</h2>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Question Editor</h2>
        <Button 
          onClick={() => setIsAddingQuestion(true)}
          disabled={isAddingQuestion}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Question
        </Button>
      </div>

      {/* Add New Question Form */}
      {isAddingQuestion && (
        <Card className="bg-white dark:bg-gray-800 border-2 border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Create a New Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text</Label>
              <Textarea
                id="question-text"
                placeholder="Enter your question here..."
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-type">Question Type</Label>
                <Select
                  value={newQuestion.type}
                  onValueChange={(value) => setNewQuestion({...newQuestion, type: value})}
                >
                  <SelectTrigger id="question-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="checkbox-multiple">Checkboxes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-placeholder">Placeholder Text</Label>
                <Input
                  id="question-placeholder"
                  placeholder="Enter placeholder..."
                  value={newQuestion.placeholder || ''}
                  onChange={(e) => setNewQuestion({...newQuestion, placeholder: e.target.value})}
                />
              </div>
            </div>

            {(newQuestion.type === 'number') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="question-prefix">Prefix</Label>
                  <Input
                    id="question-prefix"
                    placeholder="E.g. £, $, etc."
                    value={newQuestion.prefix || ''}
                    onChange={(e) => setNewQuestion({...newQuestion, prefix: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question-suffix">Suffix</Label>
                  <Input
                    id="question-suffix"
                    placeholder="E.g. kg, cm, etc."
                    value={newQuestion.suffix || ''}
                    onChange={(e) => setNewQuestion({...newQuestion, suffix: e.target.value})}
                  />
                </div>
              </div>
            )}

            {(newQuestion.type === 'multiple-choice' || newQuestion.type === 'checkbox-multiple') && (
              <div className="space-y-3">
                <Label>Options</Label>
                {newQuestion.options && newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-grow flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border rounded-md p-2">
                      {newQuestion.type === 'multiple-choice' ? (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                      ) : (
                        <div className="h-4 w-4 rounded border-2 border-gray-300"></div>
                      )}
                      <span>{option}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  {newQuestion.type === 'multiple-choice' ? (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                  ) : (
                    <div className="h-4 w-4 rounded border-2 border-gray-300"></div>
                  )}
                  <Input
                    placeholder="Add option"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    className="flex-grow"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleAddOption}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Conditional Logic */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Conditional Logic</Label>
                <Switch
                  checked={!!newQuestion.dependsOn}
                  onCheckedChange={(checked) => 
                    setNewQuestion({
                      ...newQuestion, 
                      dependsOn: checked ? { questionId: 0, value: '' } : null
                    })
                  }
                />
              </div>
              
              {newQuestion.dependsOn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-2">
                    <Label htmlFor="depends-question">Show this question when:</Label>
                    <Select
                      value={newQuestion.dependsOn.questionId.toString()}
                      onValueChange={(value) => setNewQuestion({
                        ...newQuestion, 
                        dependsOn: { 
                          ...newQuestion.dependsOn!, 
                          questionId: parseInt(value)
                        }
                      })}
                    >
                      <SelectTrigger id="depends-question">
                        <SelectValue placeholder="Select question" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedQuestions.map((q) => (
                          <SelectItem key={q.id} value={q.id.toString()}>
                            {q.text.length > 30 ? q.text.substring(0, 30) + '...' : q.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="depends-value">Has the value:</Label>
                    <Input
                      id="depends-value"
                      placeholder="Enter value..."
                      value={newQuestion.dependsOn.value.toString()}
                      onChange={(e) => setNewQuestion({
                        ...newQuestion, 
                        dependsOn: { 
                          ...newQuestion.dependsOn!, 
                          value: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingQuestion(false);
                resetNewQuestion();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddQuestion}
              disabled={!newQuestion.text.trim()}
            >
              Save Question
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Questions List */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {sortedQuestions.length === 0 ? (
                <div className="p-8 text-center border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-gray-500 dark:text-gray-400">No questions yet. Click "Add Question" to create your first question.</p>
                </div>
              ) : (
                sortedQuestions.map((question, index) => (
                  <Draggable 
                    key={question.id.toString()} 
                    draggableId={question.id.toString()} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${
                          snapshot.isDragging ? 'border-primary shadow-lg' : ''
                        } bg-white dark:bg-gray-800`}
                      >
                        <CardHeader className="pb-2 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                {...provided.dragHandleProps} 
                                className="cursor-grab p-1"
                              >
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="grid gap-1">
                                <CardTitle className="text-base font-medium">
                                  {question.text}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-400">
                                    {renderQuestionTypeLabel(question.type)}
                                  </span>
                                  {question.dependsOn && (
                                    <span className="text-xs rounded-full bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 text-orange-700 dark:text-orange-300">
                                      Conditional
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => moveQuestion(question.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => moveQuestion(question.id, 'down')}
                                disabled={index === sortedQuestions.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setExpandedQuestionId(
                                  expandedQuestionId === question.id ? null : question.id
                                )}
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${
                                  expandedQuestionId === question.id ? 'rotate-180' : ''
                                }`} />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {expandedQuestionId === question.id && (
                          <CardContent className="pt-0">
                            <div className="pt-4 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Question Details</h4>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="font-medium">Type:</span> {renderQuestionTypeLabel(question.type)}
                                    </p>
                                    {question.placeholder && (
                                      <p className="text-sm">
                                        <span className="font-medium">Placeholder:</span> {question.placeholder}
                                      </p>
                                    )}
                                    {question.prefix && (
                                      <p className="text-sm">
                                        <span className="font-medium">Prefix:</span> {question.prefix}
                                      </p>
                                    )}
                                    {question.suffix && (
                                      <p className="text-sm">
                                        <span className="font-medium">Suffix:</span> {question.suffix}
                                      </p>
                                    )}
                                    <p className="text-sm">
                                      <span className="font-medium">Order:</span> {question.order}
                                    </p>
                                  </div>
                                </div>

                                {(question.type === 'multiple-choice' || question.type === 'checkbox-multiple') && question.options && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Options</h4>
                                    <div className="space-y-1">
                                      {question.options.map((option, i) => (
                                        <div key={i} className="text-sm flex items-center gap-2">
                                          <span className="h-2 w-2 rounded-full bg-primary"></span>
                                          {option}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {question.dependsOn && (
                                  <div className="col-span-full">
                                    <h4 className="text-sm font-medium mb-2">Conditional Logic</h4>
                                    <div className="text-sm p-2 rounded bg-gray-50 dark:bg-gray-900">
                                      This question is shown when question #{question.dependsOn.questionId} 
                                      has the value "{question.dependsOn.value}"
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end gap-2 mt-4">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={() => {
                                    // Duplicate question functionality would go here
                                    // For now just show a toast
                                    toast({
                                      title: "Feature coming soon",
                                      description: "Question duplication will be available in a future update."
                                    });
                                  }}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                  Duplicate
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={() => setEditingQuestionId(question.id)}
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={() => setDeleteQuestionId(question.id)}
                                >
                                  <Trash className="h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction 
              onClick={handleDeleteQuestion}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}