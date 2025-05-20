import { apiRequest } from "./queryClient";

interface FactFindData {
  sessionId: number;
  signatureData: string;
}

/**
 * Generate a PDF document from the fact find session data
 * This is a client-side wrapper around the server-side PDF generation
 */
export async function generateFactFindPDF(data: FactFindData): Promise<Blob> {
  try {
    // First update session with signature data
    await apiRequest("PUT", `/api/sessions/${data.sessionId}`, {
      signatureData: data.signatureData,
      completedAt: new Date().toISOString(),
    });

    // Request PDF generation from server
    const response = await fetch(`/api/sessions/${data.sessionId}/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }

    // Return PDF blob
    return await response.blob();
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF: ${(error as Error).message}`);
  }
}

/**
 * Download the PDF file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  generateFactFindPDF,
  downloadPDF,
};
