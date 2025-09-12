import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(20),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  role: z.enum(["user", "vip", "admin"]).default("user"),
  level: z.number().default(1),
  totalTrades: z.number().default(0),
  walletBalance: z.number().default(0),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().default(0),
  badges: z.array(z.string()).default([]),
  joinDate: z.date(),
  lastActive: z.date().optional(),
  isVerified: z.boolean().default(false),
  isBanned: z.boolean().default(false)
});

export const insertUserSchema = userSchema.omit({ id: true });
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Game Account schema
export const gameAccountSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  game: z.enum(["fifa", "valorant", "lol", "pubg", "cod"]),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(1000),
  price: z.number().min(1),
  images: z.array(z.string()).default([]),
  gameSpecificData: z.record(z.any()), // Game-specific fields
  status: z.enum(["active", "sold", "pending", "removed"]).default("active"),
  views: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  featuredUntil: z.date().optional()
});

export const insertGameAccountSchema = gameAccountSchema.omit({ 
  id: true, 
  views: true, 
  createdAt: true, 
  updatedAt: true 
});

export type GameAccount = z.infer<typeof gameAccountSchema>;
export type InsertGameAccount = z.infer<typeof insertGameAccountSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  accountId: z.string(),
  amount: z.number(),
  status: z.enum(["pending", "escrow", "delivered", "completed", "disputed", "cancelled"]),
  escrowAmount: z.number(),
  createdAt: z.date(),
  deliveredAt: z.date().optional(),
  completedAt: z.date().optional(),
  notes: z.string().optional()
});

export const insertOrderSchema = orderSchema.omit({ 
  id: true, 
  createdAt: true 
});

export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Chat Message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  senderId: z.string(),
  content: z.string().max(500),
  timestamp: z.date(),
  isFiltered: z.boolean().default(false),
  filteredReason: z.string().optional()
});

export const insertChatMessageSchema = chatMessageSchema.omit({ 
  id: true, 
  timestamp: true 
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Wallet Transaction schema
export const walletTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["topup", "withdraw", "purchase", "sale", "fee", "refund"]),
  amount: z.number(),
  description: z.string(),
  status: z.enum(["pending", "completed", "failed", "cancelled"]),
  paymentMethod: z.string().optional(),
  externalTransactionId: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional()
});

export const insertWalletTransactionSchema = walletTransactionSchema.omit({ 
  id: true, 
  createdAt: true 
});

export type WalletTransaction = z.infer<typeof walletTransactionSchema>;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;

// Wallet Request schema (for admin approval)
export const walletRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["topup", "withdraw"]),
  amount: z.number(),
  amountAfterFee: z.number(),
  walletName: z.string().optional(),
  paymentMethod: z.string().optional(),
  accountDetails: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "completed"]),
  adminId: z.string().optional(),
  adminNotes: z.string().optional(),
  createdAt: z.date(),
  processedAt: z.date().optional()
});

export const insertWalletRequestSchema = walletRequestSchema.omit({ 
  id: true, 
  createdAt: true 
});

export type WalletRequest = z.infer<typeof walletRequestSchema>;
export type InsertWalletRequest = z.infer<typeof insertWalletRequestSchema>;

// Support Ticket schema
export const supportTicketSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.enum(["account", "payment", "order", "technical", "security", "other"]),
  subject: z.string().max(100),
  description: z.string().max(1000),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  orderId: z.string().optional(),
  adminId: z.string().optional(),
  adminResponse: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional()
});

export const insertSupportTicketSchema = supportTicketSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// Game-specific field schemas
export const fifaAccountFields = z.object({
  platform: z.enum(["PS4", "PS5", "Xbox", "PC"]),
  coins: z.number(),
  level: z.number(),
  overallRating: z.number(),
  region: z.string(),
  transferBan: z.boolean().default(false)
});

export const valorantAccountFields = z.object({
  rank: z.string(),
  rr: z.number(),
  agents: z.number(),
  skins: z.number(),
  region: z.string(),
  level: z.number()
});

export const lolAccountFields = z.object({
  rank: z.string(),
  lp: z.number(),
  champions: z.number(),
  skins: z.number(),
  region: z.string(),
  level: z.number(),
  blueEssence: z.number()
});

export const pubgAccountFields = z.object({
  rank: z.string(),
  level: z.number(),
  bp: z.number(),
  skins: z.number(),
  region: z.string(),
  tier: z.string()
});

export const codAccountFields = z.object({
  rank: z.string(),
  level: z.number(),
  prestige: z.number(),
  kd: z.number(),
  wins: z.number(),
  region: z.string()
});

export type FifaAccountFields = z.infer<typeof fifaAccountFields>;
export type ValorantAccountFields = z.infer<typeof valorantAccountFields>;
export type LolAccountFields = z.infer<typeof lolAccountFields>;
export type PubgAccountFields = z.infer<typeof pubgAccountFields>;
export type CodAccountFields = z.infer<typeof codAccountFields>;
