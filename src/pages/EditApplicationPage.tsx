import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ArrowLeft, Save } from 'lucide-react';
import { JobApplication, applicationsApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Define the form schema with Zod - similar to NewApplicationPage
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

const EditApplicationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<JobApplication | null>(null);
  
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

  // Fetch the application data
  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) {
        toast.error('No application ID provided');
        navigate('/dashboard');
        return;
      }

      console.log("Fetching application with ID:", id, "Type:", typeof id);
      
      // Extract the string ID from potential MongoDB ObjectId structure
      let applicationId = "";
      if (typeof id === 'string') {
        // Handle potential serialized MongoDB ObjectId
        try {
          const parsedId = JSON.parse(id);
          if (parsedId && parsedId.$oid) {
            applicationId = parsedId.$oid;
          } else {
            applicationId = id;
          }
        } catch (e) {
          // If it's not a JSON string, use the ID as is
          applicationId = id;
        }
      } else if (typeof id === 'object') {
        // Direct object reference
        const objectId = id as any;
        if (objectId.$oid) {
          applicationId = objectId.$oid;
        }
      }
      
      console.log("Using application ID:", applicationId, "Type:", typeof applicationId);

      setIsLoading(true);
      try {
        // Use the dedicated method to get application by ID
        const foundApplication = await applicationsApi.getById(applicationId);
        
        if (!foundApplication) {
          toast.error('Application not found');
          navigate('/dashboard');
          return;
        }

        console.log("Found application:", foundApplication);
        setApplication(foundApplication);
        
        // Set form values from the application
        form.reset({
          recipient_email: foundApplication.recipient_email,
          company: foundApplication.company || '',
          position: foundApplication.position || '',
          subject: foundApplication.subject || '',
          content: foundApplication.content || '',
          full_name: foundApplication.full_name || '',
          portfolio_url: foundApplication.portfolio_url || '',
          linkedin_url: foundApplication.linkedin_url || ''
        });
      } catch (error) {
        console.error('Error fetching application:', error);
        toast.error('Failed to load application');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication();
  }, [id, navigate, form]);

  const handleSaveChanges = async (values: FormValues) => {
    if (!id || !application) {
      toast.error('Application data missing');
      return;
    }

    setIsSaving(true);
    try {
      // Update the application with new values
      const success = await applicationsApi.update(id, {
        ...values,
        // Preserve the status and other fields not in the form
        status: application.status
      });
      
      if (success) {
        toast.success('Application updated successfully');
        navigate('/dashboard');
      } else {
        toast.error('Failed to update application');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'default';
      case 'responded':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'accepted':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
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
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Edit Application</h1>
            {application && (
              <Badge variant={getStatusBadgeVariant(application.status)}>
                Status: {application.status}
              </Badge>
            )}
          </div>
        </div>
        
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>
              Edit your job application details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="recipient_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Email</FormLabel>
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
                          <FormLabel>Your Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
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
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="Software Engineer" {...field} />
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
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Application for Software Engineer position" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="portfolio_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourportfolio.com" {...field} />
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
                            <Input placeholder="https://linkedin.com/in/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Application email content..." 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Edit your application email content here.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditApplicationPage; 