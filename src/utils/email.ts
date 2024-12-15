import { generateToken } from './token';

export const generateInvitationToken = (email: string, role: string): string => {
  return generateToken({ email, role });
};

export const sendInvitationEmail = async (email: string, token: string): Promise<void> => {
  // In development, we'll just log the invitation link
  // In production, this would make an API call to your backend
  const invitationLink = `${window.location.origin}/register?token=${token}`;
  console.log('Invitation email sent to:', email);
  console.log('Invitation link:', invitationLink);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
};