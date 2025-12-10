import { 
  Chef, 
  DeliveryPerson, 
  Manager, 
  Customer, 
  Dish, 
  Order, 
  DiscussionTopic,
  KnowledgeBaseEntry 
} from '../types';

// Mock Employees
export const mockChefs: Chef[] = [
  {
    id: 'chef1',
    email: 'chef1@restaurant.com',
    role: 'chef',
    name: 'Marco Chen',
    createdAt: new Date('2024-01-01'),
    salary: 65000,
    hireDate: new Date('2024-01-01'),
    complaints: [],
    compliments: ['comp1', 'comp2'],
    status: 'active',
    specialties: ['Italian', 'Pasta'],
    dishes: ['dish1', 'dish2', 'dish3', 'dish7', 'dish8', 'dish12', 'dish15', 'dish16'],
    averageRating: 4.7
  }, 
  {
    id: 'chef2',
    email: 'chef2@restaurant.com',
    role: 'chef',
    name: 'Sofia Rodriguez',
    createdAt: new Date('2024-01-15'),
    salary: 62000,
    hireDate: new Date('2024-01-15'),
    complaints: [],
    compliments: ['comp3'],
    status: 'active',
    specialties: ['Asian Fusion', 'Sushi'],
    dishes: ['dish4', 'dish5', 'dish6', 'dish9', 'dish10', 'dish11', 'dish13', 'dish14'],
    averageRating: 4.5
  }
];

export const mockDeliveryPeople: DeliveryPerson[] = [
  {
    id: 'delivery1',
    email: 'delivery1@restaurant.com',
    role: 'delivery',
    name: 'James Wilson',
    createdAt: new Date('2024-02-01'),
    salary: 45000,
    hireDate: new Date('2024-02-01'),
    complaints: [],
    compliments: ['comp4'],
    status: 'active',
    deliveryCount: 156,
    averageRating: 4.8,
    currentLocation: 'Downtown'
  },
  {
    id: 'delivery2',
    email: 'delivery2@restaurant.com',
    role: 'delivery',
    name: 'Emma Thompson',
    createdAt: new Date('2024-02-15'),
    salary: 43000,
    hireDate: new Date('2024-02-15'),
    complaints: [],
    compliments: [],
    status: 'active',
    deliveryCount: 142,
    averageRating: 4.6,
    currentLocation: 'Midtown'
  }
];

export const mockManager: Manager = {
  id: 'manager1',
  email: 'manager@restaurant.com',
  role: 'manager',
  name: 'Alexandra Carter',
  createdAt: new Date('2023-12-01'),
  salary: 85000,
  hireDate: new Date('2023-12-01'),
  complaints: [],
  compliments: [],
  status: 'active'
};

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 'customer1',
    email: 'john@example.com',
    role: 'customer',
    name: 'John Smith',
    createdAt: new Date('2024-03-01'),
    accountBalance: 250,
    totalSpent: 150,
    orderCount: 5,
    warnings: [],
    orderHistory: ['order1', 'order2', 'order3'],
    favorites: ['dish1', 'dish4'],
    isBlacklisted: false,
    isVIP: true,
    freeDeliveriesEarned: 1,
    freeDeliveriesUsed: 0
  },
  {
    id: 'customer2',
    email: 'sarah@example.com',
    role: 'customer',
    name: 'Sarah Johnson',
    createdAt: new Date('2024-05-15'),
    accountBalance: 75,
    totalSpent: 45,
    orderCount: 2,
    warnings: [],
    orderHistory: ['order4'],
    favorites: ['dish2'],
    isBlacklisted: false,
    isVIP: false,
    freeDeliveriesEarned: 0,
    freeDeliveriesUsed: 0
  }
];

