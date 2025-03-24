import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format as formatDate } from 'date-fns';

export interface Application {
  id: string;
  recipient: string;
  subject: string;
  position: string;
  company: string;
  sentDate: string;
  fullName: string;
  portfolio?: string;
  linkedIn?: string;
  lastFollowUp?: string;
  followUpCount: number;
  autoFollowUp: {
    enabled: boolean;
    intervalType: 'days' | 'hours' | 'minutes'; // New field to specify the unit of time
    interval: number; // Amount of time in the specified unit
    maxFollowUps: number;
  };
  status: 'draft' | 'sent'; // New field to track application status
}

// Sample data to pre-populate the store
const sampleApplications: Application[] = [
  {
    id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    recipient: "hiring@techcorp.com",
    subject: "John Smith - Application for Frontend Developer position",
    position: "Frontend Developer",
    company: "TechCorp",
    sentDate: "April 15, 2023",
    fullName: "John Smith",
    portfolio: "https://johnsmith.dev",
    linkedIn: "https://linkedin.com/in/johnsmith",
    followUpCount: 1,
    lastFollowUp: "April 25, 2023",
    autoFollowUp: {
      enabled: false,
      intervalType: 'days',
      interval: 2,
      maxFollowUps: 5
    },
    status: 'sent'
  },
  {
    id: "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
    recipient: "careers@designstudio.com",
    subject: "John Smith - Application for UI/UX Designer position",
    position: "UI/UX Designer",
    company: "Design Studio",
    sentDate: "May 3, 2023",
    fullName: "John Smith",
    portfolio: "https://johnsmith.dev/design",
    linkedIn: "https://linkedin.com/in/johnsmith",
    followUpCount: 2,
    lastFollowUp: "May 20, 2023",
    autoFollowUp: {
      enabled: true,
      intervalType: 'days',
      interval: 7,
      maxFollowUps: 3
    },
    status: 'sent'
  },
  {
    id: "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
    recipient: "jobs@innovatech.io",
    subject: "John Smith - Application for Full Stack Developer position",
    position: "Full Stack Developer",
    company: "InnovaTech",
    sentDate: "June 12, 2023",
    fullName: "John Smith",
    linkedIn: "https://linkedin.com/in/johnsmith",
    followUpCount: 0,
    autoFollowUp: {
      enabled: false,
      intervalType: 'days',
      interval: 2,
      maxFollowUps: 5
    },
    status: 'sent'
  },
  {
    id: "4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s",
    recipient: "recruiting@startupxyz.com",
    subject: "John Smith - Application for Product Manager position",
    position: "Product Manager",
    company: "StartupXYZ",
    sentDate: "July 5, 2023",
    fullName: "John Smith",
    portfolio: "https://johnsmith.dev/product",
    linkedIn: "https://linkedin.com/in/johnsmith",
    followUpCount: 3,
    lastFollowUp: "August 2, 2023",
    autoFollowUp: {
      enabled: true,
      intervalType: 'days',
      interval: 10,
      maxFollowUps: 2
    },
    status: 'sent'
  },
  // Sample draft application
  {
    id: "5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t",
    recipient: "",
    subject: "Draft Application - Software Developer at TechStartup",
    position: "Software Developer",
    company: "TechStartup",
    sentDate: formatDate(new Date(), 'PP'),
    fullName: "",
    portfolio: "",
    linkedIn: "",
    followUpCount: 0,
    autoFollowUp: {
      enabled: false,
      intervalType: 'days',
      interval: 2,
      maxFollowUps: 5
    },
    status: 'draft'
  }
];

interface ApplicationState {
  applications: Application[];
  addApplication: (application: Omit<Application, 'id' | 'followUpCount' | 'autoFollowUp' | 'status'>) => string;
  updateApplication: (id: string, application: Partial<Application>) => void;
  incrementFollowUpCount: (id: string) => void;
  getApplication: (id: string) => Application | undefined;
  getApplicationByEmail: (email: string) => Application | undefined;
  removeApplication: (id: string) => void;
  saveDraft: (draft: Partial<Application>) => string;
  getDraftApplications: () => Application[];
  getSentApplications: () => Application[];
  completeApplication: (id: string, application: Partial<Application>) => void;
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      // Initialize with sample data
      applications: sampleApplications,
      
      addApplication: (application) => {
        const id = crypto.randomUUID();
        set((state) => ({
          applications: [
            ...state.applications,
            {
              ...application,
              id,
              followUpCount: 0,
              autoFollowUp: {
                enabled: false,
                intervalType: 'days',
                interval: 2,
                maxFollowUps: 5
              },
              status: 'sent'
            }
          ]
        }));
        return id;
      },
      
      saveDraft: (draft) => {
        const id = draft.id || crypto.randomUUID();
        const today = new Date();
        
        set((state) => {
          // Check if the draft already exists
          const existingDraftIndex = state.applications.findIndex(app => app.id === id);
          
          if (existingDraftIndex !== -1) {
            // Update existing draft
            return {
              applications: state.applications.map((app, index) => 
                index === existingDraftIndex ? { ...app, ...draft } : app
              )
            };
          } else {
            // Create new draft
            return {
              applications: [
                ...state.applications,
                {
                  id,
                  recipient: draft.recipient || '',
                  subject: draft.subject || `Draft - ${draft.position} at ${draft.company}`,
                  position: draft.position || '',
                  company: draft.company || '',
                  sentDate: formatDate(today, 'PP'),
                  fullName: draft.fullName || '',
                  portfolio: draft.portfolio || '',
                  linkedIn: draft.linkedIn || '',
                  followUpCount: 0,
                  autoFollowUp: {
                    enabled: false,
                    intervalType: 'days',
                    interval: 2,
                    maxFollowUps: 5
                  },
                  status: 'draft'
                }
              ]
            };
          }
        });
        
        return id;
      },
      
      completeApplication: (id, application) => {
        set((state) => ({
          applications: state.applications.map((app) => 
            app.id === id 
              ? { 
                  ...app, 
                  ...application,
                  status: 'sent'
                } 
              : app
          )
        }));
      },
      
      getDraftApplications: () => get().applications.filter(app => app.status === 'draft'),
      
      getSentApplications: () => get().applications.filter(app => app.status === 'sent'),
      
      updateApplication: (id, updatedApplication) => set((state) => ({
        applications: state.applications.map((app) => 
          app.id === id ? { ...app, ...updatedApplication } : app
        )
      })),

      incrementFollowUpCount: (id) => set((state) => ({
        applications: state.applications.map((app) => 
          app.id === id 
            ? { 
                ...app, 
                followUpCount: app.followUpCount + 1,
                lastFollowUp: new Date().toISOString()
              } 
            : app
        )
      })),
      
      removeApplication: (id) => set((state) => ({
        applications: state.applications.filter(app => app.id !== id)
      })),
      
      getApplication: (id) => get().applications.find(app => app.id === id),
      
      getApplicationByEmail: (email) => get().applications.find(app => app.recipient === email),
    }),
    {
      name: 'application-storage',
    }
  )
);

// Helper function to format dates
function format(date: Date, formatStr: string) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
