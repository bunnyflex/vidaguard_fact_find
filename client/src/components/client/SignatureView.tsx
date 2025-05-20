import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import SignatureCanvas from "react-signature-canvas";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/auth/ClerkProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SignatureViewProps {
  sessionId: number;
  answers: Array<{ question: string; answer: string }>;
  onGoBack: () => void;
}

export default function SignatureView({ sessionId, answers, onGoBack }: SignatureViewProps) {
  // Use mock authentication directly - it will handle both dev and production modes
  const { user } = useMockUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  // Update session with signature and generate PDF
  const generatePdfMutation = useMutation({
    mutationFn: async (signatureData: string) => {
      // First update the session with signature data
      await apiRequest("PUT", `/api/sessions/${sessionId}`, {
        signatureData,
        completedAt: new Date().toISOString(),
      }, {
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });

      // Then generate PDF
      const response = await fetch(`/api/sessions/${sessionId}/pdf`, {
        method: "POST",
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || response.statusText);
      }

      // Return PDF blob
      return await response.blob();
    },
    onSuccess: (pdfBlob) => {
      setIsSubmitting(false);
      setShowDownloadOptions(true);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fact-find-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Success!",
        description: "Your form has been submitted and PDF downloaded.",
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Generate Excel file
  const generateExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/excel`, {
        method: "GET",
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || response.statusText);
      }

      return await response.blob();
    },
    onSuccess: (excelBlob) => {
      // Create download link
      const url = URL.createObjectURL(excelBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fact-find-${sessionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Success!",
        description: "Excel file downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate Excel file: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle signature clear
  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please sign the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Get signature data as base64 string
    const signatureData = sigCanvasRef.current.toDataURL();
    
    // Send to server
    generatePdfMutation.mutate(signatureData);
  };

  // Handle Excel download
  const handleExcelDownload = () => {
    generateExcelMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Review & Sign</h2>
        <p className="mb-6">Please review your information and sign below to confirm that all provided details are accurate to the best of your knowledge.</p>
        
        {/* Summary accordion */}
        <div className="mb-6 border rounded-md">
          <Accordion type="single" collapsible defaultValue="summary">
            <AccordionItem value="summary">
              <AccordionTrigger className="px-4 py-3 text-left font-medium">
                View Summary
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4">
                  <div className="space-y-4 text-sm">
                    {answers.map((item, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4">
                        <div className="font-medium">{item.question}:</div>
                        <div>{item.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Signature pad */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Signature</label>
          <div className="border rounded-md p-2 bg-gray-50">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md h-32"
              style={{ touchAction: "none" }}
            >
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  className: "w-full h-full",
                  style: { touchAction: "none" }
                }}
                backgroundColor="rgba(0, 0, 0, 0)"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button 
              variant="ghost" 
              className="text-sm text-primary hover:underline"
              onClick={handleClearSignature}
            >
              Clear
            </Button>
          </div>
        </div>
        
        {/* Submit and download buttons */}
        {!showDownloadOptions ? (
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={onGoBack}
              disabled={isSubmitting}
            >
              Go Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">
                    <i className="fas fa-spinner"></i>
                  </span>
                  Processing...
                </>
              ) : (
                "Submit & Generate PDF"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-green-600 font-medium">
              Your form has been submitted successfully!
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="outline"
                onClick={handleExcelDownload}
                disabled={generateExcelMutation.isPending}
              >
                {generateExcelMutation.isPending ? (
                  <span className="animate-spin mr-2">
                    <i className="fas fa-spinner"></i>
                  </span>
                ) : (
                  <i className="fas fa-file-excel mr-2"></i>
                )}
                Download as Excel
              </Button>
              <Button onClick={() => window.location.href = "/"}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
