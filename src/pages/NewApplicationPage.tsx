import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Send, Save, FileText } from 'lucide-react';
import { applicationsApi } from '@/lib/api';
import { useEmailSettingsStore } from '@/store/emailSettingsStore';

// Define the form schema with Zod
const formSchema = z.object({
  recipient_email: z.string().email({ message: "Please enter a valid email address" }),
  company: z.string().min(1, { message: "Company name is required" }),
  position: z.string().min(1, { message: "Position is required" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  content: z.string().min(20, { message: "Content should be at least 20 characters" }),
  full_name: z.string().min(1, { message: "Your full name is required" }),
  portfolio_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  linkedin_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal(''))
});

type FormValues = z.infer<typeof formSchema>;

const NewApplicationPage = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  // Get email settings from store
  const { settings: emailSettings } = useEmailSettingsStore();
  
  // Set up the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient_email: '',
      company: '',
      position: '',
      subject: '',
      content: '',
      full_name: '',
      portfolio_url: '',
      linkedin_url: ''
    }
  });

  // Handle applying the job application template
  const applyJobApplicationTemplate = () => {
    if (!emailSettings.templates?.jobApplication) {
      toast.error("No job application template found. Please set up a template in Settings.");
      return;
    }

    const recipientEmail = form.getValues('recipient_email');
    const company = form.getValues('company');
    const position = form.getValues('position');
    const fullName = form.getValues('full_name');

    // Apply template with replacements
    let content = emailSettings.templates.jobApplication;
    content = content.replace(/{recipientName}/g, recipientEmail.split('@')[0] || 'Hiring Manager');
    content = content.replace(/{company}/g, company || '[Company Name]');
    content = content.replace(/{position}/g, position || '[Position]');
    content = content.replace(/{senderName}/g, fullName || emailSettings.senderName || 'Job Applicant');
    content = content.replace(/{customMessage}/g, 'I am excited about the opportunity to contribute to your team and am eager to discuss how my background aligns with your needs.');
    
    // Generate subject line if empty
    if (!form.getValues('subject')) {
      form.setValue('subject', `Application for ${position} position at ${company}`);
    }
    
    form.setValue('content', content, { shouldValidate: true });
    toast.success("Job application template applied!");
  };

  // Auto-fill sender's name and email when component mounts
  useEffect(() => {
    if (emailSettings.senderName && form.getValues('full_name') === '') {
      form.setValue('full_name', emailSettings.senderName);
    }
  }, [emailSettings, form]);

  const handleCreateDraft = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Add status field to create a draft
      const response = await applicationsApi.create({
        ...values,
        status: 'draft'
      });
      
      if (response) {
        toast.success('Draft created successfully');
        navigate('/dashboard');
      } else {
        toast.error('Failed to create draft');
      }
    } catch (error) {
      console.error('Error creating draft:', error);
      toast.error('Failed to create draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCreateApplication = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Check if email settings are configured
      if (!emailSettings.senderEmail || !emailSettings.senderPassword) {
        toast.error("Please configure your email settings first");
        return;
      }
      
      // Use the applications API to create the application directly
      // The backend will handle email sending based on the status
      const response = await applicationsApi.create({
        // Application data
        recipient_email: values.recipient_email,
        company: values.company,
        position: values.position,
        subject: values.subject,
        content: values.content,
        full_name: values.full_name,
        portfolio_url: values.portfolio_url || '',
        linkedin_url: values.linkedin_url || '',
        
        // Email sending settings - backend will use these to send email
        sender_email: emailSettings.senderEmail,
        sender_name: emailSettings.senderName,
        sender_password: emailSettings.senderPassword,
        
        // Set status to 'processing' to trigger email sending in the backend
        status: 'processing'
      });
      
      if (response && response.success) {
        toast.success('Application created successfully');
        navigate('/dashboard');
      } else if (response) {
        // Handle case where application might have been created but with a 'failed' status
        if (response.id) {
          toast.warning(`Application created but email may have failed to send: ${response.error || 'Unknown error'}`);
          navigate('/dashboard');
        } else {
          toast.error(response.error || 'Failed to create application');
        }
      } else {
        toast.error('Failed to connect to server');
      }
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error('Failed to create application. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold">Create New Application</h1>
        </div>
        
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Job Application Details</CardTitle>
            <CardDescription>
              Fill out the form below to create a new job application. You can save it as a draft or send it immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="recipient_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="hiring@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <FormControl>
                          <Input placeholder="Job Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Application for [Position] at [Company]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Email Content *</FormLabel>
                        <div className="flex justify-end mb-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={applyJobApplicationTemplate}
                            className="flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Apply Template
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea 
                            placeholder="Your application email content" 
                            className="min-h-[200px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="portfolio_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://portfolio.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-4 pt-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => handleCreateDraft(form.getValues())}
                    disabled={isSaving || !form.formState.isValid}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => handleCreateApplication(form.getValues())}
                    disabled={isSaving || !form.formState.isValid}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Application
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewApplicationPage; 