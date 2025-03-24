
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowRight, User, Briefcase, Building, Globe, Linkedin } from 'lucide-react';
import { TemplateData } from '../EmailTemplates';
import { Application } from '@/store/applicationStore';

interface ApplicationFormProps {
  formData: TemplateData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSaveDraft: () => void;
  isComplete: boolean;
  handleSubmit: () => void;
  isEditingDraft: boolean;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  formData,
  handleInputChange,
  handleSaveDraft,
  isComplete,
  handleSubmit,
  isEditingDraft,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Your Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleInputChange}
            className="input-focus-ring"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="position" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Position <span className="text-destructive">*</span>
          </Label>
          <Input
            id="position"
            name="position"
            placeholder="Software Engineer"
            value={formData.position}
            onChange={handleInputChange}
            className="input-focus-ring"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company" className="flex items-center gap-2">
          <Building className="h-4 w-4" /> Company <span className="text-destructive">*</span>
        </Label>
        <Input
          id="company"
          name="company"
          placeholder="Acme Inc."
          value={formData.company}
          onChange={handleInputChange}
          className="input-focus-ring"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="portfolio" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Portfolio URL
          </Label>
          <Input
            id="portfolio"
            name="portfolio"
            placeholder="https://yourportfolio.com"
            value={formData.portfolio}
            onChange={handleInputChange}
            className="input-focus-ring"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="linkedIn" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" /> LinkedIn URL
          </Label>
          <Input
            id="linkedIn"
            name="linkedIn"
            placeholder="https://linkedin.com/in/username"
            value={formData.linkedIn}
            onChange={handleInputChange}
            className="input-focus-ring"
          />
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button 
          onClick={handleSaveDraft} 
          variant="outline"
          className="button-transition"
          disabled={!formData.position && !formData.company && !formData.fullName}
        >
          <Save className="mr-2 h-4 w-4" /> Save as Draft
        </Button>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!isComplete}
          className="button-transition"
        >
          {isEditingDraft 
            ? <>Complete Application <ArrowRight className="ml-2 h-4 w-4" /></> 
            : <>Preview Email <ArrowRight className="ml-2 h-4 w-4" /></>
          }
        </Button>
      </div>
    </div>
  );
};

export default ApplicationForm;
