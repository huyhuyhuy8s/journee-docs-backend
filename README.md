# Journee Docs Backend

A Node.js backend API for the Journee Docs collaborative document editor, built with Express, TypeScript, Clerk authentication, and Liveblocks for real-time collaboration.

## Features

- **Clerk Authentication**: Secure user authentication and management
- **Liveblocks Integration**: Real-time collaborative document editing
- **Document CRUD**: Create, read, update, and delete documents
- **Collaboration Management**: Invite users, manage permissions, and handle document access
- **TypeScript**: Full type safety and better development experience
- **RESTful API**: Clean and organized API endpoints

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Clerk account and API keys
- Liveblocks account and API keys

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd journee-docs-backend-main
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Liveblocks
LIVEBLOCKS_SECRET_KEY=sk_your_liveblocks_secret_key_here

# Optional: MongoDB for additional data storage
MONGODB_URI=mongodb://localhost:27017/journee-docs

# Optional: Cloudinary for file uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Development

Start the development server:
```bash
npm run dev
```

Build the project:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/api/auth/liveblocks` | Authenticate with Liveblocks |
| GET    | `/api/auth/verify`     | Verify authentication token  |
| GET    | `/api/auth/me`         | Get current user information |

### Documents

| Method | Endpoint                                   | Description                                               |
| ------ | ------------------------------------------ | --------------------------------------------------------- |
| GET    | `/api/documents`                           | Get user's documents (with pagination, search, filtering) |
| POST   | `/api/documents`                           | Create a new document                                     |
| GET    | `/api/documents/:id`                       | Get a specific document                                   |
| PUT    | `/api/documents/:id`                       | Update a document                                         |
| DELETE | `/api/documents/:id`                       | Delete a document                                         |
| POST   | `/api/documents/:id/invite`                | Invite a collaborator to document                         |
| DELETE | `/api/documents/:id/collaborators/:userId` | Remove a collaborator                                     |
| PATCH  | `/api/documents/:id/rename`                | Rename a document                                         |
| GET    | `/api/documents/:id/access`                | Get document access information                           |
| PATCH  | `/api/documents/:id/access`                | Update document access permissions                        |

### Users

| Method | Endpoint            | Description               |
| ------ | ------------------- | ------------------------- |
| GET    | `/api/users/search` | Search for users by query |
| GET    | `/api/users/:id`    | Get user by ID            |

### File Upload

| Method | Endpoint                   | Description                       |
| ------ | -------------------------- | --------------------------------- |
| POST   | `/api/upload/file`         | Upload a file (images, documents) |
| POST   | `/api/upload/image/base64` | Upload a base64 encoded image     |
| DELETE | `/api/upload/:publicId`    | Delete an uploaded file           |

### Notifications

| Method | Endpoint                           | Description                    |
| ------ | ---------------------------------- | ------------------------------ |
| GET    | `/api/notifications`               | Get user's notifications       |
| POST   | `/api/notifications/mark-read/:id` | Mark a notification as read    |
| POST   | `/api/notifications/mark-all-read` | Mark all notifications as read |
| DELETE | `/api/notifications/:id`           | Delete a notification          |

### Activity Tracking

| Method | Endpoint                                   | Description                             |
| ------ | ------------------------------------------ | --------------------------------------- |
| GET    | `/api/activity/documents/:roomId`          | Get document activity and presence data |
| POST   | `/api/activity/documents/:roomId/presence` | Update user presence in document        |
| GET    | `/api/activity/user/activity`              | Get user's recent activity              |

### Admin (Future Enhancement)

| Method | Endpoint                          | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/api/admin/stats`                | Get system statistics                |
| GET    | `/api/admin/users`                | Get all users (admin only)           |
| GET    | `/api/admin/documents`            | Get all documents (admin only)       |
| DELETE | `/api/admin/documents/:roomId`    | Force delete a document (admin only) |
| PATCH  | `/api/admin/users/:userId/status` | Update user status (admin only)      |

### Webhooks

| Method | Endpoint                   | Description                      |
| ------ | -------------------------- | -------------------------------- |
| POST   | `/api/webhooks/liveblocks` | Handle Liveblocks webhook events |
| POST   | `/api/webhooks/clerk`      | Handle Clerk webhook events      |

## Query Parameters

### Get Documents (`GET /api/documents`)

- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of documents per page (default: 10)
- `search` (string): Search query for document titles
- `sortBy` (string): Sort field - "createdAt" or "title" (default: "createdAt")
- `sortOrder` (string): Sort order - "asc" or "desc" (default: "desc")
- `dateFrom` (string): Filter documents created after this date
- `dateTo` (string): Filter documents created before this date

### Search Users (`GET /api/users/search`)

- `q` (string): Search query for user names/emails
- `limit` (number): Maximum number of results (default: 10)

## Request Bodies

### Create Document (`POST /api/documents`)
```json
{
  "title": "My New Document"
}
```

### Update Document (`PUT /api/documents/:id`)
```json
{
  "title": "Updated Document Title",
  "collaborators": ["user1@example.com", "user2@example.com"]
}
```

### Invite Collaborator (`POST /api/documents/:id/invite`)
```json
{
  "email": "collaborator@example.com",
  "permission": "room:write" // or "room:read"
}
```

### Rename Document (`PATCH /api/documents/:id/rename`)
```json
{
  "title": "New Document Name"
}
```

### Update Document Access (`PATCH /api/documents/:id/access`)
```json
{
  "usersAccesses": {
    "user1@example.com": ["room:write"],
    "user2@example.com": ["room:read", "room:presence:write"]
  }
}
```

## Authentication

All API endpoints (except health check) require authentication. Include the Clerk session token in the Authorization header:

```
Authorization: Bearer <clerk-session-token>
```

The backend will verify the token with Clerk and populate the `req.user` object with user information.

## Error Responses

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Success Responses

Successful responses follow this format:

```json
{
  "success": true,
  "data": {...}, // Response data
  "message": "Optional success message"
}
```

## Technology Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety and better development experience
- **Clerk** - Authentication and user management
- **Liveblocks** - Real-time collaboration
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **dotenv** - Environment configuration

## Project Structure

```
src/
├── app.ts                 # Main application file
├── controllers/           # Route handlers
│   ├── auth.controller.ts
│   ├── documents.controller.ts
│   └── users.controller.ts
├── middlewarer/           # Express middleware
│   ├── auth.middleware.ts
│   └── cors.middleware.ts
├── routes/               # API routes
│   ├── auth.routes.ts
│   ├── documents.routes.ts
│   └── users.routes.ts
├── services/             # Business logic
│   ├── clerk.service.ts
│   ├── document.service.ts
│   └── liveblocks.service.ts
└── types/                # TypeScript type definitions
    ├── document.types.ts
    ├── user.types.ts
    └── index.ts
config/
├── database.ts           # Database configuration
└── environment.ts        # Environment configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
