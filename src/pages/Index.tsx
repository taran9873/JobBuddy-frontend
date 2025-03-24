
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import EmailForm from '../components/EmailForm';
import EmailPreview from '../components/EmailPreview';

const Index = () => {
  const [previewMode, setPreviewMode] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: '',
    subject: '',
    body: '',
  });

  const handlePreview = (recipient: string, subject: string, body: string) => {
    setEmailData({ recipient, subject, body });
    setPreviewMode(true);
  };

  const handleBack = () => {
    setPreviewMode(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-secondary/50 px-4 sm:px-6">
      <Header />
      
      <main className="flex-grow w-full max-w-4xl flex flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          {previewMode ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <EmailPreview
                recipient={emailData.recipient}
                subject={emailData.subject}
                body={emailData.body}
                onBack={handleBack}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <EmailForm onPreview={handlePreview} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Streamline your job application process
        </motion.p>
      </footer>
    </div>
  );
};

export default Index;