// Mock Dishes
export const mockDishes: Dish[] = [
  {
    id: 'dish1',
    name: 'Truffle Carbonara',
    description: 'Classic Italian carbonara with black truffle shavings and farm-fresh eggs',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600',
    chefId: 'chef1',
    category: 'Pasta',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.8,
    orderCount: 89,
    createdAt: new Date('2024-01-10')
  },
  {
    id: 'dish2',
    name: 'Margherita Pizza',
    description: 'Wood-fired pizza with San Marzano tomatoes, fresh mozzarella, and basil',
    price: 18.99,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    chefId: 'chef1',
    category: 'Pizza',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.6,
    orderCount: 124,
    createdAt: new Date('2024-01-10')
  },
  {
    id: 'dish3',
    name: 'Lobster Risotto',
    description: 'Creamy saffron risotto with fresh Maine lobster and microgreens',
    price: 38.99,
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-c0df49e79d66?w=600',
    chefId: 'chef1',
    category: 'Seafood',
    isVIPOnly: true,
    isAvailable: true,
    ratings: [],
    averageRating: 4.9,
    orderCount: 45,
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'dish4',
    name: 'Dragon Roll',
    description: 'Premium sushi roll with eel, avocado, and sweet sauce',
    price: 16.99,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600',
    chefId: 'chef2',
    category: 'Sushi',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.7,
    orderCount: 98,
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'dish5',
    name: 'Pad Thai',
    description: 'Traditional Thai stir-fried noodles with shrimp, peanuts, and tamarind',
    price: 14.99,
    imageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600',
    chefId: 'chef2',
    category: 'Asian',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.5,
    orderCount: 156,
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'dish6',
    name: 'Wagyu Beef Bowl',
    description: 'Premium A5 Wagyu beef over sushi rice with special sauce',
    price: 45.99,
    imageUrl: 'https://images.unsplash.com/photo-1588347818036-edc9042b2d39?w=600',
    chefId: 'chef2',
    category: 'Japanese',
    isVIPOnly: true,
    isAvailable: true,
    ratings: [],
    averageRating: 5.0,
    orderCount: 32,
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'dish7',
    name: 'Pepperoni Pizza',
    description: 'Classic pepperoni pizza with mozzarella cheese and spicy pepperoni slices',
    price: 19.99,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600',
    chefId: 'chef1',
    category: 'Pizza',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.7,
    orderCount: 167,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'dish8',
    name: 'Linguine Alfredo',
    description: 'Creamy alfredo sauce with fresh linguine pasta, parmesan cheese, and garlic',
    price: 22.99,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600',
    chefId: 'chef1',
    category: 'Pasta',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.6,
    orderCount: 112,
    createdAt: new Date('2024-01-18')
  },
  {
    id: 'dish9',
    name: 'Shrimp Tempura Roll',
    description: 'Crispy tempura shrimp wrapped in nori and rice with avocado and eel sauce',
    price: 17.99,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600',
    chefId: 'chef2',
    category: 'Sushi',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.8,
    orderCount: 134,
    createdAt: new Date('2024-01-25')
  },
  {
    id: 'dish10',
    name: 'Ramen',
    description: 'Traditional Japanese ramen with rich tonkotsu broth, chashu pork, soft-boiled egg, and nori',
    price: 16.99,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600',
    chefId: 'chef2',
    category: 'Japanese',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.7,
    orderCount: 145,
    createdAt: new Date('2024-02-05')
  },
  {
    id: 'dish11',
    name: 'Salmon Teriyaki',
    description: 'Grilled salmon glazed with sweet teriyaki sauce, served with steamed rice and vegetables',
    price: 23.99,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    chefId: 'chef2',
    category: 'Japanese',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.9,
    orderCount: 98,
    createdAt: new Date('2024-02-12')
  },
  {
    id: 'dish12',
    name: 'Seafood Paella',
    description: 'Spanish-style paella with saffron rice, shrimp, mussels, clams, and chorizo',
    price: 32.99,
    imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600',
    chefId: 'chef1',
    category: 'Seafood',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.8,
    orderCount: 67,
    createdAt: new Date('2024-02-20')
  },
  {
    id: 'dish13',
    name: 'Spicy Tuna Roll',
    description: 'Fresh tuna mixed with spicy mayo, wrapped in nori and rice, topped with sesame seeds',
    price: 15.99,
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600',
    chefId: 'chef2',
    category: 'Sushi',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.6,
    orderCount: 178,
    createdAt: new Date('2024-02-25')
  },
  {
    id: 'dish14',
    name: 'General Tso\'s Chicken',
    description: 'Crispy chicken pieces in a sweet and spicy General Tso\'s sauce with steamed broccoli and rice',
    price: 18.99,
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600',
    chefId: 'chef2',
    category: 'Asian',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.5,
    orderCount: 189,
    createdAt: new Date('2024-03-01')
  },
  {
    id: 'dish15',
    name: 'Four Cheese Pizza',
    description: 'Wood-fired pizza with mozzarella, gorgonzola, parmesan, and fontina cheeses',
    price: 21.99,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    chefId: 'chef1',
    category: 'Pizza',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.7,
    orderCount: 103,
    createdAt: new Date('2024-03-05')
  },
  {
    id: 'dish16',
    name: 'Penne Arrabbiata',
    description: 'Spicy penne pasta with tomato sauce, garlic, red chili peppers, and fresh parsley',
    price: 20.99,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600',
    chefId: 'chef1',
    category: 'Pasta',
    isVIPOnly: false,
    isAvailable: true,
    ratings: [],
    averageRating: 4.6,
    orderCount: 94,
    createdAt: new Date('2024-03-08')
  }
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'order1',
    customerId: 'customer1',
    items: [
      { dishId: 'dish1', quantity: 1, price: 24.99 }
    ],
    totalPrice: 24.99,
    deliveryFee: 5.00,
    discount: 1.50,
    finalPrice: 28.49,
    status: 'delivered',
    chefId: 'chef1',
    deliveryPersonId: 'delivery1',
    deliveryBids: [],
    createdAt: new Date('2024-03-05'),
    deliveredAt: new Date('2024-03-05')
  }
];

