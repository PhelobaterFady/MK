import { z } from 'zod';

export const emailSchema = z.string().email('Please enter a valid email address');

export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const priceSchema = z
  .number()
  .min(1, 'Price must be at least $1')
  .max(10000, 'Price cannot exceed $10,000');

export const titleSchema = z
  .string()
  .min(10, 'Title must be at least 10 characters')
  .max(100, 'Title must be less than 100 characters');

export const descriptionSchema = z
  .string()
  .min(50, 'Description must be at least 50 characters')
  .max(1000, 'Description must be less than 1000 characters');

export const walletAmountSchema = z
  .number()
  .min(10, 'Minimum amount is $10')
  .max(5000, 'Maximum amount is $5,000');

export const supportSubjectSchema = z
  .string()
  .min(5, 'Subject must be at least 5 characters')
  .max(100, 'Subject must be less than 100 characters');

export const supportDescriptionSchema = z
  .string()
  .min(20, 'Description must be at least 20 characters')
  .max(1000, 'Description must be less than 1000 characters');

export const chatMessageSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(500, 'Message must be less than 500 characters');

export const contactInfoFilter = (text: string): boolean => {
  const contactRegex = /@|\.com|phone|discord|skype|telegram|whatsapp|email|gmail|yahoo|hotmail|\+\d{1,3}[-.\s]?\d|call\s*me|text\s*me|contact\s*me/gi;
  return contactRegex.test(text);
};

export const validateGameSpecificData = (game: string, data: Record<string, any>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (game) {
    case 'fifa':
      if (!data.platform) errors.push('Platform is required');
      if (!data.coins || data.coins < 0) errors.push('FIFA Coins must be specified');
      if (!data.level || data.level < 1 || data.level > 100) errors.push('Level must be between 1-100');
      if (!data.overallRating || data.overallRating < 1 || data.overallRating > 99) errors.push('Overall Rating must be between 1-99');
      if (!data.region) errors.push('Region is required');
      break;

    case 'valorant':
      if (!data.rank) errors.push('Rank is required');
      if (!data.rr || data.rr < 0) errors.push('Rank Rating must be specified');
      if (!data.agents || data.agents < 0 || data.agents > 25) errors.push('Agents must be between 0-25');
      if (!data.level || data.level < 1) errors.push('Account level is required');
      if (!data.region) errors.push('Region is required');
      break;

    case 'lol':
      if (!data.rank) errors.push('Rank is required');
      if (!data.lp || data.lp < 0) errors.push('League Points must be specified');
      if (!data.champions || data.champions < 0 || data.champions > 164) errors.push('Champions must be between 0-164');
      if (!data.level || data.level < 1) errors.push('Account level is required');
      break;

    case 'pubg':
      if (!data.rank) errors.push('Rank is required');
      if (!data.tier) errors.push('Tier is required');
      if (!data.level || data.level < 1) errors.push('Account level is required');
      if (!data.region) errors.push('Region is required');
      break;

    case 'cod':
      if (!data.rank) errors.push('Rank is required');
      if (!data.level || data.level < 1) errors.push('Account level is required');
      if (data.prestige !== undefined && (data.prestige < 0 || data.prestige > 10)) {
        errors.push('Prestige must be between 0-10');
      }
      if (!data.region) errors.push('Region is required');
      break;

    default:
      errors.push('Invalid game selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateFee = (amount: number, feePercentage: number = 0.05): { 
  amountAfterFee: number; 
  feeAmount: number; 
  originalAmount: number 
} => {
  const feeAmount = amount * feePercentage;
  const amountAfterFee = amount - feeAmount;
  
  return {
    amountAfterFee: Math.round(amountAfterFee * 100) / 100,
    feeAmount: Math.round(feeAmount * 100) / 100,
    originalAmount: amount
  };
};

export const calculateRequiredPayment = (desiredCredit: number, feePercentage: number = 0.05): number => {
  // If user wants $1000 credit with 5% fee, they need to pay $1052.63
  // Because $1052.63 - (5% of $1052.63) = $1000
  return Math.round((desiredCredit / (1 - feePercentage)) * 100) / 100;
};
