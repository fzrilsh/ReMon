# ReMon 💰

> **Record Your Money, Settle Your Debts.**

A web-based personal finance management application with AI-powered receipt parsing, split bill management, and debt tracking. Built with Express.js, PostgreSQL, and DeepSeek AI.

## Screenshots

![ReMon Dashboard](assets/screenshot.png)

*Dashboard view showing financial overview, transaction categories, and recent activity*

## Features

### 📊 Financial Dashboard
- Monthly income and expense overview
- Interactive charts with trend visualization
- Recent transaction history
- Category-based spending analysis

### 📝 Smart Transaction Recording
- Manual transaction entry with custom categories
- AI-powered receipt parsing using OCR and LLM
- Automatic extraction of store name, items, amount, and date
- Receipt image storage for record keeping

### 🤝 Split Bill Management
- Create split bills from existing transactions
- Generate public shareable links for payment collection
- Track participant payment status (unpaid/paid/disputed)
- AI verification of payment proof images
- Automatic amount validation

### 💸 Debt Tracking
- Track money you owe and money others owe you
- Set due dates with overdue notifications
- Settlement tracking with history
- Search and filter by status

### 🔔 Smart Notifications
- Payment received alerts
- Dispute notifications
- Debt due and overdue reminders
- Receipt processing status

### 📱 Progressive Web App
- Installable on mobile and desktop
- Offline support with service worker
- Web Share Target API integration
- Native sharing for receipt uploads

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Express.js 4.x |
| **View Engine** | EJS with Tailwind CSS (CDN) |
| **Database** | PostgreSQL 14+ |
| **ORM** | Prisma 6.x |
| **Authentication** | Session-based (express-session + bcryptjs) |
| **AI Service** | DeepSeek V4 Flash API |
| **OCR** | Tesseract.js 5.x |
| **File Upload** | Multer |
| **Charts** | Chart.js |
| **Icons** | Font Awesome 6 |

## Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **DeepSeek API Key** (or compatible OpenAI-format API)
- **npm** or **yarn**

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/fzrilsh/ReMon.git
cd ReMon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Database setup

**Option A: Docker (recommended for development)**

```bash
docker run --name remon-postgres \
  -e POSTGRES_USER=remon_user \
  -e POSTGRES_PASSWORD=remon_dev_pass \
  -e POSTGRES_DB=remon_dev \
  -p 5432:5432 \
  -d postgres:14
```

**Option B: Local PostgreSQL**

Create a database manually and note the connection string.

### 4. Environment configuration

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SESSION_SECRET` | Session signing key (generate with `openssl rand -hex 32`) | Random 64-char hex string |
| `AI_API_KEY` | DeepSeek or OpenAI-compatible API key | `sk-...` |
| `AI_BASE_URL` | AI API endpoint | `https://api.deepseek.com` |
| `AI_MODEL` | AI model identifier | `deepseek-chat` |
| `APP_BASE_PATH` | Base URL path (use `/` for root, `/ReMon` for subdirectory) | `/` |
| `UPLOAD_DIR` | Upload directory relative to project root | `public/uploads` |

### 5. Database migration and seeding

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed default categories
npm run db:seed
```

### 6. Start the application

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The application will be available at `http://localhost:3000` (or your configured `APP_BASE_PATH`).

## Project Structure

```
ReMon/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Default categories seeder
├── public/
│   ├── css/                   # Custom styles
│   ├── js/                    # Client-side JavaScript
│   ├── icons/                 # PWA icons
│   └── uploads/               # User-uploaded files
├── src/
│   ├── app.js                 # Express app configuration
│   ├── index.js               # Application entry point
│   ├── config/
│   │   └── env.js             # Environment variable loader
│   ├── controllers/           # Request handlers
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── upload.js          # Multer configuration
│   │   ├── errorHandler.js   # Global error handler
│   │   └── basePath.js        # Base path injector
│   ├── repositories/          # Database access layer (Prisma)
│   ├── routes/                # Route definitions
│   ├── services/              # Business logic and AI integration
│   ├── validators/            # Zod validation schemas
│   └── views/                 # EJS templates
│       ├── auth/
│       ├── dashboard/
│       ├── transactions/
│       ├── split-bill/
│       ├── debts/
│       ├── public/
│       └── partials/
└── documentation/
    ├── ARCHITECTURE.md        # System architecture overview
    ├── API.md                 # API endpoint documentation
    └── DATABASE.md            # Database schema documentation
```

## Architecture

ReMon follows a **4-layer architecture pattern**:

```
Route → Controller → Service → Repository → Database
```

- **Routes**: HTTP method bindings and middleware attachment
- **Controllers**: Request parsing, input validation, response rendering
- **Services**: Business logic, AI integration, cross-cutting concerns
- **Repositories**: Database queries via Prisma ORM

See [ARCHITECTURE.md](documentation/ARCHITECTURE.md) for detailed information.

## API Documentation

API endpoints are documented in [API.md](documentation/API.md).

**Base routes:**
- `/auth` - Authentication (register, login, logout)
- `/dashboard` - Financial overview
- `/transactions` - Transaction CRUD and receipt parsing
- `/split-bills` - Split bill management
- `/split/:slug` - Public payment page (no auth required)
- `/debts` - Debt tracking
- `/notifications` - Notification center
- `/settings` - User settings and bank info

## Development

### Database management

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Push schema changes to database
npm run db:push

# Regenerate Prisma client after schema changes
npm run db:generate
```

### Testing AI features

The AI service requires a valid API key. For testing:

1. Get a DeepSeek API key at [platform.deepseek.com](https://platform.deepseek.com)
2. Add to `.env` as `AI_API_KEY`
3. Test receipt parsing at `/transactions/receipt`
4. Test payment verification via split bill payment flow

### File uploads

Uploaded files are stored in `public/uploads/` by default. Ensure this directory is writable:

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

## Deployment

### cPanel / Shared Hosting

1. Set `APP_BASE_PATH=/ReMon` (or your subdirectory)
2. Update `DATABASE_URL` with production credentials
3. Set `NODE_ENV=production`
4. Run `npm install --production`
5. Start with `npm start`

### Docker (coming soon)

Docker support is planned for future releases.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Author

**Fazril Syaveral Hillaby**

- GitHub: [@fzrilsh](https://github.com/fzrilsh)

## Acknowledgments

- [DeepSeek AI](https://www.deepseek.com/) for AI-powered receipt parsing
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities
- [Prisma](https://www.prisma.io/) for the excellent ORM
