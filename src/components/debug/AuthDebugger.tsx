import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Developer tool for debugging authentication issues
 * Only include this component during development
 */
const AuthDebugger = () => {
  const { user, tokens, isAuthenticated } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState('applications');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleExpanded = () => setExpanded(prev => !prev);

  const copyTokenToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
  };

  const formatTokenForDisplay = (token: string | undefined) => {
    if (!token) return 'No token';
    if (token.length > 50) {
      return `${token.slice(0, 25)}...${token.slice(-25)}`;
    }
    return token;
  };

  const decodeJwt = (token: string | undefined) => {
    if (!token) return null;
    try {
      // JWT tokens consist of three parts: header, payload, and signature
      // The payload is the middle part, which contains the JWT claims
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      return payload;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const manuallyTestToken = async () => {
    if (!tokens?.accessToken) {
      setTestError('No access token available');
      return;
    }

    setIsLoading(true);
    setTestResponse(null);
    setTestError(null);

    try {
      // Get API URL from env or use default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
      const url = `${apiUrl}/${testEndpoint.startsWith('/') ? testEndpoint.substring(1) : testEndpoint}`;
      
      console.debug('Testing token with request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Log complete response details for debugging
      console.debug('Test response status:', response.status);
      
      const responseHeadersObj = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });
      console.debug('Test response headers:', responseHeadersObj);

      // Try to get response as text first
      const responseText = await response.text();
      console.debug('Test response text:', responseText);
      
      // Try to parse as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
        setTestResponse(data);
      } catch (e) {
        // Not JSON, so just use the text
        setTestResponse({ text: responseText });
      }

      if (!response.ok) {
        setTestError(
          data?.message || data?.error || response.statusText || `Request failed with status ${response.status}`
        );
      }
    } catch (error) {
      console.error('Error testing token:', error);
      setTestError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const accessTokenPayload = decodeJwt(tokens?.accessToken);

  return (
    <Card className="border-red-300 bg-red-50 dark:bg-red-900/10 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Auth Debugger</span>
          <Button variant="outline" size="sm" onClick={toggleExpanded}>
            {expanded ? 'Hide Details' : 'Show Details'}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Authentication Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </CardDescription>
      </CardHeader>
      
      {expanded && (
        <CardContent className="text-xs space-y-2 pt-0">
          <div>
            <div className="font-semibold">User:</div>
            <pre className="bg-background p-2 rounded overflow-auto max-h-32">
              {user ? JSON.stringify(user, null, 2) : 'No user'}
            </pre>
          </div>
          
          <div>
            <div className="flex justify-between">
              <div className="font-semibold">Access Token:</div>
              {tokens?.accessToken && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs"
                  onClick={() => copyTokenToClipboard(tokens.accessToken)}
                >
                  Copy
                </Button>
              )}
            </div>
            <div className="bg-background p-2 rounded overflow-auto max-h-32 break-all">
              {formatTokenForDisplay(tokens?.accessToken)}
            </div>
            
            {accessTokenPayload && (
              <>
                <div className="font-semibold mt-1">Decoded Payload:</div>
                <pre className="bg-background p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(accessTokenPayload, null, 2)}
                </pre>
              </>
            )}
          </div>
          
          <div>
            <div className="flex justify-between">
              <div className="font-semibold">Refresh Token:</div>
              {tokens?.refreshToken && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs"
                  onClick={() => copyTokenToClipboard(tokens.refreshToken)}
                >
                  Copy
                </Button>
              )}
            </div>
            <div className="bg-background p-2 rounded overflow-auto max-h-32 break-all">
              {formatTokenForDisplay(tokens?.refreshToken)}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="font-semibold mb-2">Manual Token Test</div>
            <div className="flex gap-2 mb-2">
              <div className="flex-grow">
                <Label htmlFor="testEndpoint" className="sr-only">Endpoint to test</Label>
                <Input 
                  id="testEndpoint"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  placeholder="API endpoint (e.g. applications)"
                  className="h-8 text-xs"
                />
              </div>
              <Button 
                onClick={manuallyTestToken} 
                disabled={isLoading || !tokens?.accessToken}
                size="sm"
                className="whitespace-nowrap"
              >
                Test Token
              </Button>
            </div>
            
            {testError && (
              <div className="bg-destructive/10 text-destructive p-2 rounded text-xs mt-2">
                Error: {testError}
              </div>
            )}
            
            {testResponse && (
              <div className="mt-2">
                <div className="font-semibold mb-1">Response:</div>
                <pre className="bg-background p-2 rounded overflow-auto max-h-32 text-xs">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}
      
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        <div>
          This component is for development only. Remove before production.
        </div>
      </CardFooter>
    </Card>
  );
};

export default AuthDebugger; 