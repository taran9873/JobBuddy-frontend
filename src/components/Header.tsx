import React from 'react';
import { motion } from 'framer-motion';
import { Send, Moon, Sun, LayoutDashboard, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/home');
  };

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <header className="py-8 sm:py-12 w-full flex flex-col items-center relative">
      <div className="absolute right-4 top-4 flex gap-2 items-center">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">
              <Button 
                variant="ghost" 
                size="icon"
                aria-label="Go to dashboard"
                className="relative"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/api-test">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                API Test
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.name}
                </div>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Link to="/auth">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center"
              >
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          </>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      
      <Link to="/home" className="no-underline">
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Send className="h-6 w-6 mr-2 text-primary" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Email Apply Buddy
          </h1>
        </motion.div>
      </Link>
      <motion.p 
        className="text-center mt-2 text-sm text-muted-foreground max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Effortlessly send job applications and follow-up emails
      </motion.p>
    </header>
  );
};

export default Header;
