import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { FileEdit, MoreVertical, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { 
  EmailTemplate, 
  EmailTemplateType, 
  useEmailSettingsStore 
} from '@/store/emailSettingsStore';
import * as templateService from '@/services/emailTemplateService';
import { toast } from 'sonner';

interface TemplateListProps {
  type: EmailTemplateType;
  onEditTemplate: (template: EmailTemplate) => void;
  onNewTemplate: () => void;
}

const TemplateList = ({ type, onEditTemplate, onNewTemplate }: TemplateListProps) => {
  const { templates, deleteTemplate, updateTemplate, setTemplates } = useEmailSettingsStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  // Filter templates by type
  const filteredTemplates = templates.filter(template => template.type === type);
  
  // Get type label for display
  const getTypeLabel = (type: EmailTemplateType) => {
    return type === EmailTemplateType.JOB_APPLICATION 
      ? 'Job Application' 
      : 'Follow-up';
  };
  
  // Format date
  const formatDate = (dateString?: Date) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setDeleteConfirmOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = async () => {
    if (selectedTemplate?._id) {
      try {
        await templateService.deleteTemplate(selectedTemplate._id);
        deleteTemplate(selectedTemplate._id);
        toast.success('Template deleted successfully');
      } catch (error) {
        toast.error('Failed to delete template');
        console.error('Error deleting template:', error);
      }
    }
    setDeleteConfirmOpen(false);
  };
  
  // Set as default
  const handleSetAsDefault = async (template: EmailTemplate) => {
    if (!template._id) return;
    
    try {
      await templateService.setDefaultTemplate(template._id);
      
      // Update the default template in state
      setTemplates(templates.map(t => {
        // Set isDefault to false for all templates of the same type
        if (t.type === template.type) {
          return { ...t, isDefault: t._id === template._id };
        }
        return t;
      }));
      
      toast.success('Default template updated');
    } catch (error) {
      toast.error('Failed to set default template');
      console.error('Error setting default template:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{getTypeLabel(type)} Templates</h3>
        <Button size="sm" onClick={onNewTemplate}>
          Add Template
        </Button>
      </div>
      
      {filteredTemplates.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.map((template) => (
              <TableRow key={template._id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.subject}</TableCell>
                <TableCell>{formatDate(template.createdAt)}</TableCell>
                <TableCell>
                  {template.isDefault && (
                    <Badge variant="default">Default</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditTemplate(template)}>
                        <FileEdit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!template.isDefault && (
                        <>
                          <DropdownMenuItem onClick={() => handleSetAsDefault(template)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(template)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No templates found. Create your first template.
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateList; 