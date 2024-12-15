// Simple token system for development
export const generateToken = (data: Record<string, any>): string => {
  const payload = btoa(JSON.stringify({
    ...data,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  }));
  return payload;
};

export const verifyToken = (token: string): Record<string, any> | null => {
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};