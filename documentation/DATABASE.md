# ReMon — Database Schema

## ERD Overview

7 tabel + 6 enum Prisma.

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | String | Display name |
| email | String | Unique, used for login |
| password | String | bcrypt hash |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Category
| Field | Type | Notes |
|---|---|---|
| id | String | PK (name-based for defaults) |
| name | String | e.g. Makanan, Transport |
| type | TransactionType | INCOME or EXPENSE |
| icon | String? | Emoji icon |
| userId | String? | Null = global default |

### Transaction
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| amount | Decimal | |
| description | String | |
| categoryId | String? | FK → Category |
| type | TransactionType | INCOME / EXPENSE |
| date | DateTime | Transaction date |
| receiptImage | String? | File path |
| isSplitBill | Boolean | true if part of split bill |

### SplitBill
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User (creator) |
| transactionId | UUID | FK → Transaction (unique) |
| totalAmount | Decimal | |
| slug | String | Unique — public link ID |
| status | SplitBillStatus | ACTIVE / CLOSED |

### SplitBillParticipant
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| splitBillId | UUID | FK → SplitBill |
| name | String | Participant name |
| amount | Decimal | Individual share |
| status | ParticipantStatus | UNPAID / PAID / DISPUTED |
| paymentProofImage | String? | Uploaded proof |
| paymentVerified | Boolean | AI-verified |
| aiFeedback | String? | DeepSeek response |

### Debt
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| otherPersonName | String | Counterparty name |
| amount | Decimal | |
| description | String | |
| direction | DebtDirection | I_OWE / THEY_OWE |
| status | DebtStatus | UNPAID / PAID |
| dueDate | DateTime? | Optional due date |

### Notification
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| type | NotificationType | Event type |
| title | String | Short title |
| message | String | Body |
| link | String? | Deep link |
| isRead | Boolean | default false |
| createdAt | DateTime | |

## Enums

| Enum | Values |
|---|---|
| TransactionType | INCOME, EXPENSE |
| SplitBillStatus | ACTIVE, CLOSED |
| ParticipantStatus | UNPAID, PAID, DISPUTED |
| DebtDirection | I_OWE, THEY_OWE |
| DebtStatus | UNPAID, PAID |
| NotificationType | SPLIT_PAID, SPLIT_DISPUTED, DEBT_DUE, DEBT_OVERDUE, DEBT_SETTLED |

## Key Relationships

- User → Transaction (1:N)
- User → SplitBill (1:N)
- Transaction → SplitBill (1:1)
- SplitBill → SplitBillParticipant (1:N)
- User → Debt (1:N)
- User → Notification (1:N)
- Category → Transaction (1:N, optional)
