# JobTrack - Activity Management Application

## Overview

JobTrack is a comprehensive activity management and calendar application designed for tracking projects, meetings, training sessions, and holidays. The application provides multiple calendar views (timeline, month, week, day) with advanced filtering, notification systems, and administrative features. Built with a modern tech stack focusing on user experience and data visualization, it offers both desktop and mobile-responsive interfaces.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Styling**: Tailwind CSS with custom component library using Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Animations**: Framer Motion for smooth UI transitions and interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for consistent type safety across the stack
- **API Design**: RESTful API with proper HTTP status codes and JSON responses
- **File Structure**: Modular architecture with separate concerns for routes, storage, and services
- **CORS Configuration**: Fully permissive CORS setup for deployed environments

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Data Modeling**: Structured schema with proper relationships between users, activities, notifications, and preferences

### Authentication and Authorization
- **Multi-layered Auth**: Combination of session-based authentication and localStorage tokens
- **Admin System**: Special admin authentication with hardcoded tokens for reliability in deployed environments
- **Role-based Access**: User and admin roles with different permission levels
- **Fallback Methods**: Multiple authentication methods including URL parameters, headers, and cookies for environment flexibility

### Calendar and Date Management
- **Multiple Views**: Timeline (Gantt-style), month, week, and day views
- **Date Libraries**: date-fns for comprehensive date manipulation and formatting
- **Holiday Integration**: Static holiday dataset with region-specific holidays
- **Timezone Handling**: Proper date handling across different calendar views

### Notification System
- **Multi-channel Notifications**: App notifications, email (via SendGrid), and Slack integration
- **Scheduling**: Advanced notification scheduling with lead time preferences
- **Provider Pattern**: Pluggable notification providers for different delivery methods
- **User Preferences**: Configurable notification settings per user

### Import/Export Functionality
- **Multiple Formats**: Support for CSV, JSON, and Excel file formats
- **XLSX Library**: Sheet.js for Excel file processing
- **PDF Generation**: Custom PDF generation for activity statistics and reports
- **Drag-and-drop**: Modern file upload interface with validation

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Database URL**: Environment variable-based connection configuration

### Email Services
- **SendGrid**: Email delivery service for notification emails
- **API Integration**: SendGrid Web API for reliable email sending

### Communication Services
- **Slack Web API**: Integration for sending notifications to Slack channels
- **Webhook Support**: Configurable Slack integration for team notifications

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Lucide React**: Modern icon library for consistent iconography
- **React Chartjs**: Chart.js integration for data visualization

### Development and Build Tools
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript Compiler**: Type checking and compilation
- **Drizzle Kit**: Database schema management and migrations

### Third-party Integrations
- **Replit Plugins**: Custom Vite plugins for Replit-specific features
- **Theme System**: JSON-based theme configuration with CSS custom properties
- **Font Integration**: Google Fonts (Roboto) and Material Icons