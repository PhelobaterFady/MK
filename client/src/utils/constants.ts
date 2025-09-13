export const GAMES = [
  {
    id: 'fc26',
    name: 'FC 26',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250'
  }
];

export const USER_LEVELS = {
  1: { requirement: 0, name: 'Novice' },
  2: { requirement: 500, name: 'Trader' },
  3: { requirement: 1000, name: 'Expert' },
  4: { requirement: 1500, name: 'Master' },
  5: { requirement: 2000, name: 'Legend' }
};

export const WALLET_FEE_PERCENTAGE = 0.05; // 5% fee

// Currency settings
export const CURRENCY = {
  symbol: 'EGP',
  code: 'EGP',
  name: 'Egyptian Pound',
  locale: 'en-US'
};

export const CONTACT_INFO_REGEX = /@|\.com|phone|discord|skype|telegram|whatsapp|email|gmail|yahoo|hotmail|\+\d{1,3}[-.\s]?\d|call\s*me|text\s*me|contact\s*me/gi;

export const SUPPORT_CATEGORIES = [
  { value: 'account', label: 'Account Issues' },
  { value: 'payment', label: 'Payment & Wallet' },
  { value: 'order', label: 'Order Problems' },
  { value: 'technical', label: 'Technical Issues' },
  { value: 'security', label: 'Security Concerns' },
  { value: 'other', label: 'Other' }
];

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', description: 'General questions', color: 'text-green-400' },
  { value: 'medium', label: 'Medium', description: 'Order issues', color: 'text-yellow-400' },
  { value: 'high', label: 'High', description: 'Urgent problems', color: 'text-red-400' }
];

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-blue-500/20 text-blue-400' },
  escrow: { label: 'Awaiting Account Details', color: 'bg-yellow-500/20 text-yellow-400' },
  delivered: { label: 'Delivered', color: 'bg-green-500/20 text-green-400' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  disputed: { label: 'Disputed', color: 'bg-red-500/20 text-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' }
};

export const ACCOUNT_STATUSES = {
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400' },
  sold: { label: 'Sold', color: 'bg-blue-500/20 text-blue-400' },
  pending: { label: 'Reserved', color: 'bg-yellow-500/20 text-yellow-400' },
  removed: { label: 'Removed', color: 'bg-red-500/20 text-red-400' }
};
