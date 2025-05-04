import React, { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import AuthDebugger from '@/components/debug/AuthDebugger';

interface User {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  createdAt: string;
}

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  createdAt: string;
}

const ApiExample = () => {
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(true);

  // Example of loading data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Example of making an authenticated GET request
  const fetchUserProfile = async () => {
    try {
      const { data, error, status } = await api.get<{ user: User }>('users/profile');
      
      console.log('Profile API response:', { data, error, status });
      
      if (data) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Test function that specifically tests the applications endpoint
  const fetchApplications = async () => {
    setApplicationError(null);
    try {
      // Use the exact endpoint that works in Postman
      const { data, error, status } = await api.get<{ applications: Application[] }>('applications');
      
      console.log('Applications API response:', { data, error, status });
      
      if (data?.applications) {
        setApplications(data.applications);
      } else if (error) {
        setApplicationError(error);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setApplicationError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Example of handling a form submission with PUT
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    
    try {
      const { data, error, status } = await api.put<{ user: User }>('users/profile', { name });
      
      console.log('Update profile API response:', { data, error, status });
      
      if (data) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  if (api.isLoading && !user) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">API Example</h2>
        <Button variant="outline" size="sm" onClick={toggleDebugMode}>
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </div>
      
      {debugMode && <AuthDebugger />}
      
      {api.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{api.error}</AlertDescription>
        </Alert>
      )}
      
      {user && (
        <div className="bg-secondary/30 p-4 rounded-md">
          <h3 className="font-medium text-lg">User Profile</h3>
          <p><span className="font-medium">Name:</span> {user.name}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Member since:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      )}
      
      <div className="bg-card p-4 rounded-md border shadow-sm">
        <h3 className="font-medium mb-4">Update Profile</h3>
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={user?.name || ''}
            />
          </div>
          
          <Button type="submit" disabled={api.isLoading}>
            {api.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </div>
      
      <div className="bg-card p-4 rounded-md border shadow-sm mt-6">
        <h3 className="font-medium mb-4">Test Applications Endpoint</h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button variant="default" onClick={fetchApplications} disabled={api.isLoading}>
              {api.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test GET /applications
            </Button>
          </div>
          
          {applicationError && (
            <Alert variant="destructive" className="mt-2">
              <AlertTitle>Applications Error</AlertTitle>
              <AlertDescription>{applicationError}</AlertDescription>
            </Alert>
          )}
          
          {applications.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Applications ({applications.length})</h4>
              <ul className="space-y-2">
                {applications.map(app => (
                  <li key={app.id} className="p-3 bg-background rounded-md border">
                    <p><span className="font-medium">Company:</span> {app.company}</p>
                    <p><span className="font-medium">Position:</span> {app.position}</p>
                    <p><span className="font-medium">Status:</span> {app.status}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : applicationError === null && (
            <p className="text-sm text-muted-foreground">No applications found. Click the button to test.</p>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <Button variant="outline" onClick={fetchUserProfile} disabled={api.isLoading}>
          {api.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default ApiExample; 