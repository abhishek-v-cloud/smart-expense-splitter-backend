# Smart Expense Splitter — Backend

This repository contains the backend API for the Smart Expense Splitter application.

**Stack**
- Node.js (>= 18)
- Express
- MongoDB (Mongoose)
- JSON Web Tokens (JWT)
- bcryptjs

**Purpose**
Provides REST APIs for user authentication, group management, expense tracking, and settlement calculation.

**Repository Layout**
- `src/index.js` — App entrypoint
- `src/routes/` — Route definitions (`authRoutes.js`, `groupRoutes.js`, `expenseRoutes.js`, `settlementRoutes.js`)
- `src/controllers/` — Controller logic for endpoints
- `src/models/` — Mongoose models (`User`, `Group`, `Expense`, `Settlement`)
- `src/utils/` — Helper utilities (`expenseSplitter.js`, `settlementCalculator.js`, `reportGenerator.js`)
- `src/middleware/` — `auth.js`, `errorHandler.js`

## Requirements
- Node.js 18+ (or compatible)
- MongoDB (local or remote)

## Environment variables
Create a `.env` file in `backend/` with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-splitter
JWT_SECRET=your_jwt_secret_here
```

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret used to sign JWT tokens

## Install
From the `backend` folder run:

```powershell
npm install
```

## Run
- Development (auto-restarts with `nodemon`):

```powershell
npm run dev
```

- Production (start):

```powershell
npm start
```

The server listens on `PORT` (default `5000`) and connects to `MONGODB_URI`.

## API Summary
All endpoints are prefixed with `/api`.

### Authentication
- `POST /api/auth/register` — Register a new user
  - Body: `{ name, email, password }`
  - Response: `{ token, user }`
- `POST /api/auth/login` — Login
  - Body: `{ email, password }`
  - Response: `{ token, user }`
- `GET /api/auth/me` — Get current user (protected)
  - Header: `Authorization: Bearer <token>`

### Groups
- `POST /api/groups` — Create group (protected)
- `GET /api/groups` — Get user's groups (protected)
- `GET /api/groups/:groupId` — Get group details (protected)
- `POST /api/groups/:groupId/members` — Add member by email (protected)
- `DELETE /api/groups/:groupId/members/:memberId` — Remove member (protected)

### Expenses
- `POST /api/expenses` — Create expense (protected)
  - Body includes `groupId`, `description`, `amount`, `category`, `paidBy`, `participants` (array of user IDs)
  - Splitting is equal by default — `participants` receive equal share amounts
- `GET /api/expenses/group/:groupId` — List group expenses (protected)
- `GET /api/expenses/:expenseId` — Get an expense (protected)
- `PUT /api/expenses/:expenseId` — Update an expense (protected)
- `DELETE /api/expenses/:expenseId` — Delete an expense (protected)

> Creating/updating/deleting expenses triggers automatic settlement recalculation.

### Settlements
- `GET /api/settlements/:groupId/summary` — Group summary (total expenses, pending settlements, unsettled amount)
- `GET /api/settlements/:groupId/report` — Export expense CSV (protected)
- `GET /api/settlements/:groupId` — Get pending settlements (protected)
- `PUT /api/settlements/:settlementId/settle` — Mark settlement as settled (protected)





