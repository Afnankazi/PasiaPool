# 💰 Settle

<div align="center">
  <img src="public/image.png" alt="Settle Logo" width="120" height="120" style="border-radius: 20px">
  <h3>Splitting expenses made simple</h3>
  <p>Track shared expenses and settle debts effortlessly</p>
  
  <div>
    <img src="https://img.shields.io/badge/Next.js-15.4.1-black?style=for-the-badge&logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Prisma-6.12.0-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
    <img src="https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
  </div>
</div>

---

## 🌟 Overview

Settle is a modern expense-sharing application designed for friends, roommates, travel groups, and anyone who needs to split costs effortlessly. Whether you're organizing a group trip, sharing household expenses, or splitting dinner bills, Settle makes it simple to track who owes what and settle debts transparently.

### ✨ Key Features

- 👥 **Group Management** - Create and manage expense groups for any occasion
- 📱 **Smart Receipt Scanning** - AI-powered OCR extracts expense details automatically
- 🧮 **Flexible Splitting** - Equal splits, percentages, or custom amounts
- 🔒 **Secure & Private** - End-to-end encryption and privacy-first design
- 📱 **Mobile Optimized** - Responsive design that works on all devices
- ⚡ **Instant Settlements** - Clear dashboard shows debts and settlements
- 📧 **Group Invitations** - Email-based invitation system
- 🎨 **Beautiful UI** - Modern design with smooth animations

## 🚀 Tech Stack

### Frontend
- **Next.js 15.4.1** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5.0** - Type-safe JavaScript
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **GSAP 3.13.0** - Professional animation library
- **Radix UI** - Headless UI components
- **Lucide React** - Beautiful SVG icons
- **Next Themes** - Dark/light mode support

### Backend & Database
- **Prisma 6.12.0** - Modern database toolkit
- **PostgreSQL** - Robust relational database
- **NextAuth.js 4.24.7** - Authentication solution
- **Prisma Accelerate** - Database connection pooling

### AI & OCR
- **Google Gemini AI** - Receipt text analysis
- **Tesseract.js** - Client-side OCR processing
- **Node Tesseract OCR** - Server-side OCR fallback

### Email & Communication
- **Nodemailer 6.10.1** - Email delivery
- **React Email** - Email template framework

### Security & Validation
- **bcrypt/bcryptjs** - Password hashing
- **Zod 4.0.5** - Schema validation
- **NextAuth Prisma Adapter** - Secure session management

### Development Tools
- **ESLint 9** - Code linting
- **Prettier** - Code formatting
- **tsx 4.20.3** - TypeScript execution
- **Turbopack** - Fast bundler (development)

### UI Libraries & Components
- **shadcn/ui** - Re-usable component library
- **Class Variance Authority** - Styling utilities
- **clsx & tailwind-merge** - Conditional styling
- **React Fast Marquee** - Marquee animations
- **Recharts** - Chart components
- **Sonner** - Toast notifications

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm/bun
- PostgreSQL database
- Google Gemini API key (for AI features)

### 1. Clone the repository
```bash
git clone https://github.com/Namann-14/settle.git
cd settle
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Setup
Copy the example environment file and configure your settings:
```bash
cp .env.example .env
```

Fill in your environment variables (see [Environment Variables](#environment-variables) section below).

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Database
```env
DATABASE_URL="postgresql://username:password@localhost:5432/settle"
DIRECT_URL="postgresql://username:password@localhost:5432/settle"
```

### Authentication
```env
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Email Configuration
```env
EMAIL_PROVIDER="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Settle <your-email@gmail.com>"

# Alternative SMTP settings
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
```

### AI & OCR
```env
GEMINI_API_KEY="your-gemini-api-key"
```

See our detailed setup guides:
- [📧 Email Configuration Guide](EMAIL_SETUP.md)
- [🤖 Receipt OCR Setup Guide](RECEIPT_OCR_SETUP.md)

## 📱 Features Deep Dive

### 🤖 Smart Receipt Scanning
- **Real OCR Processing**: Uses Tesseract.js for client-side text extraction
- **AI Analysis**: Google Gemini analyzes extracted text for intelligent data extraction
- **Automatic Detection**: Finds total amounts, merchant names, dates, and individual items
- **Privacy-First**: OCR happens in your browser, images aren't stored on servers

### 👥 Group Management
- Create expense groups for any occasion
- Invite members via email with secure tokens
- Role-based permissions (creator vs. member)
- Real-time debt calculations and settlements

### 🧮 Flexible Expense Splitting
- **Equal Split**: Divide expenses evenly among participants
- **Percentage Split**: Custom percentage allocation
- **Unequal Split**: Specific amounts for each person
- **Complex Scenarios**: Handle tips, taxes, and partial participation

### 🔒 Security & Privacy
- Password hashing with bcrypt
- Secure session management with NextAuth.js
- Database-level security with Prisma
- Email verification for invitations
- No sensitive data stored unnecessarily

## 🗄️ Database Schema

Our database uses PostgreSQL with Prisma ORM:

- **Users** - User accounts with authentication
- **Groups** - Expense sharing groups
- **Expenses** - Individual transactions
- **ExpenseSplits** - How expenses are divided
- **Settlements** - Debt clearance records
- **GroupInvitations** - Email-based group invites

## 📡 API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Get current session

### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create new group
- `POST /api/groups/[id]/invites` - Send group invitation
- `GET /api/groups/invites/verify` - Verify invitation token

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Receipts
- `POST /api/receipts/process` - Process receipt image
- `POST /api/receipts/analyze-text` - Analyze extracted text

### Settlements
- `GET /api/settlements` - List settlements
- `POST /api/settlements` - Create settlement

## 🧪 Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Email template development
npm run email

# Test email configuration
npm run test:email

# Database operations
npx prisma studio          # Database GUI
npx prisma generate        # Generate client
npx prisma migrate dev     # Run migrations
npx prisma migrate reset   # Reset database
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Configuration
- Set up PostgreSQL database (e.g., Supabase, PlanetScale)
- Configure email service (Gmail, SendGrid, etc.)
- Set up Google Gemini API for AI features
- Update NEXTAUTH_URL to your domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework for production
- [Prisma](https://prisma.io) - Next-generation ORM for TypeScript
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Radix UI](https://radix-ui.com) - Low-level UI primitives
- [shadcn/ui](https://ui.shadcn.com) - Re-usable components
- [Google Gemini](https://ai.google.dev) - AI-powered text analysis
- [Tesseract.js](https://tesseract.projectnaptha.com) - OCR library

## 📞 Support

- 📧 Email: support@settle.app
- 🐛 Issues: [GitHub Issues](https://github.com/Namann-14/settle/issues)
- 📖 Documentation: [Project Wiki](https://github.com/Namann-14/settle/wiki)

---

<div align="center">
  <p>Made with ❤️</p>
  <p>Splitting expenses made simple</p>
</div>
