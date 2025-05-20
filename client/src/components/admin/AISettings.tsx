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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Form schema for AI settings
const aiSettingsSchema = z.object({
  aiModel: z.string(),
  aiPrompt: z.string().min(10, "System instructions must be at least 10 characters"),
  aiTemperature: z.string(),
});

type AISettingsFormValues = z.infer<typeof aiSettingsSchema>;

export default function AISettings() {
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
      if (!res.ok) throw new Error("Failed to fetch AI settings");
      return res.json();
    },
  });

  // Set up form with defaults from fetched config
  const form = useForm<AISettingsFormValues>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      aiModel: config?.aiModel || "gpt-4o",
      aiPrompt: config?.aiPrompt || "You are an insurance assistant helping collect fact-find information. Be polite, clear, and concise. Ask one question at a time and wait for the user's response before continuing.",
      aiTemperature: config?.aiTemperature || "0.7",
    },
    values: {
      aiModel: config?.aiModel || "gpt-4o",
      aiPrompt: config?.aiPrompt || "You are an insurance assistant helping collect fact-find information. Be polite, clear, and concise. Ask one question at a time and wait for the user's response before continuing.",
      aiTemperature: config?.aiTemperature || "0.7",
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: AISettingsFormValues) => {
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
        description: "AI settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update AI settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (values: AISettingsFormValues) => {
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
        <h2 className="font-semibold">AI Assistant Settings</h2>
      </div>
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="aiModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenAI Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an OpenAI model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    GPT-4o provides more sophisticated responses but costs more
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter instructions for the AI assistant..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    These instructions help guide the AI's behavior when responding to users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiTemperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature: {field.value}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={[parseFloat(field.value)]}
                        onValueChange={(value) => field.onChange(value[0].toString())}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>More Precise (0.0)</span>
                        <span>More Creative (1.0)</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Controls randomness: lower values are more deterministic, higher values are more creative
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
