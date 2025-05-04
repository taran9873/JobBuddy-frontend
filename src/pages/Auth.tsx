import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const Auth = () => {
  const { login, register, error, isLoading, clearError } = useAuthStore();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Register form errors
  const [registerErrors, setRegisterErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user types
    setRegisterErrors(prev => ({ ...prev, [name]: '' }));
    if (error) clearError();
  };
  
  const validateRegisterForm = () => {
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;
    
    if (!registerData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    if (!registerData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!registerData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (registerData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setRegisterErrors(errors);
    return isValid;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData.email, loginData.password);
      if (!error) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      // Error is handled in the store
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    try {
      await register(registerData.name, registerData.email, registerData.password);
      if (!error) {
        toast.success('Registration successful!');
        navigate('/dashboard');
      }
    } catch (err) {
      // Error is handled in the store
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/50 px-4 sm:px-6 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? 'Log in to your account to continue' 
                : 'Sign up to start using Email Apply Buddy'}
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="email">Email</Label>
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className="focus-visible:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        value={loginData.password}
                        onChange={handleLoginChange}
                        className="focus-visible:ring-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="name">Full Name</Label>
                    </div>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      className={registerErrors.name ? 'border-destructive' : ''}
                    />
                    {registerErrors.name && (
                      <p className="text-destructive text-xs mt-1">{registerErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="register-email">Email</Label>
                    </div>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      className={registerErrors.email ? 'border-destructive' : ''}
                    />
                    {registerErrors.email && (
                      <p className="text-destructive text-xs mt-1">{registerErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="register-password">Password</Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="register-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        className={`pr-10 ${registerErrors.password ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerErrors.password && (
                      <p className="text-destructive text-xs mt-1">{registerErrors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                    </div>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      className={registerErrors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {registerErrors.confirmPassword && (
                      <p className="text-destructive text-xs mt-1">{registerErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Register'}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground pt-4">
                {activeTab === 'login' ? (
                  <>Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('register')}>Sign up</Button></>
                ) : (
                  <>Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('login')}>Sign in</Button></>
                )}
              </p>
            </CardFooter>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth; 