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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Form schema for email settings
const emailSettingsSchema = z.object({
  emailRecipients: z.string().min(5, "Recipients must be at least 5 characters"),
  emailTemplate: z.string(),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

export default function EmailSettings() {
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
      if (!res.ok) throw new Error("Failed to fetch email settings");
      return res.json();
    },
  });

  // Set up form with defaults from fetched config
  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      emailRecipients: config?.emailRecipients || "",
      emailTemplate: config?.emailTemplate || "",
    },
    values: {
      emailRecipients: config?.emailRecipients || "",
      emailTemplate: config?.emailTemplate || "",
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EmailSettingsFormValues) => {
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
        description: "Email settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update email settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (values: EmailSettingsFormValues) => {
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
        <h2 className="font-semibold">Email Setup</h2>
      </div>
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailRecipients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Recipients</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com, another@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated list of email addresses that will receive completed forms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Template (HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="<h1>Insurance Fact Find</h1><p>Client: {{userName}}</p>..."
                      className="min-h-[250px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {{userName}}, {{sessionId}}, and {{summary}} as placeholders. Leave empty for default template.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
