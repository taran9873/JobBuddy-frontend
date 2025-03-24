import React, { useState } from 'react';
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FollowUpSettings, JobApplication, applicationsApi } from '@/lib/api';

// Define form validation schema
const formSchema = z.object({
  type: z.enum(["one_time", "periodic_limited", "until_response"], {
    required_error: "Please select a follow-up type",
  }),
  interval_days: z.coerce.number()
    .min(1, "Interval must be at least 1 day")
    .max(30, "Interval must be at most 30 days"),
  max_count: z.coerce.number()
    .min(1, "Maximum follow-up count must be at least 1")
    .max(10, "Maximum follow-up count must be at most 10"),
  follow_up_count: z.coerce.number().optional()
});

interface FollowUpSettingsDialogProps {
  application: JobApplication;
  onSettingsUpdated: (updatedSettings: FollowUpSettings) => void;
  trigger?: React.ReactNode;
}

const FollowUpSettingsDialog: React.FC<FollowUpSettingsDialogProps> = ({ 
  application, 
  onSettingsUpdated,
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up form with default values from application
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: application.follow_up_settings?.type || "periodic_limited",
      interval_days: application.follow_up_settings?.interval_days || 7,
      max_count: application.follow_up_settings?.max_count || 3,
      follow_up_count: application.follow_up_settings?.follow_up_count || 0
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Prepare settings object
      const updatedSettings: FollowUpSettings = {
        type: values.type,
        interval_days: values.interval_days,
        max_count: values.max_count,
        follow_up_count: values.follow_up_count || application.follow_up_settings?.follow_up_count || 0,
        last_follow_up_date: application.follow_up_settings?.last_follow_up_date || null,
        next_follow_up_date: application.follow_up_settings?.next_follow_up_date || null
      };
      
      console.log("Updating follow-up settings for application:", application);
      console.log("Application ID:", application._id, "Type:", typeof application._id);
      console.log("Settings to update:", updatedSettings);
      
      // Handle MongoDB ObjectId if present
      let applicationId = "";
      if (typeof application._id === 'string') {
        applicationId = application._id;
      } else if (typeof application._id === 'object') {
        // Cast to any to handle MongoDB ObjectId structure
        const objectId = application._id as any;
        if (objectId.$oid) {
          applicationId = objectId.$oid;
        }
      }
      
      console.log("Using application ID for update:", applicationId);
      
      // Update follow-up settings through API
      const success = await applicationsApi.updateFollowUpSettings(applicationId, updatedSettings);
      
      console.log("API update result:", success);
      
      if (success) {
        toast.success("Follow-up settings updated successfully");
        onSettingsUpdated(updatedSettings);
        setOpen(false);
      } else {
        toast.error("Failed to update follow-up settings");
      }
    } catch (error) {
      console.error("Error updating follow-up settings:", error);
      toast.error("An error occurred while updating follow-up settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Edit Follow-up Settings</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Follow-up Settings</DialogTitle>
          <DialogDescription>
            Configure how follow-up emails should be sent for this job application.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a follow-up type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="periodic_limited">Periodic (Limited)</SelectItem>
                      <SelectItem value="until_response">Until Response</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'one_time' && "Send a single follow-up email"}
                    {field.value === 'periodic_limited' && "Send follow-ups periodically with a maximum count"}
                    {field.value === 'until_response' && "Send follow-ups until a response is received"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="interval_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Interval (days)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={1} max={30} />
                  </FormControl>
                  <FormDescription>
                    Number of days to wait between follow-up emails
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="max_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Follow-ups</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={1} max={10} />
                  </FormControl>
                  <FormDescription>
                    Maximum number of follow-up emails to send
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="follow_up_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Follow-up Count</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={0} max={10} readOnly />
                  </FormControl>
                  <FormDescription>
                    Number of follow-up emails already sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpSettingsDialog; 