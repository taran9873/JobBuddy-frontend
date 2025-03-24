import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EmailTemplates {
  jobApplication: string;
  followUp: string;
}

export interface EmailSettings {
  smtpServer: string;
  smtpPort: number;
  senderEmail: string;
  senderName: string;
  senderPassword: string;
  templates?: EmailTemplates;
}

interface EmailSettingsState {
  settings: EmailSettings;
  updateSettings: (settings: Partial<EmailSettings>) => void;
}

const DEFAULT_SETTINGS: EmailSettings = {
  smtpServer: 'smtp.gmail.com',
  smtpPort: 587,
  senderEmail: '',
  senderName: '',
  senderPassword: '',
  templates: {
    jobApplication: `Dear {recipientName},

I am writing to express my interest in the {position} position at {company}. With my background in {skill}, I believe I would be a great fit for this role.

{customMessage}

I have attached my resume for your review. I look forward to the opportunity to discuss how my skills and experiences align with your needs.

Best regards,
{senderName}`,
    followUp: `Dear {recipientName},

I hope this email finds you well. I am writing to follow up on my application for the {position} position that I submitted on {applicationDate}.

I remain very interested in this opportunity and would appreciate any update you can provide regarding the status of my application.

Thank you for your time and consideration.

Best regards,
{senderName}`
  }
};

export const useEmailSettingsStore = create<EmailSettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'email-settings-storage',
    }
  )
); 