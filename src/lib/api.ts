import { toast } from "sonner";
import { useAuthStore } from '@/store/authStore';

/**
 * Base API URL for backend services
 * Use environment variable if available, otherwise default to localhost
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8081/api';

// Helper to get the current auth token
const getAuthToken = (): string | null => {
  const authState = useAuthStore.getState();
  return authState.tokens?.accessToken || null;
};

// Handle path differences between different backends
const formatApiPath = (path: string) => {
  // If path doesn't start with /, add it
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If the API_URL already includes '/api', don't add it again
  if (API_URL.endsWith('/api')) {
    return `${API_URL}${formattedPath}`;
  }
  
  // For deployed environments like Render where the URL doesn't include '/api'
  return `${API_URL}/api${formattedPath}`;
};

console.log('Using API URL:', API_URL);

/**
 * Handle API errors
 */
const handleApiError = <T>(error: any, message: string = "An error occurred", defaultReturn: T): T => {
  console.error(`API Error: ${message}`, error);
  
  // Log more error details if available
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
  } else if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
  
  toast.error(message);
  return defaultReturn;
};

// Function to check API health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    console.log("Checking API health...");
    console.log("API URL:", API_URL);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(formatApiPath('/health'), {
      signal: controller.signal,
      method: 'GET',
      headers
    });
    
    clearTimeout(timeoutId);
    
    console.log("API health check response:", response);
    
    if (!response.ok) {
      console.error(`API health check failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log("API health check data:", data);
    
    // More robust status checking - check both the status field and db_status
    if (data.status === 'ok' || data.status === 'success') {
      return true;
    } else if (data.db_status === 'connected') {
      // The API itself is OK if we got a valid response with connected DB
      return true;
    } else {
      console.warn("API health check returned unexpected status:", data.status, "DB status:", data.db_status);
      return false;
    }
  } catch (error) {
    console.error("API health check error:", error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("API health check timed out - the backend server might be down or not responding");
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error("Network error connecting to backend - check if the backend server is running and the API URL is correct");
    }
    return false;
  }
};

/**
 * Type definitions for API responses
 */
export interface JobApplication {
  _id: string;
  id?: string; // Some places use id instead of _id
  recipient_email: string;
  company: string;
  position: string;
  subject: string;
  content: string;
  status: string;
  attachment_path?: string | null;
  follow_up_settings: FollowUpSettings;
  full_name: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  sent_at: string | null;
  updated_at: string;
  sender_email?: string;
  sender_name?: string;
  sender_password?: string;
}

export interface FollowUp {
  _id: string;
  original_application_id: string;
  recipient_email: string;
  company: string | null;
  position: string | null;
  subject: string;
  content: string;
  status: string;
  follow_up_number: number;
  sent_at: string;
}

export interface FollowUpSettings {
  type: 'one_time' | 'periodic_limited' | 'until_response';
  interval_days: number;
  max_count: number;
  follow_up_count: number;
  last_follow_up_date: string | null;
  next_follow_up_date: string | null;
}

/**
 * Job Applications API
 */
export const applicationsApi = {
  // Get all job applications with optional filters
  getAll: async (filters?: {
    recipient?: string;
    company?: string;
    position?: string;
    status?: string;
    limit?: number;
    sort_field?: string;
    sort_order?: number;
  }): Promise<JobApplication[]> => {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.recipient) params.append('recipient_email', filters.recipient);
        if (filters.company) params.append('company', filters.company);
        if (filters.position) params.append('position', filters.position);
        if (filters.status) params.append('status', filters.status);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.sort_field) params.append('sort_field', filters.sort_field);
        if (filters.sort_order !== undefined) params.append('sort_order', filters.sort_order.toString());
      }
      
      // Default to sorting by updated_at descending if not specified
      if (!filters?.sort_field) {
        params.append('sort_field', 'updated_at');
        params.append('sort_order', '-1');
      }

      // Send debugging info to console
      const url = `${formatApiPath('/applications')}?${params.toString()}`;
      console.log(`Fetching applications from: ${url}`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Get authentication token
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers
      });
      
      clearTimeout(timeoutId);
      
      console.log("Applications response:", response);
      console.log("Response headers:", Object.fromEntries([...response.headers]));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response JSON
      const data = await response.json();
      console.log("Applications data:", data);
      
      // API now returns the array directly
      if (Array.isArray(data)) {
        return data;
      } else {
        // For backward compatibility, handle both formats
        if (data && Array.isArray(data.data)) {
          console.warn("API returned deprecated wrapped format");
          return data.data;
        }
        console.error("Received invalid data format from API:", data);
        return [];
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error("Request timed out when fetching applications");
        return handleApiError(error, "Request timed out when fetching applications. The server might be unresponsive.", []);
      }
      return handleApiError(error, "Failed to load job applications", []);
    }
  },
  
  // Create a new job application
  create: async (application: Partial<JobApplication>): Promise<any> => {
    try {
      console.log("Creating application with data:", application);
      console.log(`Sending to: ${formatApiPath('/applications')}`);
      
      // Ensure all required fields are properly formatted for the backend API
      const applicationData = {
        recipient_email: application.recipient_email,
        subject: application.subject,
        content: application.content,
        company: application.company,
        position: application.position,
        status: application.status || 'processing', // Default to processing
        attachment_path: application.attachment_path || null,
        follow_up_settings: application.follow_up_settings || {
          type: 'one_time',
          interval_days: 7,
          max_count: 1,
          follow_up_count: 0,
          last_follow_up_date: null,
          next_follow_up_date: null
        },
        full_name: application.full_name || null,
        portfolio_url: application.portfolio_url || null,
        linkedin_url: application.linkedin_url || null,
        sender_email: application.sender_email,
        sender_name: application.sender_name,
        sender_password: application.sender_password
      };
      
      const response = await fetch(formatApiPath('/applications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        },
        body: JSON.stringify(applicationData),
      });
      
      console.log("Create application response:", response);
      
      // Simply check HTTP status code - throw error for non-success status
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }
      
      // For successful responses, just return the parsed JSON result
      try {
        const result = await response.json();
        console.log("Create application result:", result);
        return result;
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        // Return empty object if can't parse JSON
        return {};
      }
    } catch (error) {
      // Format the error message to be more user-friendly
      let errorMessage = "Failed to create job application";
      if (error instanceof Error) {
        // If it contains email sending error, make it clear
        if (error.message.includes('email')) {
          errorMessage = `Email sending failed: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
        console.error(`API Error: ${errorMessage}`, error);
      }
      
      // Throw the error up to be caught by caller
      throw new Error(errorMessage);
    }
  },
  
  // Update a job application
  update: async (applicationId: string, updates: Partial<JobApplication>): Promise<boolean> => {
    try {
      // Handle potential MongoDB ObjectId structure
      let finalId = applicationId;
      
      // If applicationId is an object
      if (typeof applicationId === 'object') {
        const objectId = applicationId as any;
        if (objectId._id) {
          finalId = objectId._id;
        } else if (objectId.$oid) {
          finalId = objectId.$oid;
        } else {
          console.error("Invalid application ID object:", objectId);
          throw new Error("Invalid application ID");
        }
      }
      
      console.log(`Updating application ${finalId} with data:`, updates);
      
      const response = await fetch(formatApiPath(`/applications/${finalId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update application: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      return handleApiError(error, "Failed to update job application", false);
    }
  },
  
  // Get drafts (convenience method that uses getAll with status=draft)
  getDrafts: async (limit?: number): Promise<JobApplication[]> => {
    return applicationsApi.getAll({
      status: 'draft',
      limit,
      sort_field: 'updated_at',
      sort_order: -1
    });
  },
  
  // Create a draft application
  createDraft: async (application: Partial<JobApplication>): Promise<{ id: string; success: boolean } | null> => {
    return applicationsApi.create({
      ...application,
      status: 'draft'
    });
  },
  
  // Convert a draft to a sent application
  convertDraft: async (draftId: string | any, emailSettings?: {
    sender_email: string;
    sender_name: string;
    sender_password: string;
    smtp_server?: string;
    smtp_port?: number;
  }): Promise<boolean> => {
    try {
      // Extract the string ID if passed an object
      let finalId = draftId;
      if (typeof draftId === 'object') {
        finalId = draftId._id || draftId.$oid || draftId;
        console.log("Extracted ID from object:", finalId);
      }
      
      // First, update the status to 'processing'
      const statusUpdateSuccess = await applicationsApi.update(finalId, { status: 'processing' });
      
      if (!statusUpdateSuccess) {
        throw new Error("Failed to update application status to processing");
      }
      
      // If email settings are provided, try to send the email
      if (emailSettings && emailSettings.sender_email && emailSettings.sender_password) {
        // Get the application data
        const application = await applicationsApi.getById(finalId);
        
        if (!application) {
          console.error("Could not find application to send email");
          // Revert back to draft status since we failed
          await applicationsApi.update(finalId, { status: 'draft' });
          return false;
        }
        
        console.log("Sending email for draft conversion:", application);
        
        // Now send the email
        const emailSent = await emailApi.sendEmail({
          recipient_email: application.recipient_email,
          subject: application.subject,
          email_content: application.content,
          sender_email: emailSettings.sender_email,
          sender_name: emailSettings.sender_name,
          sender_password: emailSettings.sender_password,
          smtp_server: emailSettings.smtp_server || 'smtp.gmail.com',
          smtp_port: emailSettings.smtp_port || 587,
          attachment_path: application.attachment_path || undefined,
          application_id: finalId
        });
        
        console.log("Email sending result:", emailSent);
        
        if (emailSent) {
          // Update to 'sent' only if email was successfully sent
          const finalStatusUpdate = await applicationsApi.update(finalId, { status: 'sent' });
          return finalStatusUpdate;
        } else {
          console.warn("Email not sent, reverting application status to draft");
          // Revert back to draft status since email sending failed
          await applicationsApi.update(finalId, { status: 'draft' });
          return false;
        }
      } else {
        console.log("Email settings not provided, reverting to draft status");
        // No email settings provided, revert to draft
        await applicationsApi.update(finalId, { status: 'draft' });
        return false;
      }
    } catch (error) {
      // On error, try to revert the status back to draft
      try {
        if (typeof draftId === 'object') {
          const finalId = draftId._id || draftId.$oid || draftId;
          await applicationsApi.update(finalId, { status: 'draft' });
        } else {
          await applicationsApi.update(draftId, { status: 'draft' });
        }
      } catch (revertError) {
        console.error("Failed to revert application status:", revertError);
      }
      
      return handleApiError(error, "Failed to convert draft", false);
    }
  },
  
  // Update follow-up settings for a job application
  updateFollowUpSettings: async (applicationId: string, settings: FollowUpSettings): Promise<boolean> => {
    try {
      if (!applicationId) {
        console.error(`Missing application ID`);
        return false;
      }
      
      // Handle potential MongoDB ObjectId structure
      let finalId = applicationId;
      
      // If applicationId looks like an object stringified
      if (applicationId.includes('{') && applicationId.includes('}')) {
        try {
          const parsedId = JSON.parse(applicationId);
          if (parsedId && parsedId.$oid) {
            finalId = parsedId.$oid;
          }
        } catch (e) {
          console.error(`Error parsing applicationId as JSON:`, e);
          // Keep using the original ID
        }
      }
      
      console.log(`Final application ID for follow-up settings update: ${finalId}`);
      console.log(`API URL being used: ${formatApiPath(`/applications/${finalId}`)}`);
      
      // Update to use the general application update endpoint
      const response = await fetch(formatApiPath(`/applications/${finalId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        },
        body: JSON.stringify({ follow_up_settings: settings }),
      });
      
      console.log("Follow-up settings update response:", response);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update follow-up settings: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to update follow-up settings: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Follow-up settings update result:", result);
      return true;
    } catch (error) {
      return handleApiError(error, "Failed to update follow-up settings", false);
    }
  },
  
  // Get a single job application by ID
  getById: async (applicationId: string): Promise<JobApplication | null> => {
    try {
      if (!applicationId) {
        console.error(`Missing application ID`);
        return null;
      }

      // Handle potential MongoDB ObjectId structure
      let finalId = applicationId;
      
      // If applicationId looks like an object stringified
      if (applicationId.includes('{') && applicationId.includes('}')) {
        try {
          const parsedId = JSON.parse(applicationId);
          if (parsedId && parsedId.$oid) {
            finalId = parsedId.$oid;
          }
        } catch (e) {
          console.error(`Error parsing applicationId as JSON:`, e);
          // Keep using the original ID
        }
      }
      
      console.log(`Fetching application with ID (validated): ${finalId}`);
      console.log(`API URL being used: ${formatApiPath(`/applications/${finalId}`)}`);
      
      const response = await fetch(formatApiPath(`/applications/${finalId}`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        }
      });
      
      console.log("Application response:", response);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch application: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Application data:", data);
      
      // API now returns the object directly
      if (data && typeof data === 'object' && !data.success) {
        return data;
      } else {
        // For backward compatibility, handle both formats
        if (data && data.success && data.data) {
          console.warn("API returned deprecated wrapped format");
          return data.data;
        }
        console.error("Received invalid data format from API:", data);
        return null;
      }
    } catch (error) {
      return handleApiError(error, "Failed to load application", null);
    }
  },
  
  // Delete a job application
  delete: async (applicationId: string): Promise<boolean> => {
    try {
      // Handle potential MongoDB ObjectId structure
      let finalId = applicationId;
      
      // If applicationId is an object
      if (typeof applicationId === 'object') {
        const objectId = applicationId as any;
        if (objectId._id) {
          finalId = objectId._id;
        } else if (objectId.$oid) {
          finalId = objectId.$oid;
        } else {
          console.error("Invalid application ID object:", objectId);
          throw new Error("Invalid application ID");
        }
      }
      
      console.log(`Deleting application ${finalId}`);
      
      const response = await fetch(formatApiPath(`/applications/${finalId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete application: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      return handleApiError(error, "Failed to delete job application", false);
    }
  }
};

/**
 * Follow-ups API
 */
export const followUpsApi = {
  // Get all follow-ups with optional filters
  getAll: async (filters?: {
    recipient?: string;
    applicationId?: string;
    company?: string;
    position?: string;
    status?: string;
    limit?: number;
    sort_field?: string;
    sort_order?: number;
  }): Promise<FollowUp[]> => {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.recipient) params.append('recipient', filters.recipient);
        if (filters.applicationId) params.append('application_id', filters.applicationId);
        if (filters.company) params.append('company', filters.company);
        if (filters.position) params.append('position', filters.position);
        if (filters.status) params.append('status', filters.status);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.sort_field) params.append('sort_field', filters.sort_field);
        if (filters.sort_order !== undefined) params.append('sort_order', filters.sort_order.toString());
      }
      
      // Default to sorting by updated_at descending if not specified
      if (!filters?.sort_field) {
        params.append('sort_field', 'updated_at');
        params.append('sort_order', '-1');
      }
      
      const response = await fetch(`${formatApiPath('/followups')}?${params.toString()}`, {
        headers: {
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch follow-ups: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // API now returns the array directly
      if (Array.isArray(data)) {
        return data;
      } else {
        // For backward compatibility, handle both formats
        if (data && Array.isArray(data.data)) {
          console.warn("API returned deprecated wrapped format");
          return data.data;
        }
        console.error("Received invalid data format from API:", data);
        return [];
      }
    } catch (error) {
      return handleApiError(error, "Failed to load follow-ups", []);
    }
  },
  
  // Create a new follow-up
  create: async (followUp: {
    recipient_email: string;
    subject: string;
    content: string;
    original_application_id?: string;
    company?: string;
    position?: string;
    status?: string;
    sender_email?: string;
    sender_name?: string;
    sender_password?: string;
    smtp_server?: string;
    smtp_port?: number;
  }): Promise<{ id: string; success: boolean; email_sent: boolean } | null> => {
    try {
      const response = await fetch(formatApiPath('/followups'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        },
        body: JSON.stringify(followUp),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create follow-up: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to create follow-up", null);
    }
  },
  
  // Update a follow-up status
  updateStatus: async (followUpId: string, status: string): Promise<boolean> => {
    try {
      const response = await fetch(formatApiPath(`/followups/${followUpId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update follow-up status: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      return handleApiError(error, "Failed to update follow-up status", false);
    }
  },
  
  // Get applications that need follow-ups by filtering applications by status
  getApplicationsNeedingFollowUp: async (): Promise<JobApplication[]> => {
    try {
      // Filter applications that are sent but not responded to
      return applicationsApi.getAll({
        status: 'sent'
      });
    } catch (error) {
      return handleApiError(error, "Failed to load applications due for follow-up", []);
    }
  }
};

/**
 * Email Sending API
 */
export interface EmailData {
  recipient_email: string;
  subject: string;
  email_content: string;
  sender_email: string;
  sender_name: string;
  sender_password: string;
  smtp_server?: string;
  smtp_port?: number;
  attachment_path?: string;
  application_id?: string;
}

export const emailApi = {
  // Send an email directly
  sendEmail: async (data: EmailData): Promise<boolean> => {
    try {
      const response = await fetch(formatApiPath('/send-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      return handleApiError(error, "Failed to send email", false);
    }
  }
}; 