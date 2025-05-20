import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import QuestionList from "./QuestionList";
import QuestionEditor from "./QuestionEditor";
import AISettings from "./AISettings";
import EmailSettings from "./EmailSettings";
import ExcelSettings from "./ExcelSettings";
import { Question } from "@shared/schema";

type ActiveView = "questions" | "ai" | "email" | "excel" | "submissions";

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<ActiveView>("questions");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionEditor(true);
  };

  const handleCloseEditor = () => {
    setShowQuestionEditor(false);
    setEditingQuestion(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Admin sidebar */}
        <AdminSidebar activeView={activeView} onChangeView={setActiveView} />
        
        {/* Admin content area */}
        <div className="flex-1">
          {activeView === "questions" && !showQuestionEditor && (
            <QuestionList 
              onAddQuestion={handleAddQuestion}
              onEditQuestion={handleEditQuestion}
            />
          )}
          
          {activeView === "questions" && showQuestionEditor && (
            <QuestionEditor 
              question={editingQuestion} 
              onCancel={handleCloseEditor}
            />
          )}
          
          {activeView === "ai" && (
            <AISettings />
          )}
          
          {activeView === "email" && (
            <EmailSettings />
          )}
          
          {activeView === "excel" && (
            <ExcelSettings />
          )}
          
          {activeView === "submissions" && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Submissions</h2>
              </div>
              <div className="p-4">
                <p className="text-gray-500">View all form submissions here.</p>
                {/* Submissions table would be implemented here */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
