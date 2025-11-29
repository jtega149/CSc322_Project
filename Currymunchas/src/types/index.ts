// User Types
export type UserRole = 'visitor' | 'customer' | 'vip' | 'chef' | 'delivery' | 'manager';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  isVIP?: boolean; // Only for customers
}

export interface Customer extends User {
  role: 'customer';
  isVIP: boolean;
  accountBalance: number;
  totalSpent: number;
  orderCount: number;
  warnings: Warning[];
  orderHistory: string[];
  favorites: string[];
  isBlacklisted: boolean;
  freeDeliveriesEarned: number;
  freeDeliveriesUsed: number;
}

export interface Employee extends User {
  salary: number;
  hireDate: Date;
  complaints: string[];
  compliments: string[];
  status: 'active' | 'demoted' | 'fired' | 'inactive';
  demotionCount?: number; // Number of times employee has been demoted
  warnings?: Warning[]; // Warnings for employees
}

export interface Chef extends Employee {
  role: 'chef';
  specialties: string[];
  dishes: string[];
  averageRating: number;
}

export interface DeliveryPerson extends Employee {
  role: 'delivery';
  deliveryCount: number;
  averageRating: number;
  currentLocation?: string;
}

export interface Manager extends Employee {
  role: 'manager';
}

// Menu Types
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  chefId: string;
  category: string;
  isVIPOnly: boolean;
  isAvailable: boolean;
  ratings: Rating[];
  averageRating: number;
  orderCount: number;
  createdAt: Date;
}

export interface Rating {
  id: string;
  userId: string;
  dishId?: string;
  deliveryPersonId?: string;
  foodRating?: number;
  deliveryRating?: number;
  comment?: string;
  createdAt: Date;
}

// Order Types
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryFee: number;
  discount: number;
  finalPrice: number;
  status: OrderStatus;
  chefId?: string;
  deliveryPersonId?: string;
  deliveryBids: DeliveryBid[];
  deliveryInfo?: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    deliveryInstructions?: string;
  };
  tipAmount?: number;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface OrderItem {
  dishId: string;
  quantity: number;
  price: number;
}

export interface DeliveryBid {
  deliveryPersonId: string;
  bidAmount: number;
  timestamp: Date;
}

// Complaint Types
export type ComplaintType = 'complaint' | 'compliment';
export type ComplaintStatus = 'pending' | 'under_review' | 'disputed' | 'resolved_valid' | 'resolved_invalid' | 'dismissed';
export type ComplaintTarget = 'chef' | 'delivery' | 'customer';

export interface Complaint {
  id: string;
  type: ComplaintType;
  reporterId: string;
  targetId: string;
  targetType: ComplaintTarget;
  orderId?: string;
  reason: string;
  status: ComplaintStatus;
  managerNotes?: string;
  isDisputed: boolean;
  disputeReason?: string;
  createdAt: Date;
  resolvedAt?: Date;
  weight: number; // 1 for regular customers, 2 for VIP
}

// Warning Types
export interface Warning {
  id: string;
  userId: string;
  reason: string;
  issuedAt: Date;
  relatedComplaintId?: string;
}

// Discussion Types
export interface DiscussionTopic {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: 'chef' | 'dish' | 'delivery' | 'general';
  relatedId?: string; // chef/dish/delivery person ID
  createdAt: Date;
  posts: DiscussionPost[];
}

export interface DiscussionPost {
  id: string;
  topicId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

// Knowledge Base Types
export interface KnowledgeBaseEntry {
  id: string;
  question: string;
  answer: string;
  authorId: string;
  category: string;
  rating: number;
  ratingCount: number;
  isFlagged: boolean;
  createdAt: Date;
}

// Chat Types
export interface ChatMessage {
  id: string;
  userId?: string;
  message: string;
  response: string;
  source: 'knowledge_base' | 'llm';
  knowledgeBaseEntryId?: string;
  userRating?: number;
  timestamp: Date;
}

// HR Types
export interface HRAction {
  id: string;
  managerId: string;
  targetId: string;
  actionType: 'hire' | 'fire' | 'raise' | 'cut_pay' | 'promote' | 'demote' | 'bonus' | 'delivery_bid_override';
  previousSalary?: number;
  newSalary?: number;
  reason: string;
  memo?: string;
  // For delivery bid overrides
  orderId?: string;
  lowestBidAmount?: number;
  chosenBidAmount?: number;
  timestamp: Date;
}

// Application Types
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationType = 'customer' | 'chef' | 'delivery';

export interface Application {
  id: string;
  name: string;
  email: string;
  type: ApplicationType;
  status: ApplicationStatus;
  specialties?: string[]; // For chef applications
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Manager ID
  rejectionReason?: string;
}

// Finance Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'order' | 'refund' | 'withdrawal';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string;
  description: string;
  timestamp: Date;
}

// Feedback Types
export interface Feedback {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  targetType: 'chef' | 'delivery' | 'customer'; // Added 'customer' for delivery rating customers
  targetId: string;
  targetName: string;
  rating: number; // 1-5 stars
  sentiment: 'compliment' | 'complaint';
  comment: string;
  dishIds?: string[]; // For chef feedback, which dishes they prepared
  createdAt: Date;
  // Dispute fields
  isDisputed?: boolean;
  disputeReason?: string;
  disputedBy?: string; // ID of user who disputed (customer or employee)
  disputeCreatedAt?: Date;
  // Manager decision
  managerDecision?: 'dismissed' | 'upheld';
  managerDecisionReason?: string;
  managerDecisionAt?: Date;
  managerId?: string; // Manager who made the decision
}