import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { validateEmail, getEmailErrorMessage } from '@/utils/emailValidation';
import { toast } from 'sonner';
import { Send, User, Briefcase, Building, Globe, Linkedin, Calendar, Mail, ArrowRight, Plus, Check, Clock, AlertTriangle, X, List, Trash, Save, FileEdit } from 'lucide-react';
import { EmailTemplateType, TemplateData, generateEmailTemplate } from './EmailTemplates';
import { useApplicationStore, Application } from '@/store/applicationStore';
import { format as formatDate } from 'date-fns';
import ApplicationForm from './email/ApplicationForm';
import DraftsList from './email/DraftsList';
import NewDraftDialog from './email/NewDraftDialog';
import FollowUpForm from './email/FollowUpForm';
import FollowUpSettingsDialog from './email/FollowUpSettingsDialog';
import { applicationsApi, checkApiHealth } from '@/lib/api';

interface EmailFormProps {
  onPreview: (recipient: string, subject: string, body: string) => void;
}

interface DraftFormValues {
  position: string;
  company: string;
}

const EmailForm: React.FC<EmailFormProps> = ({ onPreview }) => {
  const [recipient, setRecipient] = useState('');
  const [emailType, setEmailType] = useState<EmailTemplateType>('application');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateData>({
    fullName: '',
    position: '',
    company: '',
    portfolio: '',
    linkedIn: '',
    previousEmail: '',
    sentDate: formatDate(new Date(), 'PP'),
  });
  const [isComplete, setIsComplete] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [followUpSettings, setFollowUpSettings] = useState({
    interval: 2,
    intervalType: 'days' as 'days' | 'hours' | 'minutes',
    maxFollowUps: 5,
  });

  const [isNewDraftDialogOpen, setIsNewDraftDialogOpen] = useState(false);
  const [draftApplications, setDraftApplications] = useState<Application[]>([]);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [showDraftSavedMessage, setShowDraftSavedMessage] = useState(false);

  const { 
    applications, 
    addApplication, 
    updateApplication,
    incrementFollowUpCount,
    saveDraft,
    getDraftApplications,
    removeApplication,
    completeApplication
  } = useApplicationStore();

  const [apiReady, setApiReady] = useState<boolean | null>(null);

  useEffect(() => {
    const requiredFields = ['fullName', 'position', 'company'];
    const followUpFields = emailType === 'followUp' ? ['sentDate'] : [];
    
    const allRequiredFieldsFilled = [...requiredFields, ...followUpFields].every(
      field => !!formData[field as keyof TemplateData]
    );
    
    setIsComplete(allRequiredFieldsFilled && !emailError && !!recipient);
  }, [formData, emailType, emailError, recipient]);

  useEffect(() => {
    setDraftApplications(getDraftApplications());
  }, [applications, getDraftApplications]);

  useEffect(() => {
    const checkBackendConnection = async (retries = 2, delay = 1500) => {
      try {
        const isHealthy = await checkApiHealth();
        
        if (isHealthy) {
          setApiReady(true);
          console.log("Backend API is connected and healthy.");
        } else if (retries > 0) {
          console.log(`API check failed, retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          checkBackendConnection(retries - 1, delay);
        } else {
          setApiReady(false);
          console.warn("Backend API is not available. Job applications will only be stored locally.");
        }
      } catch (error) {
        if (retries > 0) {
          console.error("API check error, retrying...", error);
          await new Promise(resolve => setTimeout(resolve, delay));
          checkBackendConnection(retries - 1, delay);
        } else {
          setApiReady(false);
          console.error("Backend API connection failed after retries:", error);
          console.warn("Backend API is not available. Job applications will only be stored locally.");
        }
      }
    };
    
    checkBackendConnection();
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setRecipient(newEmail);
    setEmailError(getEmailErrorMessage(newEmail));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (emailError) {
      toast.error(emailError);
      return;
    }

    const { subject, body } = generateEmailTemplate(emailType, formData);
    
    if (emailType === 'application') {
      if (isEditingDraft && currentDraftId) {
        completeApplication(currentDraftId, {
          recipient,
          subject,
          fullName: formData.fullName,
          position: formData.position,
          company: formData.company,
          portfolio: formData.portfolio || '',
          linkedIn: formData.linkedIn || '',
        });
        
        setIsEditingDraft(false);
        setCurrentDraftId(null);
        toast.success("Draft application completed and sent!");
      } else {
        const appId = addApplication({
          recipient,
          subject,
          position: formData.position,
          company: formData.company,
          sentDate: formData.sentDate || formatDate(new Date(), 'PP'),
          fullName: formData.fullName,
          portfolio: formData.portfolio,
          linkedIn: formData.linkedIn,
        });
        
        if (apiReady) {
          try {
            console.log("Sending job application to backend DB...");
            const result = await applicationsApi.create({
              recipient_email: recipient,
              subject: subject,
              content: body,
              company: formData.company,
              position: formData.position,
              status: 'sent',
              full_name: formData.fullName,
              portfolio_url: formData.portfolio,
              linkedin_url: formData.linkedIn
            });
            
            if (result && result.success) {
              console.log("Application saved to database with ID:", result.id);
              toast.success("Application saved to database!");
            } else {
              console.error("Failed to save application to database", result);
              toast.error("Application saved locally but failed to save to database");
            }
          } catch (error) {
            console.error("Error saving application to database:", error);
            toast.error("Application saved locally but couldn't connect to database");
          }
        } else {
          console.log("Backend API not available, application only stored locally");
          toast.info("Backend API not available. Application stored locally only.");
        }
        
        toast.success("Application submitted!");
      }
    } else if (emailType === 'followUp' && selectedApplicationId) {
      incrementFollowUpCount(selectedApplicationId);
      toast.success("Follow-up sent!");
    }
    
    onPreview(recipient, subject, body);
    resetForm();
  };

  const resetForm = () => {
    setRecipient('');
    setFormData({
      fullName: '',
      position: '',
      company: '',
      portfolio: '',
      linkedIn: '',
      previousEmail: '',
      sentDate: formatDate(new Date(), 'PP'),
    });
    setCurrentDraftId(null);
    setIsEditingDraft(false);
  };

  const handleSaveDraft = () => {
    if (!formData.position && !formData.company && !formData.fullName && !recipient) {
      toast.error("Please enter at least one field");
      return;
    }
    
    const draftId = saveDraft({
      id: currentDraftId || undefined,
      recipient,
      position: formData.position,
      company: formData.company,
      fullName: formData.fullName,
      portfolio: formData.portfolio,
      linkedIn: formData.linkedIn,
    });
    
    setCurrentDraftId(draftId);
    setShowDraftSavedMessage(true);
    
    setTimeout(() => {
      setShowDraftSavedMessage(false);
    }, 3000);
    
    toast.success("Application saved as draft");
  };

  const handleTabChange = (value: string) => {
    setEmailType(value as EmailTemplateType);
    
    if (value === 'application') {
      setSelectedApplicationId(null);
    }
  };

  const handleSelectApplication = (app: Application) => {
    setSelectedApplicationId(app.id);
    setRecipient(app.recipient);
    setFormData({
      fullName: app.fullName,
      position: app.position,
      company: app.company,
      portfolio: app.portfolio || '',
      linkedIn: app.linkedIn || '',
      sentDate: app.sentDate,
      previousEmail: '',
    });
  };

  const handleSetupAutoFollowUp = (app: Application) => {
    setSelectedApplicationId(app.id);
    setFollowUpSettings({
      interval: app.autoFollowUp.interval,
      intervalType: app.autoFollowUp.intervalType,
      maxFollowUps: app.autoFollowUp.maxFollowUps,
    });
    setIsFollowUpDialogOpen(true);
  };

  const saveAutoFollowUpSettings = () => {
    if (selectedApplicationId) {
      updateApplication(selectedApplicationId, {
        autoFollowUp: {
          enabled: true,
          interval: followUpSettings.interval,
          intervalType: followUpSettings.intervalType,
          maxFollowUps: followUpSettings.maxFollowUps,
        }
      });
      
      const intervalTypeLabel = followUpSettings.intervalType;
      
      toast.success(
        `Auto follow-up set for every ${followUpSettings.interval} ${intervalTypeLabel} (max ${followUpSettings.maxFollowUps} times)`
      );
      
      setIsFollowUpDialogOpen(false);
    }
  };

  const disableAutoFollowUp = (id: string) => {
    updateApplication(id, {
      autoFollowUp: {
        enabled: false,
        interval: 2,
        intervalType: 'days',
        maxFollowUps: 5,
      }
    });
    
    toast.success("Auto follow-up disabled");
  };

  const handleNewDraft = (data: DraftFormValues) => {
    const draftId = saveDraft({
      position: data.position,
      company: data.company,
    });
    
    setIsNewDraftDialogOpen(false);
    
    const draft = getDraftApplications().find(app => app.id === draftId);
    if (draft) {
      handleEditDraft(draft);
    }
    
    toast.success(`Created new draft for ${data.position} at ${data.company}`);
  };

  const handleEditDraft = (app: Application) => {
    setIsEditingDraft(true);
    setCurrentDraftId(app.id);
    setRecipient(app.recipient);
    setFormData({
      fullName: app.fullName || '',
      position: app.position,
      company: app.company,
      portfolio: app.portfolio || '',
      linkedIn: app.linkedIn || '',
      sentDate: app.sentDate,
      previousEmail: '',
    });
    setEmailType('application');
  };

  const handleRemoveDraft = (id: string) => {
    removeApplication(id);
    
    if (currentDraftId === id) {
      resetForm();
    }
    
    toast.success("Draft removed");
  };

  const selectedApplication = applications.find(app => app.id === selectedApplicationId) || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-3xl mx-auto glassmorphism">
        <CardContent className="pt-6">
          <Tabs defaultValue="application" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="application" className="button-transition">
                Job Application
              </TabsTrigger>
              <TabsTrigger value="followUp" className="button-transition">
                Follow Up
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="recipient" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Recipient Email {!isEditingDraft && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="recipient"
                  placeholder="hiring@company.com"
                  value={recipient}
                  onChange={handleEmailChange}
                  className={`input-focus-ring ${emailError ? 'border-destructive' : ''}`}
                />
                {emailError && (
                  <p className="text-destructive text-sm mt-1">{emailError}</p>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={emailType}
                initial={{ opacity: 0, x: emailType === 'application' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: emailType === 'application' ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                {emailType === 'application' && (
                  <TabsContent value="application" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">
                          {isEditingDraft 
                            ? <span className="flex items-center gap-1"><FileEdit className="h-4 w-4" /> Editing Draft</span>
                            : "Application Details"
                          }
                        </h3>
                        <div className="flex gap-2">
                          {showDraftSavedMessage && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-xs text-primary flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Draft saved
                            </motion.div>
                          )}
                          <NewDraftDialog 
                            isOpen={isNewDraftDialogOpen}
                            setIsOpen={setIsNewDraftDialogOpen}
                            onSubmit={handleNewDraft}
                          />
                        </div>
                      </div>

                      <DraftsList 
                        draftApplications={draftApplications}
                        currentDraftId={currentDraftId}
                        handleEditDraft={handleEditDraft}
                        handleRemoveDraft={handleRemoveDraft}
                      />

                      <ApplicationForm 
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleSaveDraft={handleSaveDraft}
                        isComplete={isComplete}
                        handleSubmit={handleSubmit}
                        isEditingDraft={isEditingDraft}
                      />
                    </div>
                  </TabsContent>
                )}
                
                {emailType === 'followUp' && (
                  <TabsContent value="followUp" className="mt-0">
                    <FollowUpForm 
                      applications={applications}
                      selectedApplicationId={selectedApplicationId}
                      handleSelectApplication={handleSelectApplication}
                      handleSetupAutoFollowUp={handleSetupAutoFollowUp}
                      disableAutoFollowUp={disableAutoFollowUp}
                      isFollowUpDialogOpen={isFollowUpDialogOpen}
                      setIsFollowUpDialogOpen={setIsFollowUpDialogOpen}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      setEmailType={setEmailType}
                    />
                    
                    <FollowUpSettingsDialog 
                      open={isFollowUpDialogOpen}
                      onOpenChange={setIsFollowUpDialogOpen}
                      selectedApplication={selectedApplication}
                      followUpSettings={followUpSettings}
                      setFollowUpSettings={setFollowUpSettings}
                      saveAutoFollowUpSettings={saveAutoFollowUpSettings}
                    />

                    {selectedApplicationId && (
                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={handleSubmit}
                          disabled={!isComplete}
                          className="button-transition"
                        >
                          Send Follow-up <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmailForm;
