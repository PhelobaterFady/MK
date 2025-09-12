# Overview

Monlyking is a full-stack web application for buying and selling gaming accounts across multiple games (FIFA, Valorant, League of Legends, PUBG, Call of Duty). The platform features a comprehensive marketplace, user level system, wallet management with transaction fees, real-time chat system, and admin dashboard. The application is built with React/TypeScript frontend and Express.js backend, using Firebase for authentication, real-time database, and storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: React Context for authentication and theme, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with development optimizations

## Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle configured for PostgreSQL (though currently using Firebase Realtime Database)
- **API Structure**: RESTful endpoints under `/api` prefix
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development

## Authentication & User Management
- **Primary Auth**: Firebase Authentication with email/password and Google OAuth
- **User Profiles**: Stored in Firebase Realtime Database with comprehensive user schema
- **Level System**: Automatic progression based on total trades (Level 1-5, requiring 500/1000/1500/2000+ trades)
- **Role System**: User, VIP, and Admin roles with different permissions

## Database Design
- **Primary Database**: Firebase Realtime Database for real-time features
- **Backup Config**: Drizzle configured for potential PostgreSQL migration
- **Key Collections**: users, gameAccounts, orders, chatMessages, walletRequests, supportTickets
- **Data Models**: Comprehensive Zod schemas for type safety and validation

## Real-time Features
- **Chat System**: Firebase Realtime Database for instant messaging between buyers/sellers
- **Content Filtering**: Regex-based filter to prevent sharing contact information
- **Live Updates**: Real-time order status updates and notifications

## File Upload & Storage
- **Service**: Firebase Storage for account screenshots and images
- **Limits**: Maximum 5 images per game account listing
- **Processing**: Client-side image upload with progress tracking

## Wallet System
- **Fee Structure**: 5% fee on both top-ups and withdrawals
- **Request Management**: Admin approval system for wallet transactions
- **Balance Tracking**: Real-time wallet balance updates

## Admin Features
- **Dashboard**: Centralized admin panel for managing wallet requests, support tickets, and users
- **Moderation**: Content filtering and user management capabilities
- **Analytics**: User level progression and transaction monitoring

# External Dependencies

## Authentication & Database
- **Firebase Authentication**: Email/password and Google OAuth integration
- **Firebase Realtime Database**: Primary data storage with real-time synchronization
- **Firebase Storage**: Image and file storage for account listings
- **Firebase Functions**: Serverless functions for backend logic (configured but not implemented)

## UI & Styling
- **shadcn/ui**: Complete UI component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility and customization
- **TailwindCSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

## Development & Build
- **Vite**: Fast build tool with HMR and development optimizations
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database migration and schema management (configured for PostgreSQL)
- **ESBuild**: Fast JavaScript bundler for production builds

## Validation & Forms
- **Zod**: Schema validation for all data models and forms
- **React Hook Form**: Form state management with validation integration
- **TanStack Query**: Server state management and caching

## Additional Services
- **Neon Database**: Serverless PostgreSQL (configured via @neondatabase/serverless)
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Component variant management for consistent styling