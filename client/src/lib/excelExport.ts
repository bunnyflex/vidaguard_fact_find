/**
 * Generate and download an Excel file with fact find data
 * This is a client-side wrapper around the server-side Excel generation
 */
export async function generateFactFindExcel(sessionId: number): Promise<Blob> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/excel`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }

    // Return Excel blob
    return await response.blob();
  } catch (error) {
    console.error("Error generating Excel:", error);
    throw new Error(`Failed to generate Excel: ${(error as Error).message}`);
  }
}

/**
 * Download the Excel file
 */
export function downloadExcel(blob: Blob, filename: string): void {
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
  generateFactFindExcel,
  downloadExcel,
};
