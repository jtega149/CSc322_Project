import { useState } from 'react';
import { ShoppingCart as CartIcon, Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dish, Customer } from '../../types';
import { calculateOrderTotal, formatCurrency, hasSufficientBalance } from '../../lib/utils';

interface CartItem {
  dish: Dish;
  quantity: number;
}

interface ShoppingCartProps {
  customer: Customer;
  onCheckout: (items: CartItem[], total: number) => void;
}

export function ShoppingCart({ customer, onCheckout }: ShoppingCartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [useFreeDelivery, setUseFreeDelivery] = useState(false);

  const isVIP = customer.isVIP || false;
  const hasAvailableFreeDelivery = customer.freeDeliveriesEarned > customer.freeDeliveriesUsed;

  const addItem = (dish: Dish) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const removeItem = (dishId: string) => {
    setCartItems(prev => prev.filter(item => item.dish.id !== dishId));
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.dish.id === dishId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const orderItems = cartItems.map(item => ({
    dishId: item.dish.id,
    quantity: item.quantity,
    price: item.dish.price
  }));

  const deliveryFee = 5.00;
  const totals = calculateOrderTotal(orderItems, deliveryFee, isVIP, useFreeDelivery && hasAvailableFreeDelivery);
  const hasSufficient = hasSufficientBalance(customer, totals.total);

  const handleCheckout = () => {
    if (!hasSufficient) {
      alert('Insufficient balance. Please deposit more funds.');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    onCheckout(cartItems, totals.total);
    setCartItems([]);
    setUseFreeDelivery(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CartIcon className="w-5 h-5" />
          Shopping Cart
          {cartItems.length > 0 && (
            <Badge>{cartItems.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.dish.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div>{item.dish.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(item.dish.price)} each
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.dish.id, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.dish.id, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <div className="w-20 text-right">
                  {formatCurrency(item.dish.price * item.quantity)}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.dish.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>

              {isVIP && totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>VIP Discount (5%):</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Fee:</span>
                <div className="flex items-center gap-2">
                  {hasAvailableFreeDelivery && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useFreeDelivery}
                        onChange={(e) => setUseFreeDelivery(e.target.checked)}
                        className="rounded"
                      />
                      Use free delivery
                    </label>
                  )}
                  <span className={useFreeDelivery && hasAvailableFreeDelivery ? 'line-through text-muted-foreground' : ''}>
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                Account Balance: {formatCurrency(customer.accountBalance)}
              </div>
            </div>

            {!hasSufficient && (
              <Alert variant="destructive">
                <AlertDescription>
                  Insufficient balance. Please deposit more funds to complete this order.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>

      {cartItems.length > 0 && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleCheckout}
            disabled={!hasSufficient}
          >
            Place Order
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Export addItem function for use in parent components
export function useShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  return {
    cartItems,
    addItem: (dish: Dish) => {
      setCartItems(prev => {
        const existing = prev.find(item => item.dish.id === dish.id);
        if (existing) {
          return prev.map(item =>
            item.dish.id === dish.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { dish, quantity: 1 }];
      });
    }
  };
}
