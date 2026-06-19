# LeatureMovies - Node.js MySQL Backend Setup

## Migration from Firebase to Node.js + MySQL

This guide explains how to set up the new Node.js backend with MySQL database.

## Prerequisites

1. **Node.js** (v14+)
2. **MySQL Server** (v5.7+ or MySQL 8.0)
3. **npm** (comes with Node.js)

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs both frontend (React/Vite) and backend (Express) dependencies.

### 2. MySQL Database Setup

#### Option A: Using MySQL Command Line

```bash
# Open MySQL
mysql -u root -p

# Run the SQL from database schema file
source server/config/database.sql

# Create a user (optional but recommended)
CREATE USER 'leature'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON leature_movies.* TO 'leature'@'localhost';
FLUSH PRIVILEGES;
```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `server/config/database.sql`
4. Execute

### 3. Configure Environment Variables

Edit `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=           # Leave blank if no password, or enter your MySQL password
DB_NAME=leature_movies

# Authentication
JWT_SECRET=your-very-secret-key-change-this

# Server
PORT=5000
NODE_ENV=development
```

## Running the Application

### Development Mode (Frontend + Backend)

```bash
npm run dev
```

This runs both:

- **Frontend**: React app on `http://localhost:3000`
- **Backend**: Express server on `http://localhost:5000`

### Production Mode

```bash
# Build frontend
npm run build

# Start only backend
npm run server:start
```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile (requires token)

### Movies

- `GET /movies` - Get all movies
- `GET /movies/:id` - Get movie by ID
- `POST /movies` - Create movie (admin only)
- `PUT /movies/:id` - Update movie (admin only)
- `DELETE /movies/:id` - Delete movie (admin only)

### Theatres

- `GET /theatres` - Get all theatres
- `GET /theatres/:id` - Get theatre by ID
- `POST /theatres` - Create theatre (admin only)
- `PUT /theatres/:id` - Update theatre (admin only)
- `DELETE /theatres/:id` - Delete theatre (admin only)

### Shows

- `GET /shows` - Get all shows
- `GET /shows/:id` - Get show by ID
- `POST /shows` - Create show (admin only)
- `POST /shows/:id/book-seats` - Book seats (authenticated users)
- `PUT /shows/:id` - Update show (admin only)
- `DELETE /shows/:id` - Delete show (admin only)

### Bookings

- `GET /bookings` - Get all bookings (admin only)
- `GET /bookings/my-bookings` - Get user's bookings
- `GET /bookings/:id` - Get booking by ID
- `POST /bookings` - Create booking (authenticated users)
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Delete booking (admin only)

## Database Schema

### Users

- `id` (UUID) - Primary key
- `fullName` - User's full name
- `email` - User's email (unique)
- `mobileNumber` - User's phone number
- `password` - Hashed password (bcryptjs)
- `role` - 'user' or 'admin'
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Movies, Theatres, Shows, Bookings

See `server/config/database.sql` for full schema

## Troubleshooting

### MySQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

- Ensure MySQL server is running
- Check credentials in `.env` file
- Verify database exists: `SHOW DATABASES;`

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

- Change `PORT` in `.env` file
- Or kill existing process on port 5000

### npm install Slow

```bash
npm cache clean --force
npm install
```

## Deployment

For production deployment:

1. Use a production-grade database (AWS RDS, DigitalOcean MySQL, etc.)
2. Set `NODE_ENV=production`
3. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "leature-api"
   ```
4. Use a reverse proxy like Nginx
5. Set up SSL/HTTPS certificates

## Security Notes

- Change `JWT_SECRET` in `.env` to a strong, unique value
- Never commit `.env` to version control
- Use environment variables for all sensitive data
- Hash passwords with bcryptjs (already implemented)
- Validate all user inputs
- Use HTTPS in production

## Removed Firebase Dependencies

The following Firebase packages are no longer needed and can be removed:

```json
"firebase": "^12.14.0"
```

To remove: `npm uninstall firebase`

## Project Structure

```
LeatureMovies/
├── server/                    # Node.js/Express backend
│   ├── config/
│   │   ├── database.js       # MongoDB connection (Mongoose)
│   ├── controllers/          # API logic
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   └── index.js             # Express server
├── src/                      # React frontend
│   ├── services/
│   │   └── api.ts          # API client service
│   ├── components/         # React components
│   └── ...
├── package.json
├── .env                    # Environment variables
└── ...
```

## Support

For issues or questions about the Node.js backend migration, check the API response format and error messages for debugging.
