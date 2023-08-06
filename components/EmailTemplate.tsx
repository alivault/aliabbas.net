import * as React from 'react';

interface EmailTemplateProps {
  email: string;
  message: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  email,
  message,
}) => (
  <div>
    <p>{email}:</p>
    <p>{message}</p>
  </div>
);