// Mock Knowledge Base
export const mockKnowledgeBase: KnowledgeBaseEntry[] = [
  {
    id: 'kb1',
    question: 'What are your opening hours?',
    answer: 'We are open Monday to Sunday from 11:00 AM to 10:00 PM.',
    authorId: 'manager1',
    category: 'General',
    rating: 4.5,
    ratingCount: 12,
    isFlagged: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'kb2',
    question: 'Do you offer gluten-free options?',
    answer: 'Yes, we have several gluten-free dishes available. Please check the menu for items marked as gluten-free or ask our staff.',
    authorId: 'chef1',
    category: 'Menu',
    rating: 4.8,
    ratingCount: 8,
    isFlagged: false,
    createdAt: new Date('2024-01-05')
  },
  {
    id: 'kb3',
    question: 'How do I become a VIP customer?',
    answer: 'You can become a VIP by spending more than $100 or completing 3 orders as a registered customer without outstanding complaints.',
    authorId: 'manager1',
    category: 'Membership',
    rating: 5.0,
    ratingCount: 15,
    isFlagged: false,
    createdAt: new Date('2024-01-10')
  }
];

// Mock Discussion Topics
export const mockDiscussionTopics: DiscussionTopic[] = [
  {
    id: 'topic1',
    authorId: 'customer1',
    title: 'Marco Chen\'s Truffle Carbonara is Amazing!',
    content: 'Just tried the truffle carbonara and it was absolutely incredible. The balance of flavors is perfect!',
    category: 'dish',
    relatedId: 'dish1',
    createdAt: new Date('2024-03-10'),
    posts: [
      {
        id: 'post1',
        topicId: 'topic1',
        authorId: 'customer2',
        content: 'I agree! Best carbonara I\'ve had in the city.',
        createdAt: new Date('2024-03-11')
      }
    ]
  }
];
