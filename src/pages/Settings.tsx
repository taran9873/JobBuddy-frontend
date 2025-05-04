import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Mail, User, Server, Key, ShieldAlert, ArrowLeft, FileText } from 'lucide-react';
import { useEmailSettingsStore, EmailTemplates } from '@/store/emailSettingsStore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import TemplatesManager from '@/components/email-templates/TemplatesManager';

const Settings = () => {
  // Get email settings from the store
  const { settings, updateSettings } = useEmailSettingsStore();
  const [activeTab, setActiveTab] = useState('smtp');
  
  // Initialize form state with current settings
  const [formData, setFormData] = useState({
    smtpServer: settings.smtpServer,
    smtpPort: settings.smtpPort.toString(),
    senderEmail: settings.senderEmail,
    senderName: settings.senderName,
    senderPassword: settings.senderPassword,
  });

  // Initialize template state with templates from settings or defaults
  const [templates, setTemplates] = useState<EmailTemplates>({
    jobApplication: settings.templates?.jobApplication || 
      `Dear {recipientName},

I am writing to express my interest in the {position} position at {company}. With my background in {skill}, I believe I would be a great fit for this role.

{customMessage}

I have attached my resume for your review. I look forward to the opportunity to discuss how my skills and experiences align with your needs.

Best regards,
{senderName}`,
    followUp: settings.templates?.followUp || 
      `Dear {recipientName},

I hope this email finds you well. I am writing to follow up on my application for the {position} position that I submitted on {applicationDate}.

I remain very interested in this opportunity and would appreciate any update you can provide regarding the status of my application.

Thank you for your time and consideration.

Best regards,
{senderName}`
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle template changes
  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplates(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle SMTP settings form submission
  const handleSMTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const portNumber = parseInt(formData.smtpPort);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      toast.error("Please enter a valid port number (1-65535)");
      return;
    }
    
    updateSettings({
      smtpServer: formData.smtpServer,
      smtpPort: portNumber,
      senderEmail: formData.senderEmail,
      senderName: formData.senderName,
      senderPassword: formData.senderPassword,
    });
    
    toast.success("SMTP settings saved successfully");
  };
  
  // Handle profile settings form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettings({
      senderName: formData.senderName,
      senderEmail: formData.senderEmail,
    });
    
    toast.success("Profile settings saved successfully");
  };

  // Handle templates form submission
  const handleTemplatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettings({
      templates: {
        jobApplication: templates.jobApplication,
        followUp: templates.followUp
      }
    });
    
    toast.success("Email templates saved successfully");
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-8">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Rail Navigation */}
        <Card className="md:col-span-1">
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="w-full" 
            orientation="vertical"
          >
            <TabsList className="flex flex-col items-stretch h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="smtp" 
                className="justify-start text-left px-4 py-3 data-[state=active]:bg-muted"
              >
                <Mail className="h-4 w-4 mr-2" />
                SMTP Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="justify-start text-left px-4 py-3 data-[state=active]:bg-muted"
              >
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="justify-start text-left px-4 py-3 data-[state=active]:bg-muted"
              >
                <FileText className="h-4 w-4 mr-2" />
                Default Templates
              </TabsTrigger>
              <TabsTrigger 
                value="template-manager" 
                className="justify-start text-left px-4 py-3 data-[state=active]:bg-muted"
              >
                <FileText className="h-4 w-4 mr-2" />
                Email Templates
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
        
        {/* Content Area */}
        <Card className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* SMTP Settings */}
            <TabsContent value="smtp" className="m-0">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  SMTP Configuration
                </h2>
                
                <form onSubmit={handleSMTPSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="smtpServer">SMTP Server</Label>
                    </div>
                    <Input
                      id="smtpServer"
                      name="smtpServer"
                      value={formData.smtpServer}
                      onChange={handleChange}
                      placeholder="smtp.gmail.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      name="smtpPort"
                      value={formData.smtpPort}
                      onChange={handleChange}
                      placeholder="587"
                      required
                      type="number"
                      min="1"
                      max="65535"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="senderEmail">Your Email</Label>
                    </div>
                    <Input
                      id="senderEmail"
                      name="senderEmail"
                      value={formData.senderEmail}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      type="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="senderName">Your Name</Label>
                    <Input
                      id="senderName"
                      name="senderName"
                      value={formData.senderName}
                      onChange={handleChange}
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="senderPassword">Password or App Password</Label>
                    </div>
                    <Input
                      id="senderPassword"
                      name="senderPassword"
                      value={formData.senderPassword}
                      onChange={handleChange}
                      placeholder="••••••••••••••••"
                      required
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      For Gmail, use an app password. Your password is stored locally.
                    </p>
                  </div>
                  
                  <Button type="submit" className="mt-6">
                    Save SMTP Settings
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
            {/* Profile Settings */}
            <TabsContent value="profile" className="m-0">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Settings
                </h2>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profileName">Your Name</Label>
                    <Input
                      id="profileName"
                      name="senderName"
                      value={formData.senderName}
                      onChange={handleChange}
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profileEmail">Your Email</Label>
                    <Input
                      id="profileEmail"
                      name="senderEmail"
                      value={formData.senderEmail}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      type="email"
                    />
                  </div>
                  
                  <Button type="submit" className="mt-6">
                    Save Profile Settings
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* Default Email Templates */}
            <TabsContent value="templates" className="m-0">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Default Email Templates
                </h2>
                
                <form onSubmit={handleTemplatesSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="jobApplication">Job Application Template</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Use placeholders like {'{recipientName}'}, {'{position}'}, {'{company}'}, {'{customMessage}'}, {'{senderName}'} which will be replaced with actual values when sending emails.
                    </p>
                    <Textarea
                      id="jobApplication"
                      name="jobApplication"
                      value={templates.jobApplication}
                      onChange={handleTemplateChange}
                      placeholder="Enter your job application email template"
                      className="min-h-[200px] font-mono text-sm"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="followUp">Follow-up Template</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Use placeholders like {'{recipientName}'}, {'{position}'}, {'{company}'}, {'{applicationDate}'}, {'{senderName}'} which will be replaced with actual values when sending emails.
                    </p>
                    <Textarea
                      id="followUp"
                      name="followUp"
                      value={templates.followUp}
                      onChange={handleTemplateChange}
                      placeholder="Enter your follow-up email template"
                      className="min-h-[200px] font-mono text-sm"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="mt-6">
                    Save Default Templates
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
            {/* Template Manager */}
            <TabsContent value="template-manager" className="m-0">
              <CardContent className="p-6">
                <TemplatesManager />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 