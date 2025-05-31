import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from '../components/Header';
import FollowUpSettingsDialog from '../components/FollowUpSettingsDialog';
import { JobApplication, FollowUp, FollowUpSettings, applicationsApi, followUpsApi, checkApiHealth } from '@/lib/api';
import { Calendar, Clock, Mail, Send, User, FileEdit, FilePenLine, Eye, Settings, Plus } from 'lucide-react';
import { safeFormatDate, safeFormatDistanceToNow } from '@/lib/utils';
import { useEmailSettingsStore } from '@/store/emailSettingsStore';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogTrigger } from '@/components/ui/dialog';

const Dashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [drafts, setDrafts] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState('applications');
  const [isLoading, setIsLoading] = useState({
    applications: true,
    followUps: true,
    drafts: true
  });
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  
  // Get email settings from store
  const { settings: emailSettings } = useEmailSettingsStore();

  // Function to refresh specific data
  const refreshData = async (dataType: 'applications' | 'followUps' | 'drafts') => {
    try {
      setIsLoading(prev => ({ ...prev, [dataType]: true }));
      
      switch (dataType) {
        case 'applications':
          console.log("Refreshing applications data...");
          const apps = await applicationsApi.getAll({ 
            status: 'sent',
            sort_field: 'updated_at',
            sort_order: -1
          });
          console.log("Applications data received:", apps);
          
          if (Array.isArray(apps)) {
            setApplications(apps);
          } else {
            console.error("Received non-array applications data:", apps);
            toast.error("Invalid data format received for applications");
          }
          break;
        case 'followUps':
          console.log("Refreshing follow-ups data...");
          const fups = await followUpsApi.getAll({
            sort_field: 'updated_at',
            sort_order: -1
          });
          console.log("Follow-ups data received:", fups);
          
          if (Array.isArray(fups)) {
            setFollowUps(fups);
          } else {
            console.error("Received non-array follow-ups data:", fups);
            toast.error("Invalid data format received for follow-ups");
          }
          break;
        case 'drafts':
          console.log("Refreshing drafts data...");
          const draftApps = await applicationsApi.getDrafts(5);
          console.log("Drafts data received:", draftApps);
          
          if (Array.isArray(draftApps)) {
            setDrafts(draftApps);
          } else {
            console.error("Received non-array drafts data:", draftApps);
            toast.error("Invalid data format received for drafts");
          }
          break;
      }
    } catch (error) {
      console.error(`Error refreshing ${dataType} data:`, error);
      toast.error(`Failed to refresh ${dataType} data`);
    } finally {
      setIsLoading(prev => ({ ...prev, [dataType]: false }));
    }
  };

  const checkApi = async (retries = 2, delay = 1500) => {
    try {
      setApiStatus('loading');
      
      // Try the health check
      const isConnected = await checkApiHealth();
      
      if (isConnected) {
        setApiStatus('connected');
        return true;
      } else if (retries > 0) {
        // If we have retries left, wait and try again
        console.log(`API check failed, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return checkApi(retries - 1, delay);
      } else {
        setApiStatus('error');
        toast.error("API Connection Error! The backend API is not responding correctly. Please check if the server is running.");
        return false;
      }
    } catch (error) {
      console.error("API check error:", error);
      
      if (retries > 0) {
        // If we have retries left, wait and try again
        console.log(`API check error, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return checkApi(retries - 1, delay);
      } else {
        setApiStatus('error');
        // Provide a more specific error message if possible
        if (error instanceof Error) {
          toast.error(`API Connection Error: ${error.message}`);
        } else {
          toast.error("API Connection Error! The backend API is not responding. Please check if the server is running.");
        }
        return false;
      }
    }
  };

  // Load data from backend API
  useEffect(() => {
    const loadData = async () => {
      const isApiConnected = await checkApi();
      if (!isApiConnected) {
        // Don't attempt to load data if the API is not connected
        setIsLoading({
          applications: false,
          followUps: false,
          drafts: false
        });
        return;
      }
      
      // Load all data in parallel
      try {
        // Fetch applications
        setIsLoading(prev => ({ ...prev, applications: true }));
        console.log("Fetching applications...");
        const apps = await applicationsApi.getAll({ 
          status: 'sent',
          sort_field: 'updated_at',
          sort_order: -1 
        });
        console.log("Received applications data:", apps);
        
        // Log the first application to see its structure
        if (apps.length > 0) {
          console.log("First application data structure:", apps[0]);
          console.log("Application ID:", apps[0]._id, "Type:", typeof apps[0]._id);
        }
        
        setApplications(apps);
        setIsLoading(prev => ({ ...prev, applications: false }));
        
        // Fetch follow-ups
        setIsLoading(prev => ({ ...prev, followUps: true }));
        console.log("Fetching follow-ups...");
        const fups = await followUpsApi.getAll({
          sort_field: 'updated_at',
          sort_order: -1
        });
        console.log("Received follow-ups data:", fups);
        setFollowUps(fups);
        setIsLoading(prev => ({ ...prev, followUps: false }));
        
        // Fetch drafts
        setIsLoading(prev => ({ ...prev, drafts: true }));
        console.log("Fetching drafts...");
        const draftApps = await applicationsApi.getDrafts(5);
        console.log("Received drafts data:", draftApps);
        setDrafts(draftApps);
        setIsLoading(prev => ({ ...prev, drafts: false }));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      }
    };
    
    loadData();
    
    // Refresh data every 5 minutes
    const refreshInterval = setInterval(() => {
      if (activeTab === 'applications') {
        refreshData('applications');
      } else if (activeTab === 'followUps') {
        refreshData('followUps');
      } else if (activeTab === 'drafts') {
        refreshData('drafts');
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Update application status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      console.log(`Updating application ${id} status to ${status}`);
      const success = await applicationsApi.update(id, { status });
      
      if (success) {
        toast.success(`Application status updated to ${status}`);
        
        // Find the application in our state
        const app = applications.find(a => a._id === id);
        
        if (app) {
          // Update local state
          setApplications(prev => 
            prev.map(app => app._id === id ? { ...app, status } : app)
          );
          
          // If the status is 'rejected' or 'accepted', update follow-up settings
          if (status === 'rejected' || status === 'accepted') {
            const updatedSettings: FollowUpSettings = {
              ...app.follow_up_settings,
              type: 'one_time' as const, // No more follow-ups needed
              max_count: app.follow_up_settings.follow_up_count, // Cap at current count
              interval_days: app.follow_up_settings.interval_days,
              follow_up_count: app.follow_up_settings.follow_up_count,
              last_follow_up_date: app.follow_up_settings.last_follow_up_date,
              next_follow_up_date: app.follow_up_settings.next_follow_up_date
            };
            
            try {
              await applicationsApi.updateFollowUpSettings(id, updatedSettings);
              
              // Update local application state with new settings
              setApplications(prev => 
                prev.map(a => a._id === id ? { 
                  ...a, 
                  follow_up_settings: updatedSettings 
                } : a)
              );
            } catch (settingsError) {
              console.error("Failed to update follow-up settings:", settingsError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    }
  };

  // Convert draft to sent application
  const handleConvertDraft = async (id: string | any) => {
    try {
      // Check if email settings are configured
      if (!emailSettings.senderEmail || !emailSettings.senderPassword) {
        toast.error("Please configure your email settings first to send the application");
        return;
      }
      
      // Extract the string ID if passed an object
      let draftId = id;
      if (typeof id === 'object') {
        draftId = id._id || id.$oid || id;
      }
      
      toast.loading("Converting draft and sending email...", { id: "convert-draft-toast" });
      
      // Pass email settings to convertDraft function
      const success = await applicationsApi.convertDraft(draftId, {
        sender_email: emailSettings.senderEmail,
        sender_name: emailSettings.senderName,
        sender_password: emailSettings.senderPassword,
        smtp_server: emailSettings.smtpServer,
        smtp_port: emailSettings.smtpPort
      });
      
      if (success) {
        toast.success("Draft converted and email sent successfully", { id: "convert-draft-toast" });
        
        // Remove from drafts and refetch applications
        setDrafts(prev => prev.filter(draft => draft._id !== id));
        await refreshData('applications');
      } else {
        toast.error("Failed to send email - draft status maintained", { id: "convert-draft-toast" });
        // Refresh drafts since the status might have changed and then changed back
        await refreshData('drafts');
      }
    } catch (error) {
      console.error("Error converting draft:", error);
      toast.error("Error processing draft - please check email settings", { id: "convert-draft-toast" });
      // Refresh to ensure UI is in sync with actual data
      await refreshData('drafts');
    }
  };

  // Create follow-up for an application
  const handleCreateFollowUp = async (app: JobApplication) => {
    try {
      console.log("Creating follow-up for application:", app);
      
      // Check if email settings are configured
      if (!emailSettings.senderEmail || !emailSettings.senderPassword) {
        toast.error("Please configure your email settings first");
        return;
      }
      
      // Check if we have exceeded the maximum follow-up count
      const followUpCount = app.follow_up_settings?.follow_up_count || 0;
      const maxCount = app.follow_up_settings?.max_count || 3;
      
      if (followUpCount >= maxCount) {
        toast.error(`Maximum follow-up limit (${maxCount}) has been reached for this application`);
        return;
      }

      // Prepare content using template if available
      let emailContent = '';
      const applicationDate = safeFormatDate(app.sent_at || app.created_at);
      
      if (emailSettings.templates?.followUp) {
        // Use the template with replacements
        emailContent = emailSettings.templates.followUp
          .replace(/{recipientName}/g, 'Hiring Manager')
          .replace(/{position}/g, app.position)
          .replace(/{company}/g, app.company)
          .replace(/{applicationDate}/g, applicationDate)
          .replace(/{senderName}/g, app.full_name || emailSettings.senderName || 'Job Applicant');
      } else {
        // Use default follow-up content if no template
        emailContent = `Dear Hiring Manager,

I hope this email finds you well. I wanted to follow up regarding my application for the ${app.position} position at ${app.company} that I submitted on ${applicationDate}.

I remain very interested in this opportunity and would appreciate any updates you might have regarding the status of my application.

Thank you for your time and consideration.

Best regards,
${app.full_name || emailSettings.senderName || 'Job Applicant'}`;
      }
      
      // Create follow-up data - using the exact format that works
      const followUpData = {
        recipient_email: app.recipient_email,
        company: app.company,
        position: app.position,
        subject: `Re: ${app.subject}`,
        content: emailContent,
        status: "sent",
        follow_up_settings: app.follow_up_settings,
        full_name: app.full_name,
        portfolio_url: app.portfolio_url,
        linkedin_url: app.linkedin_url,
        original_application_id: app._id,
        // Add email settings for SMTP sending
        sender_email: emailSettings.senderEmail,
        sender_name: emailSettings.senderName,
        sender_password: emailSettings.senderPassword,
        smtp_server: emailSettings.smtpServer,
        smtp_port: emailSettings.smtpPort
      };

      console.log("Sending follow-up data:", followUpData);
      toast.loading("Creating and sending follow-up email...", { id: "followup-toast" });

      // Create the follow-up email
      const result = await followUpsApi.create(followUpData);
      if (result && result.success) {
        // Check if email was sent
        if (result.email_sent) {
          toast.success("Follow-up email sent successfully", { id: "followup-toast" });
        } else if ('email_error' in result && result.email_error) {
          toast.error(`Follow-up created but not sent: ${result.email_error}`, { id: "followup-toast" });
        } else {
          toast.success("Follow-up email created but not sent (missing credentials)", { id: "followup-toast" });
        }
        
        // Refresh follow-ups data
        await refreshData('followUps');
        
        // Update the follow-up settings in the application
        const updatedSettings: FollowUpSettings = {
          ...app.follow_up_settings,
          follow_up_count: (app.follow_up_settings?.follow_up_count || 0) + 1,
          last_follow_up_date: new Date().toISOString()
        };
        
        // Update the follow-up settings in the backend
        const settingsUpdateSuccess = await applicationsApi.updateFollowUpSettings(
          app._id,
          updatedSettings
        );
        
        if (settingsUpdateSuccess) {
          console.log("Successfully updated follow-up settings in application");
        } else {
          console.error("Failed to update follow-up settings in application");
        }
        
        // Update the application in the local state
        setApplications(prev => 
          prev.map(a => a._id === app._id ? { 
            ...a, 
            follow_up_settings: updatedSettings 
          } : a)
        );
      } else {
        console.error("Failed to create follow-up:", result);
        toast.error("Failed to create follow-up email", { id: "followup-toast" });
      }
    } catch (error) {
      console.error("Error creating follow-up:", error);
      toast.error("Failed to create follow-up email", { id: "followup-toast" });
    }
  };

  const handleFollowUpSettingsUpdate = (application: JobApplication, updatedSettings: FollowUpSettings) => {
    // Update local state
    setApplications(prev => 
      prev.map(app => 
        app._id === application._id ? { ...app, follow_up_settings: updatedSettings } : app
      )
    );
  };

  const handleDeleteDraft = async (id: string) => {
    // For now just remove from state
    // In a real app, we'd call an API to delete the draft
    setDrafts(prev => prev.filter(draft => draft._id !== id));
    toast.success("Draft removed");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Update the navigation handler function to handle IDs properly
  const handleNavigateToEdit = (app: JobApplication) => {
    console.log("Original application:", app);
    
    // Extract the ID from the MongoDB ObjectId structure
    // The _id field may be either a string or an object with $oid property
    let appId = "";
    if (app && app._id) {
      if (typeof app._id === 'string') {
        appId = app._id;
      } else if (typeof app._id === 'object') {
        // Cast to any to handle MongoDB ObjectId structure
        const objectId = app._id as any;
        if (objectId.$oid) {
          appId = objectId.$oid;
        }
      }
    }
    
    console.log("Navigating to edit application with ID:", appId, "Type:", typeof appId);
    
    if (!appId) {
      toast.error("Invalid application ID");
      return;
    }
    
    navigate(`/applications/edit/${appId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Application Dashboard</h1>
          <Button 
            onClick={() => navigate('/applications/new')} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </div>
        
        {apiStatus === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">API Connection Error!</strong>
            <span className="block sm:inline"> The backend API is not responding. Please check if the server is running.</span>
          </div>
        )}
        
        {apiStatus === 'loading' && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Checking API...</strong>
            <span className="block sm:inline"> Attempting to connect to the backend API...</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Applications</CardTitle>
              <CardDescription>Total sent job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold flex items-center">
                <Mail className="mr-2 h-8 w-8 text-primary" />
                {isLoading.applications ? "Loading..." : applications.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Follow-ups</CardTitle>
              <CardDescription>Total follow-up emails sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold flex items-center">
                <Send className="mr-2 h-8 w-8 text-primary" />
                {isLoading.followUps ? "Loading..." : followUps.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Drafts</CardTitle>
              <CardDescription>Saved application drafts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold flex items-center">
                <FileEdit className="mr-2 h-8 w-8 text-primary" />
                {isLoading.drafts ? "Loading..." : drafts.length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="applications" className="w-full mb-10" onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="followUps">Follow-ups</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          
          {/* Applications Tab */}
          <TabsContent value="applications">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Recent Applications</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refreshData('applications')}
                disabled={isLoading.applications}
              >
                {isLoading.applications ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            {isLoading.applications ? (
              <p>Loading applications...</p>
            ) : Array.isArray(applications) && applications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow-ups</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications
                    .map(app => (
                    <TableRow key={app._id}>
                      <TableCell>{formatDate(app.sent_at)}</TableCell>
                      <TableCell>{app.company || 'N/A'}</TableCell>
                      <TableCell>{app.position || 'N/A'}</TableCell>
                      <TableCell>{app.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(app.status)}>{app.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {app.follow_up_settings?.follow_up_count || 0}/{app.follow_up_settings?.max_count || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateStatus(app._id, 'responded')}
                            disabled={app.status === 'responded'}
                          >
                            Mark Responded
                          </Button>
                          <FollowUpSettingsDialog 
                            application={app}
                            onSettingsUpdated={(settings) => handleFollowUpSettingsUpdate(app, settings)}
                            trigger={
                              <Button variant="outline" size="sm">Settings</Button>
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateFollowUp(app)}
                            disabled={
                              app.status !== 'sent' || 
                              (app.follow_up_settings?.follow_up_count || 0) >= (app.follow_up_settings?.max_count || 0)
                            }
                          >
                            Send Follow-up
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigateToEdit(app)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" /> View/Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-8 border rounded-lg">
                <p className="mb-4">No applications found.</p>
                <Button 
                  variant="outline"
                  onClick={() => refreshData('applications')}
                >
                  Refresh Data
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Follow-ups Tab */}
          <TabsContent value="followUps">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Recent Follow-ups</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refreshData('followUps')}
                disabled={isLoading.followUps}
              >
                {isLoading.followUps ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            {isLoading.followUps ? (
              <p>Loading follow-ups...</p>
            ) : followUps.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow-up #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps
                    .map(followUp => (
                    <TableRow key={followUp._id}>
                      <TableCell>{formatDate(followUp.sent_at)}</TableCell>
                      <TableCell>{followUp.company || 'N/A'}</TableCell>
                      <TableCell>{followUp.position || 'N/A'}</TableCell>
                      <TableCell>{followUp.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(followUp.status)}>{followUp.status}</Badge>
                      </TableCell>
                      <TableCell>{followUp.follow_up_number}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No follow-ups found.</p>
            )}
          </TabsContent>
          
          {/* Drafts Tab */}
          <TabsContent value="drafts">
            <h2 className="text-2xl font-semibold mb-4">Application Drafts</h2>
            {isLoading.drafts ? (
              <p>Loading drafts...</p>
            ) : drafts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts
                    .map(draft => (
                    <TableRow key={draft._id}>
                      <TableCell>{formatDate(draft.created_at)}</TableCell>
                      <TableCell>{draft.company || 'N/A'}</TableCell>
                      <TableCell>{draft.position || 'N/A'}</TableCell>
                      <TableCell>{draft.recipient_email}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleConvertDraft(draft._id)}
                          >
                            Send
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteDraft(draft._id)}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigateToEdit(draft)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" /> Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No draft applications found.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard; 