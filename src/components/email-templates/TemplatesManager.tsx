import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  EmailTemplate, 
  EmailTemplateType, 
  useEmailSettingsStore 
} from '@/store/emailSettingsStore';
import * as templateService from '@/services/emailTemplateService';
import { toast } from 'sonner';
import TemplateList from './TemplateList';
import TemplateEditor from './TemplateEditor';

const TemplatesManager = () => {
  const { templates, setTemplates, addTemplate, updateTemplate } = useEmailSettingsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<EmailTemplateType>(EmailTemplateType.JOB_APPLICATION);
  
  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Fetch all templates from API
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await templateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle template creation
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsEditing(true);
  };
  
  // Handle template editing
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };
  
  // Handle template form submission
  const handleSaveTemplate = async (templateData: EmailTemplate) => {
    try {
      if (templateData._id) {
        // Update existing template
        const updatedTemplate = await templateService.updateTemplate(
          templateData._id,
          templateData
        );
        updateTemplate(updatedTemplate);
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const newTemplate = await templateService.createTemplate(templateData);
        addTemplate(newTemplate);
        toast.success('Template created successfully');
      }
      
      // Close editor
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Error saving template:', error);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedTemplate(null);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-6">Email Templates</h2>
      
      {isEditing ? (
        <TemplateEditor
          template={selectedTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEdit}
        />
      ) : (
        <Tabs 
          defaultValue={EmailTemplateType.JOB_APPLICATION}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as EmailTemplateType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={EmailTemplateType.JOB_APPLICATION}>
              Job Application Templates
            </TabsTrigger>
            <TabsTrigger value={EmailTemplateType.FOLLOW_UP}>
              Follow-up Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={EmailTemplateType.JOB_APPLICATION}>
            <TemplateList 
              type={EmailTemplateType.JOB_APPLICATION}
              onEditTemplate={handleEditTemplate}
              onNewTemplate={handleCreateTemplate}
            />
          </TabsContent>
          
          <TabsContent value={EmailTemplateType.FOLLOW_UP}>
            <TemplateList 
              type={EmailTemplateType.FOLLOW_UP}
              onEditTemplate={handleEditTemplate}
              onNewTemplate={handleCreateTemplate}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TemplatesManager; 