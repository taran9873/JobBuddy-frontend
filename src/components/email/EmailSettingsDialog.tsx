import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmailSettingsStore } from '@/store/emailSettingsStore';
import { Mail, Server, Key, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface EmailSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailSettingsDialog: React.FC<EmailSettingsDialogProps> = ({ open, onOpenChange }) => {
  const { settings, updateSettings } = useEmailSettingsStore();
  
  const [formData, setFormData] = useState({
    smtpServer: settings.smtpServer,
    smtpPort: settings.smtpPort.toString(),
    senderEmail: settings.senderEmail,
    senderName: settings.senderName,
    senderPassword: settings.senderPassword,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
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
    
    toast.success("Email settings saved");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email Settings
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
          
          <DialogFooter className="mt-6">
            <Button type="submit">
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailSettingsDialog; 