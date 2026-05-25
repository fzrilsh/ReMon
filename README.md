# ReMon 💰

> **Re:Mon — Record Your Money, Settle Your Debts.**

Pencatat keuangan pribadi berbasis web. Catat pengeluaran, upload struk (AI-parsed), split bill dengan public link, dan tracking hutang piutang.

## Fitur

- **📊 Dashboard** — ringkasan keuangan bulanan + transaksi terbaru
- **📝 Catat Transaksi** — manual via form atau upload foto struk (AI otomatis ekstrak)
- **🤝 Split Bill** — bagi pengeluaran dengan teman, generate public link, verifikasi bukti bayar pakai AI
- **💸 Tracking Hutang** — catat siapa hutang siapa, tagar otomatis
- **📱 PWA Ready** — bisa di-install ke home screen HP/desktop

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Express.js |
| Templating | EJS |
| Database | PostgreSQL |
| ORM | Prisma |
| AI | DeepSeek V4 Flash API |
| Auth | Session + bcrypt |

## Instalasi

```bash
# Clone
git clone https://github.com/fzrilsh/ReMon.git
cd ReMon

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env — isi DATABASE_URL, SESSION_SECRET, DEEPSEEK_API_KEY

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Jalankan
npm run dev
```

## Struktur Project

```
ReMon/
├── prisma/           # Schema & migrations
├── public/           # Static files (CSS, JS, icons, uploads)
├── src/
│   ├── config/       # Environment config
│   ├── controllers/  # Request handlers
│   ├── middleware/    # Auth, upload, error handler
│   ├── repositories/ # Data access layer (Prisma queries)
│   ├── routes/       # Route definitions
│   ├── services/     # Business logic
│   ├── validators/   # Zod schemas
│   └── views/        # EJS templates
└── documentation/    # Architecture & API docs
```

## Lisensi

MIT
