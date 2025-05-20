import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";

// Form schema for Excel settings
const excelSettingsSchema = z.object({
  excelTemplate: z.string(),
});

type ExcelSettingsFormValues = z.infer<typeof excelSettingsSchema>;

export default function ExcelSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const res = await fetch("/api/config", {
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch Excel settings");
      return res.json();
    },
  });

  // Set up form with defaults from fetched config
  const form = useForm<ExcelSettingsFormValues>({
    resolver: zodResolver(excelSettingsSchema),
    defaultValues: {
      excelTemplate: config?.excelTemplate || "",
    },
    values: {
      excelTemplate: config?.excelTemplate || "",
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ExcelSettingsFormValues) => {
      return apiRequest("PUT", "/api/config", data, {
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Success",
        description: "Excel settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update Excel settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (values: ExcelSettingsFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Excel Configuration</h2>
      </div>
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="excelTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excel Template URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optionally provide a Google Sheets URL or template reference.
                    When left empty, the system generates a standard Excel format.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-4 border rounded-md bg-gray-50">
              <h3 className="text-sm font-medium mb-2">Excel Structure</h3>
              <p className="text-sm text-gray-600 mb-4">
                The exported Excel file will contain the following data by default:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Session ID and completion date</li>
                <li>Client name and email</li>
                <li>All questions and answers in separate rows</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
