import { Draggable } from "react-beautiful-dnd";
import { Question } from "@shared/schema";
import { GripVertical, Pencil, Trash } from "lucide-react";

interface DraggableQuestionRowProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (id: number) => void;
}

export default function DraggableQuestionRow({ 
  question, 
  index, 
  onEdit, 
  onDelete 
}: DraggableQuestionRowProps) {
  
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

  return (
    <Draggable 
      draggableId={question.id.toString()} 
      index={index}
    >
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
                onClick={() => onEdit(question)}
              >
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button 
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                onClick={() => onDelete(question.id)}
              >
                <Trash className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      )}
    </Draggable>
  );
}