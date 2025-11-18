import { Customer, Dish, Order } from '../types';

/**
 * Calculate if a customer qualifies for VIP status
 */
export function shouldBeVIP(customer: Customer): boolean {
  return (
    (customer.totalSpent >= 100 || customer.orderCount >= 3) &&
    customer.warnings.length === 0
  );
}

/**
 * Calculate VIP discount (5%)
 */
export function calculateVIPDiscount(price: number): number {
  return price * 0.05;
}

/**
 * Calculate final order price with discount
 */
export function calculateOrderTotal(
  items: { dishId: string; quantity: number; price: number }[],
  deliveryFee: number,
  isVIP: boolean,
  useFreeDelivery: boolean = false
): { subtotal: number; discount: number; deliveryFee: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = isVIP ? calculateVIPDiscount(subtotal) : 0;
  const finalDeliveryFee = useFreeDelivery ? 0 : deliveryFee;
  const total = subtotal - discount + finalDeliveryFee;

  return {
    subtotal,
    discount,
    deliveryFee: finalDeliveryFee,
    total
  };
}

/**
 * Get personalized recommendations based on order history
 */
export function getPersonalizedDishes(
  allDishes: Dish[],
  orderHistory: string[],
  favorites: string[]
): Dish[] {
  const dishMap = new Map(allDishes.map(d => [d.id, d]));
  
  // Get dishes from order history
  const orderedDishes = orderHistory
    .map(orderId => dishMap.get(orderId))
    .filter(Boolean) as Dish[];
  
  // Sort by order count (most ordered)
  return orderedDishes.sort((a, b) => b.orderCount - a.orderCount);
}

/**
 * Get top rated dishes
 */
export function getTopRatedDishes(dishes: Dish[], limit: number = 5): Dish[] {
  return [...dishes]
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, limit);
}

/**
 * Get most popular dishes
 */
export function getMostPopularDishes(dishes: Dish[], limit: number = 5): Dish[] {
  return [...dishes]
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, limit);
}

/**
 * Check if customer has sufficient balance
 */
export function hasSufficientBalance(customer: Customer, orderTotal: number): boolean {
  return customer.accountBalance >= orderTotal;
}

/**
 * Calculate complaint weight (VIP complaints count double)
 */
export function getComplaintWeight(userRole: 'customer' | 'vip'): number {
  return userRole === 'vip' ? 2 : 1;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Generate mock LLM response
 */
export function getMockLLMResponse(question: string): string {
  // Simple mock response - in production, this would call an actual LLM API
  const responses = [
    "I'd be happy to help you with that! Our restaurant specializes in Italian and Asian fusion cuisine.",
    "That's a great question! Let me provide you with some information about that.",
    "Based on our menu and customer preferences, I'd recommend trying our signature dishes.",
    "I understand your inquiry. Our team is dedicated to providing the best dining experience."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Search knowledge base
 */
export function searchKnowledgeBase(
  query: string,
  knowledgeBase: any[]
): any | null {
  const lowerQuery = query.toLowerCase();
  
  return knowledgeBase.find(entry => 
    entry.question.toLowerCase().includes(lowerQuery) ||
    entry.answer.toLowerCase().includes(lowerQuery)
  ) || null;
}

/**
 * Calculate employee performance score
 */
export function calculatePerformanceScore(
  averageRating: number,
  complaintCount: number,
  complimentCount: number
): { score: number; status: 'excellent' | 'good' | 'poor' } {
  const netCompliments = complimentCount - complaintCount;
  const score = (averageRating / 5) * 50 + netCompliments * 10;
  
  let status: 'excellent' | 'good' | 'poor' = 'good';
  if (score >= 40) status = 'excellent';
  else if (score < 20) status = 'poor';
  
  return { score, status };
}
