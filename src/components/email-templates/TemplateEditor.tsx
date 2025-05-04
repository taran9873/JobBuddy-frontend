import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  EmailTemplate, 
  EmailTemplateType, 
  useEmailSettingsStore 
} from '@/store/emailSettingsStore';

interface TemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
}

const defaultTemplate: EmailTemplate = {
  name: '',
  type: EmailTemplateType.JOB_APPLICATION,
  subject: '',
  body: '',
  isDefault: false
};

const TemplateEditor = ({ template, onSave, onCancel }: TemplateEditorProps) => {
  const { addTemplate, updateTemplate } = useEmailSettingsStore();
  const [formData, setFormData] = useState<EmailTemplate>(template ?? defaultTemplate);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update form data when template changes
  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData(defaultTemplate);
    }
  }, [template]);
  
  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.body.trim()) {
      newErrors.body = 'Body is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{template?._id ? 'Edit Template' : 'Create Template'}</CardTitle>
        <CardDescription>
          {template?._id 
            ? 'Modify your email template details' 
            : 'Create a new email template'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., My Custom Template"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Template Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EmailTemplateType.JOB_APPLICATION}>Job Application</SelectItem>
                <SelectItem value={EmailTemplateType.FOLLOW_UP}>Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., Application for {position} at {company}"
              className={errors.subject ? 'border-destructive' : ''}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Use placeholders like {'{recipientName}'}, {'{position}'}, {'{company}'}, 
              {'{customMessage}'}, {'{senderName}'} which will be replaced with actual values.
            </p>
            <Textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder="Enter your email template content"
              className={`min-h-[200px] font-mono text-sm ${errors.body ? 'border-destructive' : ''}`}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => 
                handleCheckboxChange('isDefault', checked === true)
              }
            />
            <Label htmlFor="isDefault" className="font-normal">
              Set as default template for {formData.type === EmailTemplateType.JOB_APPLICATION 
                ? 'Job Applications' 
                : 'Follow-ups'}
            </Label>
          </div>
          
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {template?._id ? 'Update Template' : 'Create Template'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TemplateEditor; 