import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, CheckCircle, Copy, Settings } from 'lucide-react';
import { useApplicationStore } from '@/store/applicationStore';
import { useEmailSettingsStore } from '@/store/emailSettingsStore';
import { emailApi } from '@/lib/api';
import EmailSettingsDialog from './email/EmailSettingsDialog';

interface EmailPreviewProps {
  recipient: string;
  subject: string;
  body: string;
  onBack: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ recipient, subject, body, onBack }) => {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Get settings store
  const { settings } = useEmailSettingsStore();
  
  // Get the application by email to update its status when sent
  const { getApplicationByEmail, incrementFollowUpCount } = useApplicationStore();

  const handleCopy = useCallback(async () => {
    if (copied) return;
    
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      toast.success("Email content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error("Failed to copy to clipboard");
    }
  }, [subject, body, copied]);

  const handleSend = useCallback(async () => {
    if (isSending || sent) return;
    
    // Check if email settings are configured
    if (!settings.senderEmail || !settings.senderPassword) {
      toast.error("Please configure your email settings first");
      setIsSettingsOpen(true);
      return;
    }
    
    setIsSending(true);
    
    try {
      // Get application if it exists
      const application = getApplicationByEmail(recipient);
      
      // Send email via API
      const result = await emailApi.send({
        sender_email: settings.senderEmail,
        sender_name: settings.senderName,
        sender_password: settings.senderPassword,
        recipient_email: recipient,
        subject: subject,
        email_content: body,
        smtp_server: settings.smtpServer,
        smtp_port: settings.smtpPort,
        application_id: application?.id
      });
      
      if (result && result.success) {
        // Update application status if it exists
        if (application) {
          incrementFollowUpCount(application.id);
        }
        
        setSent(true);
        toast.success("Email sent successfully");
      } else {
        throw new Error(result?.message || "Failed to send email");
      }
    } catch (error) {
      console.error('Send failed:', error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  }, [recipient, subject, body, isSending, sent, getApplicationByEmail, incrementFollowUpCount, settings]);

  const formattedBody = body.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      <br />
    </React.Fragment>
  ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Email Preview</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopy}
                className="h-8 w-8"
                title="Copy email content"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsSettingsOpen(true)}
                className="h-8 w-8"
                title="Email settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">To:</p>
              <p className="text-sm font-medium">{recipient}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
              <p className="text-sm font-medium">{subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Message:</p>
              <motion.div 
                className="p-4 bg-secondary/50 rounded-md text-sm whitespace-pre-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {formattedBody}
              </motion.div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <motion.div
            whileHover={{ scale: isSending || sent ? 1 : 1.05 }}
            whileTap={{ scale: isSending || sent ? 1 : 0.95 }}
            className="w-full sm:w-auto"
          >
            <Button 
              onClick={handleSend} 
              disabled={isSending || sent}
              className="w-full sm:w-auto button-transition"
              aria-live="polite"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Email Sent
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
      
      <EmailSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </motion.div>
  );
};

export default EmailPreview;
