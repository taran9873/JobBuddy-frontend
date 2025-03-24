import React from 'react';

export type EmailTemplateType = 'application' | 'followUp';

export interface TemplateData {
  fullName: string;
  position: string;
  company: string;
  portfolio?: string;
  linkedIn?: string;
  previousEmail?: string;
  sentDate?: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

export const generateEmailTemplate = (
  type: EmailTemplateType,
  data: TemplateData
): EmailTemplate => {
  if (type === 'application') {
    return {
      subject: `${data.fullName} - Application for ${data.position} position`,
      body: `Dear Hiring Manager,

I hope this email finds you well. I am reaching out to express my strong interest in the ${data.position} position at ${data.company}. I was excited to learn about this opportunity and believe my skills and experience align well with what you're looking for.

Throughout my career, I have developed expertise relevant to this role, and I'm particularly drawn to ${data.company} because of your reputation for innovation and excellence in the industry.

${data.portfolio ? `To provide a better understanding of my work, please visit my portfolio at: ${data.portfolio}` : ''}
${data.linkedIn ? `For a detailed overview of my professional background: ${data.linkedIn}` : ''}

I have attached my resume and cover letter that outline my qualifications in more detail. I would appreciate the opportunity to discuss how my background, skills, and enthusiasm would make me a valuable addition to your team.

Thank you for considering my application. I look forward to the possibility of speaking with you soon.

Best regards,
${data.fullName}`
    };
  } else {
    return {
      subject: `Follow-up: ${data.fullName} - Application for ${data.position} position`,
      body: `Dear Hiring Manager,

I hope this message finds you well. I am writing to follow up on my application for the ${data.position} position that I submitted ${data.sentDate ? `on ${data.sentDate}` : 'recently'}.

I remain very enthusiastic about the opportunity to join ${data.company} and contribute to your team. I'm particularly interested in discussing how my experience can help address the challenges and goals of your organization.

${data.previousEmail ? `For your convenience, I've included my original application below.\n\n---\n\n${data.previousEmail}` : ''}

Thank you for your time and consideration. I understand that the hiring process can take time, and I appreciate your thoroughness in selecting the right candidate. Please let me know if you need any additional information from me.

Best regards,
${data.fullName}`
    };
  }
};

const EmailTemplates: React.FC<{
  type: EmailTemplateType;
  data: TemplateData;
  onChange: (template: EmailTemplate) => void;
}> = ({ type, data, onChange }) => {
  
  React.useEffect(() => {
    const template = generateEmailTemplate(type, data);
    onChange(template);
  }, [type, data, onChange]);
  
  return null; // This is a logic component, no UI
};

export default EmailTemplates;
