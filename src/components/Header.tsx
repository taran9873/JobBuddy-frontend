import React from 'react';
import { motion } from 'framer-motion';
import { Send, Moon, Sun, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';

const Header = () => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <header className="py-8 sm:py-12 w-full flex flex-col items-center relative">
      <div className="absolute right-4 top-4 flex gap-2">
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
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      
      <Link to="/" className="no-underline">
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
