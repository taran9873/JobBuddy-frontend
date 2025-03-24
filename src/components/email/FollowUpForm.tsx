import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, Mail, Send, Clock, X, Plus } from 'lucide-react';
import { Application } from '@/store/applicationStore';
import { TemplateData } from '../EmailTemplates';
import { EmailTemplateType } from '../EmailTemplates';

interface FollowUpFormProps {
  applications: Application[];
  selectedApplicationId: string | null;
  handleSelectApplication: (app: Application) => void;
  handleSetupAutoFollowUp: (app: Application) => void;
  disableAutoFollowUp: (id: string) => void;
  isFollowUpDialogOpen: boolean;
  setIsFollowUpDialogOpen: (open: boolean) => void;
  formData: TemplateData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setEmailType: (type: EmailTemplateType) => void;
}

const FollowUpForm: React.FC<FollowUpFormProps> = ({
  applications,
  selectedApplicationId,
  handleSelectApplication,
  handleSetupAutoFollowUp,
  disableAutoFollowUp,
  isFollowUpDialogOpen,
  setIsFollowUpDialogOpen,
  formData,
  handleInputChange,
  setEmailType,
}) => {
  if (applications.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">No applications yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Send some job applications first to enable follow-ups
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setEmailType('application')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Job Application
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Previously Sent Applications</h3>
      <ScrollArea className="h-[250px] rounded-md border p-2">
        <div className="space-y-3">
          {applications.map((app) => (
            <div 
              key={app.id} 
              className={`p-3 rounded-md border cursor-pointer transition-colors ${
                selectedApplicationId === app.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <p className="font-medium text-sm">{app.position} at {app.company}</p>
                  <p className="text-xs text-muted-foreground">{app.recipient}</p>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleSelectApplication(app)}
                    title="Send follow-up now"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleSetupAutoFollowUp(app)}
                    title="Auto-schedule follow-ups"
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </Button>
                  {app.autoFollowUp.enabled && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2 text-destructive"
                      onClick={() => disableAutoFollowUp(app.id)}
                      title="Disable auto follow-up"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Applied: {app.sentDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  {app.followUpCount > 0 ? (
                    <>
                      <Mail className="h-3 w-3" />
                      <span>Follow-ups: {app.followUpCount}</span>
                    </>
                  ) : (
                    <span>No follow-ups yet</span>
                  )}
                </div>
              </div>
              {app.autoFollowUp.enabled && (
                <div className="mt-2 text-xs flex items-center gap-1 bg-muted/50 rounded-sm px-2 py-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>
                    Auto: Every {app.autoFollowUp.interval} {app.autoFollowUp.intervalType} 
                    (max {app.autoFollowUp.maxFollowUps} times)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {selectedApplicationId && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="previousEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Previous Email Content (Optional)
            </Label>
            <Textarea
              id="previousEmail"
              name="previousEmail"
              placeholder="Copy the content of your previous application email here..."
              value={formData.previousEmail}
              onChange={handleInputChange}
              className="min-h-[100px] input-focus-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpForm;
