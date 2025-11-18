# Component Guide

Complete overview of all components in the AI Restaurant application.

## 📁 Component Organization

```
components/
├── auth/              # Authentication & registration
├── chat/              # AI chatbot
├── complaints/        # Complaint/compliment system
├── customer/          # Customer-specific views
├── discussions/       # Community forum
├── employee/          # Employee dashboards
├── finance/           # Financial operations
├── layout/            # App structure
├── menu/              # Food browsing
├── orders/            # Shopping & ordering
├── rating/            # Rating system
└── visitor/           # Public views
```

## 🔐 Auth Components

### `LoginForm.tsx`
**Purpose**: User login interface  
**Props**: None  
**Features**:
- Email/password authentication
- Demo account list for testing
- Error handling
- Integration with AuthContext

**Usage**:
```tsx
import { LoginForm } from './components/auth/LoginForm';

<LoginForm />
```

---

### `RegistrationForm.tsx`
**Purpose**: New customer registration  
**Props**: None  
**Features**:
- Customer application submission
- Password validation
- Manager approval workflow
- Success/error feedback

**Usage**:
```tsx
import { RegistrationForm } from './components/auth/RegistrationForm';

<RegistrationForm />
```

---

## 💬 Chat Components

### `AIChat.tsx`
**Purpose**: AI-powered customer service chatbot  
**Props**:
- `userId?: string` - Current user ID (optional)

**Features**:
- Knowledge base search
- LLM fallback for unknown questions
- Rating system for KB answers
- Flagging inappropriate content
- Source indication (KB vs LLM)

**Usage**:
```tsx
import { AIChat } from './components/chat/AIChat';

<AIChat userId={currentUser.id} />
```

---

## 📢 Complaint Components

### `ComplaintForm.tsx`
**Purpose**: File complaints or compliments  
**Props**:
- `open: boolean` - Dialog visibility
- `onClose: () => void` - Close handler
- `onSubmit: (type, targetId, targetType, reason) => void` - Submit handler
- `targetId: string` - Target user ID
- `targetType: 'chef' | 'delivery' | 'customer'` - Target type
- `targetName: string` - Target display name

**Features**:
- Complaint/compliment toggle
- Detailed reasoning
- Warning about dispute process
- Manager review workflow

**Usage**:
```tsx
import { ComplaintForm } from './components/complaints/ComplaintForm';

<ComplaintForm
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
  targetId="chef1"
  targetType="chef"
  targetName="Marco Chen"
/>
```

---

## 👤 Customer Components

### `CustomerDashboard.tsx`
**Purpose**: Main customer interface  
**Props**:
- `customer: Customer` - Customer data

**Features**:
- VIP status display and progress
- Warning alerts
- Account balance
- Order statistics
- Menu browsing
- Order history
- Discussion forum access
- AI chat integration

**Tabs**:
1. Browse Menu - Full menu with cart
2. My Orders - Order history and tracking
3. Discussions - Community forum
4. AI Assistant - Chatbot

**Usage**:
```tsx
import { CustomerDashboard } from './components/customer/CustomerDashboard';

<CustomerDashboard customer={customerData} />
```

---

## 💬 Discussion Components

### `DiscussionForum.tsx`
**Purpose**: Community discussion board  
**Props**:
- `topics: DiscussionTopic[]` - Discussion topics
- `currentUserId: string` - Current user
- `onCreateTopic: () => void` - Create handler
- `onViewTopic: (topicId) => void` - View handler

**Features**:
- Category filtering (chef, dish, delivery, general)
- Topic preview
- Reply count
- Emoji category icons
- Create new topics

**Usage**:
```tsx
import { DiscussionForum } from './components/discussions/DiscussionForum';

<DiscussionForum
  topics={allTopics}
  currentUserId={user.id}
  onCreateTopic={handleCreate}
  onViewTopic={handleView}
/>
```

---

## 👔 Employee Components

### `ChefDashboard.tsx`
**Purpose**: Chef's work interface  
**Props**:
- `chef: Chef` - Chef data

**Features**:
- Performance metrics (rating, salary, feedback)
- Dish management
- Create new dishes
- Customer feedback view
- Warning alerts
- Performance status

**Tabs**:
1. My Dishes - Created dish list
2. Create New Dish - Dish creation form
3. Feedback - Customer ratings and comments

**Usage**:
```tsx
import { ChefDashboard } from './components/employee/ChefDashboard';

<ChefDashboard chef={chefData} />
```

---

### `DeliveryDashboard.tsx`
**Purpose**: Delivery personnel interface  
**Props**:
- `deliveryPerson: DeliveryPerson` - Delivery person data

**Features**:
- Performance tracking
- Order bidding system
- Active delivery tracking
- Location updates
- Customer feedback
- Delivery history

**Tabs**:
1. Available Orders - Bid on orders
2. Active Deliveries - Current deliveries
3. Delivery History - Past deliveries
4. Feedback - Customer ratings

**Usage**:
```tsx
import { DeliveryDashboard } from './components/employee/DeliveryDashboard';

<DeliveryDashboard deliveryPerson={deliveryData} />
```

---

### `ManagerDashboard.tsx`
**Purpose**: Restaurant manager control panel  
**Props**:
- `manager: Manager` - Manager data

**Features**:
- Employee management (hire/fire/salary)
- Customer management (warnings/blacklist)
- Complaint resolution
- Registration approval
- Knowledge base moderation
- System overview

**Tabs**:
1. Employees - Chef and delivery management
2. Customers - Customer accounts
3. Complaints - Complaint resolution
4. Registrations - Approve new customers
5. Knowledge Base - Moderate KB entries

