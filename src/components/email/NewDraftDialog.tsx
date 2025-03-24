
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

interface NewDraftDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (data: { position: string, company: string }) => void;
}

interface DraftFormValues {
  position: string;
  company: string;
}

const NewDraftDialog: React.FC<NewDraftDialogProps> = ({
  isOpen,
  setIsOpen,
  onSubmit,
}) => {
  const draftForm = useForm<DraftFormValues>({
    defaultValues: {
      position: '',
      company: '',
    }
  });

  const handleSubmit = (data: DraftFormValues) => {
    onSubmit(data);
    draftForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> New Draft
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Draft</DialogTitle>
          <DialogDescription>
            Start a new draft with basic information. You can complete it later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={draftForm.handleSubmit(handleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                {...draftForm.register("position", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...draftForm.register("company", { required: true })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Draft</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDraftDialog;
