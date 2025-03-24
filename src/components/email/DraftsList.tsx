
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileEdit, Trash, List } from 'lucide-react';
import { Application } from '@/store/applicationStore';

interface DraftsListProps {
  draftApplications: Application[];
  currentDraftId: string | null;
  handleEditDraft: (app: Application) => void;
  handleRemoveDraft: (id: string) => void;
}

const DraftsList: React.FC<DraftsListProps> = ({
  draftApplications,
  currentDraftId,
  handleEditDraft,
  handleRemoveDraft,
}) => {
  if (draftApplications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <List className="h-4 w-4" /> 
        <span>Saved Drafts ({draftApplications.length})</span>
      </div>
      <ScrollArea className="h-[120px] rounded-md border p-2">
        <div className="space-y-2">
          {draftApplications.map((app) => (
            <div 
              key={app.id} 
              className={`p-2 rounded-md border flex justify-between items-center ${
                currentDraftId === app.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'
              }`}
            >
              <div>
                <p className="text-sm font-medium">{app.position} at {app.company}</p>
                <p className="text-xs text-muted-foreground">Started on {app.sentDate}</p>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleEditDraft(app)}
                  title="Edit this draft"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 text-destructive"
                  onClick={() => handleRemoveDraft(app.id)}
                  title="Remove"
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DraftsList;