**Usage**:
```tsx
import { ManagerDashboard } from './components/employee/ManagerDashboard';

<ManagerDashboard manager={managerData} />
```

---

## 💰 Finance Components

### `DepositDialog.tsx`
**Purpose**: Add funds to account  
**Props**:
- `open: boolean` - Dialog visibility
- `onClose: () => void` - Close handler
- `onDeposit: (amount) => void` - Deposit handler
- `currentBalance: number` - Current balance

**Features**:
- Custom amount input
- Quick select amounts ($25, $50, $100, $200)
- Balance display
- Maximum limit ($1000)
- Validation

**Usage**:
```tsx
import { DepositDialog } from './components/finance/DepositDialog';

<DepositDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onDeposit={handleDeposit}
  currentBalance={customer.accountBalance}
/>
```

---

## 🏗️ Layout Components

### `Header.tsx`
**Purpose**: Application header with navigation  
**Props**: None (uses AuthContext)

**Features**:
- Restaurant branding
- User information display
- Role badge
- VIP crown icon
- Logout button
- Sticky positioning

**Usage**:
```tsx
import { Header } from './components/layout/Header';

<Header />
```

---

## 🍽️ Menu Components

### `DishCard.tsx`
**Purpose**: Display individual dish  
**Props**:
- `dish: Dish` - Dish data
- `isVIP?: boolean` - VIP status
- `onAddToCart?: (dish) => void` - Add to cart handler
- `showChef?: boolean` - Show chef info

**Features**:
- Dish image
- Name, description, price
- Rating and order count
- Category badge
- VIP-only indicator
- Availability status
- Add to cart button

**Usage**:
```tsx
import { DishCard } from './components/menu/DishCard';

<DishCard 
  dish={dishData}
  isVIP={true}
  onAddToCart={handleAddToCart}
/>
```

---

### `MenuGrid.tsx`
**Purpose**: Grid layout for browsing dishes  
**Props**:
- `dishes: Dish[]` - All dishes
- `isVIP?: boolean` - VIP status
- `onAddToCart?: (dish) => void` - Add to cart handler

**Features**:
- Search functionality
- Category filtering
- Sorting (popular, rating, price)
- Responsive grid layout
- VIP dish filtering
- Empty state

**Usage**:
```tsx
import { MenuGrid } from './components/menu/MenuGrid';

<MenuGrid 
  dishes={allDishes}
  isVIP={customer.role === 'vip'}
  onAddToCart={handleAdd}
/>
```

---

## 🛒 Order Components

### `ShoppingCart.tsx`
**Purpose**: Shopping cart and checkout  
**Props**:
- `customer: Customer` - Customer data
- `onCheckout: (items, total) => void` - Checkout handler

**Features**:
- Item list with quantities
- Quantity adjustment
- Item removal
- VIP discount calculation
- Free delivery option
- Balance checking
- Order total calculation
- Insufficient balance warning

**Usage**:
```tsx
import { ShoppingCart } from './components/orders/ShoppingCart';

<ShoppingCart 
  customer={customerData}
  onCheckout={handleCheckout}
/>
```

---

## ⭐ Rating Components

### `RatingDialog.tsx`
**Purpose**: Rate completed orders  
**Props**:
- `open: boolean` - Dialog visibility
- `onClose: () => void` - Close handler
- `onSubmit: (foodRating, deliveryRating, comment) => void` - Submit handler
- `dishName: string` - Dish name

**Features**:
- Separate food rating (1-5 stars)
- Separate delivery rating (1-5 stars)
- Optional comment
- Star hover effects
- Validation

**Usage**:
```tsx
import { RatingDialog } from './components/rating/RatingDialog';

<RatingDialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
  dishName="Truffle Carbonara"
/>
```

---

## 🌐 Visitor Components

### `VisitorView.tsx`
**Purpose**: Public landing page  
**Props**: None

**Features**:
- Welcome hero section
- Popular dishes showcase
- Top rated chefs
- Full menu browsing (read-only)
- AI chat access
- Login/registration forms
- Responsive layout

**Tabs**:
1. Browse Menu - View all dishes
2. AI Assistant - Ask questions
3. Register - Login or sign up

**Usage**:
```tsx
import { VisitorView } from './components/visitor/VisitorView';

<VisitorView />
```

---

## 🎨 Styling Guidelines

All components use:
- **Tailwind CSS** for styling
- **shadcn/ui** for base components
- **Lucide React** for icons
- Consistent spacing and typography from `globals.css`

### Common Patterns

**Card Layout**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

**Dialog Pattern**:
```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit}>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🔧 Component Development Tips

### When Creating New Components

1. **Use TypeScript** - Always define prop interfaces
2. **Import from shadcn/ui** - Don't recreate UI components
3. **Follow naming** - Use PascalCase for components
4. **Keep focused** - One responsibility per component
5. **Handle loading states** - Show spinners/skeletons
6. **Handle errors** - Display user-friendly messages
7. **Be accessible** - Use semantic HTML and ARIA labels

### Example Component Template

```tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface MyComponentProps {
  data: any;
  onAction: (id: string) => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction(data.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClick} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Action'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 📚 Related Documentation

- **README.md** - Project overview and setup
- **FIREBASE_INTEGRATION.md** - Backend integration guide
- **API_EXAMPLES.md** - Firebase operation examples
- **types/index.ts** - TypeScript type definitions

---

## 🚀 Next Steps

When adding new features:
1. Create component in appropriate directory
2. Define TypeScript interfaces
3. Import required shadcn/ui components
4. Add to parent component
5. Test with mock data
6. Document in this guide
7. Integrate with Firebase
