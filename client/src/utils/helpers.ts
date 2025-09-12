export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getUserLevel = (totalTrades: number): number => {
  if (totalTrades >= 2000) return 5;
  if (totalTrades >= 1500) return 4;
  if (totalTrades >= 1000) return 3;
  if (totalTrades >= 500) return 2;
  return 1;
};

export const getNextLevelRequirement = (currentLevel: number): number => {
  switch (currentLevel) {
    case 1: return 500;
    case 2: return 1000;
    case 3: return 1500;
    case 4: return 2000;
    default: return 2000;
  }
};

export const getLevelProgress = (totalTrades: number, currentLevel: number): number => {
  const nextLevelReq = getNextLevelRequirement(currentLevel);
  const prevLevelReq = currentLevel > 1 ? getNextLevelRequirement(currentLevel - 1) : 0;
  
  const progress = ((totalTrades - prevLevelReq) / (nextLevelReq - prevLevelReq)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

export const getLevelBadgeColor = (level: number): string => {
  if (level >= 5) return 'bg-gradient-to-r from-pink-500 to-violet-500';
  if (level >= 4) return 'bg-gradient-to-r from-purple-500 to-pink-500';
  if (level >= 3) return 'bg-gradient-to-r from-green-500 to-blue-500';
  if (level >= 2) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
  return 'bg-gradient-to-r from-gray-500 to-gray-600';
};

export const getGameBadgeColor = (game: string): string => {
  switch (game) {
    case 'fifa': return 'bg-green-500/20 text-green-400';
    case 'valorant': return 'bg-red-500/20 text-red-400';
    case 'lol': return 'bg-blue-500/20 text-blue-400';
    case 'pubg': return 'bg-yellow-500/20 text-yellow-400';
    case 'cod': return 'bg-orange-500/20 text-orange-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'active':
    case 'completed':
    case 'approved':
    case 'resolved':
      return 'bg-green-500/20 text-green-400';
    
    case 'pending':
    case 'escrow':
    case 'in_progress':
      return 'bg-yellow-500/20 text-yellow-400';
    
    case 'delivered':
    case 'open':
      return 'bg-blue-500/20 text-blue-400';
    
    case 'cancelled':
    case 'rejected':
    case 'removed':
    case 'closed':
      return 'bg-red-500/20 text-red-400';
    
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateOrderId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GV-${timestamp.slice(-6)}-${random}`;
};

export const generateTicketId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ST-${new Date().getFullYear()}-${timestamp.slice(-4)}${random}`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/[<>]/g, '');
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastExecution = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      func(...args);
      lastExecution = now;
    }
  };
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadFile = (data: any, filename: string, type: string = 'application/json'): void => {
  const file = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
