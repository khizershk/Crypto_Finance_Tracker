# Crypto Finance Tracker

A full-stack web application designed to provide real-time cryptocurrency transaction tracking and budget management capabilities, with a focus on Ethereum transactions. The system implements a hybrid storage architecture and comprehensive notification system to deliver a robust financial management experience.

## System Architecture

The application is built on a modern tech stack utilizing:
- **Frontend**: React with TypeScript and Vite for optimal development experience
- **Backend**: Express.js server with TypeScript
- **Storage**: Hybrid storage system combining MongoDB and persistent file storage
- **API Integration**: Etherscan API for real-time transaction data

## Key Features

### Transaction Tracking
- Real-time Ethereum transaction monitoring through Etherscan API integration
- Automatic transaction categorization and status tracking
- Historical transaction data persistence and retrieval

### Budget Management
- Customizable budget periods with start and end dates
- Real-time spending tracking against budget limits
- Automated alerts when spending reaches 80% of budget threshold
- Budget analytics and reporting capabilities

### Notification System
- Dual notification channels:
  - In-app notifications for immediate user feedback
  - Email notifications for critical alerts (budget exceeded)
- Real-time budget threshold monitoring

### Data Persistence
- Primary Storage: Persistent file system for immediate data access
- Secondary Storage: MongoDB for robust data backup and querying
- Automatic data synchronization between storage systems

### Security Features
- Environment-based configuration management
- Secure API key storage
- Input validation using Zod schema
- Error handling and logging system

## Technical Implementation

The application implements:
- TypeScript for type-safe development
- Express.js middleware for request handling and logging
- Zod schema validation for data integrity
- Vite development server with HMR support
- MongoDB connection pooling and error handling
- Automated email service integration

This system provides a comprehensive solution for cryptocurrency transaction tracking and budget management, with emphasis on user experience, data reliability, and system scalability.