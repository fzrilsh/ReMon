# ReMon — API Reference

## Base URL

Development: `http://localhost:3000/ReMon`
Production: `https://fazrilsh.com/ReMon`

## Auth

### Register
- **POST** `/auth/register`
- Body: `name`, `email`, `password`
- Response: 302 redirect to `/dashboard` (sets session cookie)
- Error: 400 with form errors

### Login
- **POST** `/auth/login`
- Body: `email`, `password`
- Response: 302 redirect to `/dashboard`
- Error: 401 with error message

### Logout
- **POST** `/auth/logout`
- Response: 302 redirect to `/login`

## Dashboard

### Index
- **GET** `/dashboard`
- Auth: Required
- Response: Dashboard page with stats, chart, recent transactions

## Transactions

### List
- **GET** `/transactions`
- Auth: Required
- Query: `type`, `month`, `year` (future)
- Response: Transactions list page

### Create
- **GET** `/transactions/create`
- Auth: Required
- Response: Create form

### Store
- **POST** `/transactions`
- Auth: Required
- Body: `type`, `amount`, `description`, `categoryId`, `date`
- Response: 302 redirect to `/transactions`

### Edit
- **GET** `/transactions/:id/edit`
- Auth: Required
- Response: Edit form with existing data

### Update
- **PUT** `/transactions/:id` (via `_method=PUT`)
- Auth: Required
- Body: same as store
- Response: 302 redirect

### Delete
- **DELETE** `/transactions/:id` (via `_method=DELETE`)
- Auth: Required
- Response: 302 redirect

### Receipt Upload
- **GET** `/transactions/receipt`
- Auth: Required
- Response: Upload form

### Receipt Parse (AI)
- **POST** `/transactions/receipt/parse`
- Auth: Required
- Body: multipart `receipt` (image)
- Response: Redirect to create form with pre-filled data

## Split Bill

### List
- **GET** `/split-bills`
- Auth: Required

### Create
- **GET** `/split-bills/create`
- Auth: Required

### Store
- **POST** `/split-bills`
- Auth: Required
- Body: `transactionId`, `participants` (newline-separated names)
- Response: 302 redirect to detail page

### Detail
- **GET** `/split-bills/:id`
- Auth: Required

### Close
- **PATCH** `/split-bills/:id/close`
- Auth: Required (creator only)

### Public Pay Page
- **GET** `/split/:slug`
- No auth required

### Submit Payment
- **POST** `/split/:slug/pay`
- No auth required
- Body: multipart `name`, `proof` (image)
- Response: Success/error page (AI verification)

## Debts

### List
- **GET** `/debts`
- Auth: Required

### Create
- **GET** `/debts/create`
- Auth: Required

### Store
- **POST** `/debts`
- Auth: Required
- Body: `direction`, `otherPersonName`, `amount`, `description`, `dueDate`
- Response: 302 redirect

### Settle
- **PATCH** `/debts/:id/settle`
- Auth: Required
- Response: 302 redirect

### Delete
- **DELETE** `/debts/:id`
- Auth: Required

## Notifications

### Unread
- **GET** `/notifications/unread`
- Auth: Required
- Response: JSON array of unread notifications

### Mark Read
- **PATCH** `/notifications/:id/read`
- Auth: Required
- Response: `{ ok: true }`

### Mark All Read
- **PATCH** `/notifications/read-all`
- Auth: Required
- Response: `{ ok: true }`

## AI Service

### Parse Receipt
- Internal call via `aiService.parseReceipt(imagePath)`
- Sends base64 image to DeepSeek V4 Flash
- Returns: `{ store_name, date, items, total_amount, payment_method }`

### Verify Payment Proof
- Internal call via `aiService.verifyPaymentProof(imagePath, expectedAmount)`
- Sends base64 image to DeepSeek V4 Flash
- Returns: `{ valid, detectedAmount, reason }`

## PWA

### Manifest
- **GET** `/manifest.json`
- Response: Web App Manifest JSON

### Service Worker
- **GET** `/sw.js`
- Response: Service Worker JavaScript

### Offline Page
- **GET** `/offline` (served by SW)
- Response: Offline fallback HTML
