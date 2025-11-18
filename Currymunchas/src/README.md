# AI Restaurant - Smart Ordering & Delivery System

A comprehensive web application for restaurant ordering and delivery with AI-powered customer service, built with React and TypeScript.

## 🎯 Project Overview

This is a feature-rich restaurant management system with three main user groups:
- **Visitors**: Browse menu, use AI chat, apply for registration
- **Customers**: Order food, rate dishes, participate in discussions (Regular & VIP tiers)
- **Employees**: Chefs, delivery personnel, and manager with distinct dashboards

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons

### Planned Backend (Firebase)
- **Firebase Authentication** - User login/registration
- **Firebase Firestore** - Database for all entities
- **Firebase Storage** - Dish images and assets
- **Firebase Functions** - LLM integration, business logic

## 📁 Project Structure

```
/
├── components/
│   ├── auth/                 # Login, registration components
│   ├── chat/                 # AI chatbot interface
│   ├── complaints/           # Complaint/compliment system
│   ├── customer/             # Customer dashboard
│   ├── discussions/          # Discussion forum
│   ├── employee/             # Chef, delivery, manager dashboards
│   ├── finance/              # Payment, deposit dialogs
│   ├── layout/               # Header, footer, navigation
│   ├── menu/                 # Dish cards, menu grid
│   ├── orders/               # Shopping cart, order management
│   ├── rating/               # Rating dialogs
│   └── visitor/              # Visitor landing page
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── hooks/
│   └── useAuth.ts            # Auth hook (ready for Firebase)
├── lib/
│   ├── mockData.ts           # Mock data for development
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript type definitions
└── App.tsx                   # Main application component
```

## 🚀 Key Features

### 1. User Management
- **Visitor Mode**: Browse menu, AI chat, registration application
- **Customer Tiers**: 
  - Regular customers
  - VIP (after $100 spent or 3 orders) - 5% discount, free deliveries
- **Warning System**: Track user violations
- **Blacklist**: Prevent re-registration of banned users

### 2. Menu & Ordering
- Browse dishes with images, ratings, prices
- Advanced filtering (category, search, sort)
- Shopping cart with VIP discounts
- Account balance checking
- VIP-only exclusive dishes

### 3. AI Customer Service
- Knowledge base search (local)
- LLM fallback for unanswered questions
- Rating system for knowledge base answers
- Flag inappropriate content for manager review

### 4. Reputation Management
- File complaints/compliments on chefs, delivery, customers
- Dispute resolution by manager
- Weight system (VIP complaints count 2x)
- Automatic warnings for false complaints

### 5. Rating System
- Separate ratings for food quality (1-5 stars)
- Separate ratings for delivery service (1-5 stars)
- Comments and reviews
- Aggregate ratings displayed on dishes

### 6. Discussion Forum
- Topic categories: chefs, dishes, delivery, general
- Thread-based discussions
- Community engagement

### 7. Employee Management (Manager)
- Hire/fire employees
- Salary adjustments (raise/cut/bonus)
- Performance tracking
- Complaint resolution
- Registration approval
- Knowledge base moderation

### 8. Chef Dashboard
- Create and manage dishes
- View performance metrics
- Track ratings and feedback
- Demotion/termination warnings

### 9. Delivery Dashboard
- Bid on delivery orders
- Track active deliveries
- Performance metrics
- Customer feedback

### 10. Finance Management
- Account balance system
- Deposit funds
- Order payment processing
- Automatic warnings for insufficient funds
- Transaction history

## 🔐 Firebase Integration Guide

### Setting Up Firebase

1. **Create Firebase Project**
   ```bash
   npm install firebase
   ```

2. **Initialize Firebase** (`lib/firebase.ts`)
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getStorage } from 'firebase/storage';

   const firebaseConfig = {
     // Your config here
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const storage = getStorage(app);
   ```

3. **Update useAuth Hook**
   - Replace mock authentication with Firebase Auth
   - Use `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`
   - Store user data in Firestore

4. **Database Structure** (Firestore Collections)
   ```
   users/              # All users (customers, employees)
   dishes/             # Menu items
   orders/             # Order records
   complaints/         # Complaints/compliments
   discussions/        # Forum topics
   knowledge_base/     # KB entries
   transactions/       # Financial transactions
   warnings/           # User warnings
   ```

5. **Security Rules**
   - Customers can only read/write their own data
   - Employees can read relevant data based on role
   - Managers have elevated permissions

### LLM Integration

**Option 1: Hugging Face API**
```typescript
const response = await fetch(
  'https://api-inference.huggingface.co/models/...',
  {
    headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
    method: 'POST',
    body: JSON.stringify({ inputs: question })
  }
);
```

**Option 2: Ollama (Local)**
```typescript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama2',
    prompt: question
  })
});
```

## 📝 Business Rules Implementation

### VIP Qualification
- Total spent ≥ $100 OR
- Order count ≥ 3 AND
- No outstanding warnings

### Warning System
- Regular customers: 3 warnings = deregistration
- VIP customers: 2 warnings = downgrade to regular (warnings cleared)
- False complaints result in warning to reporter

### Employee Performance
- Chef/Delivery with rating < 2.0 = demotion (salary cut)
- 2 demotions = termination
- 3 complaints = demotion
- 3 compliments = bonus
- 1 compliment cancels 1 complaint

### Order Processing
1. Check account balance
2. Apply VIP discount if applicable
3. Handle free delivery (VIP: 1 free per 3 orders)
4. Delivery personnel bid on order
5. Manager assigns delivery (usually lowest bid)

## 🎨 Creative Features to Implement

1. **Image-Based Food Search**
   - Upload photo to find similar dishes
   - Use YOLO/DINO for object detection

2. **Voice Interface**
   - Voice ordering
   - Voice-based AI assistant

3. **Route Optimization**
   - Efficient delivery route planning
   - Real-time tracking

4. **Dietary Preferences**
   - AI-powered menu recommendations
   - Allergen detection

## 🧪 Testing Accounts

The app includes demo accounts:
- **Manager**: `manager@restaurant.com`
- **Chef**: `chef1@restaurant.com` or `chef2@restaurant.com`
- **Delivery**: `delivery1@restaurant.com` or `delivery2@restaurant.com`
- **VIP Customer**: `john@example.com`
- **Regular Customer**: `sarah@example.com`

Password can be anything (mock auth).

## 🔄 Next Steps for Development

1. **Firebase Setup**
   - [ ] Create Firebase project
   - [ ] Set up authentication
   - [ ] Design Firestore schema
   - [ ] Implement security rules

2. **LLM Integration**
   - [ ] Choose LLM provider (Hugging Face/Ollama)
   - [ ] Set up API calls
   - [ ] Implement knowledge base search
   - [ ] Add rating system

3. **Real-time Features**
   - [ ] Order status updates
   - [ ] Delivery tracking
   - [ ] Live chat notifications

4. **Payment Integration**
   - [ ] Choose payment provider
   - [ ] Implement deposit system
   - [ ] Add transaction history

5. **Image Upload**
   - [ ] Firebase Storage setup
   - [ ] Image upload for dishes
   - [ ] Avatar uploads

6. **Creative Feature**
   - [ ] Implement chosen creative feature
   - [ ] Test and refine

## 📄 License

This is a student project for educational purposes.
