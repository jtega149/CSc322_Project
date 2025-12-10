import { useState } from 'react';
import { Store, LogOut, Crown, User, ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Customer } from '../../types';
import { formatCurrency } from '../../lib/utils';

export function Header() {
  const { currentUser, logout } = useAuthContext();
  const { items, getTotalItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const cartItemCount = getTotalItems();
  const [cartOpen, setCartOpen] = useState(false);

  const getRoleDisplay = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'manager':
        return <Badge variant="default">Manager</Badge>;
      case 'chef':
        return <Badge variant="default">Chef</Badge>;
      case 'delivery':
        return <Badge variant="default">Delivery</Badge>;
      case 'customer':
        return currentUser.isVIP ? (
          <Badge className="bg-amber-500">
            <Crown className="w-3 h-3 mr-1" />
            VIP Customer
          </Badge>
        ) : (
          <Badge variant="secondary">Customer</Badge>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl">Curry Muncha's AI Restaurant</h1>
              <p className="text-xs text-muted-foreground">Smart Ordering System</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                {currentUser.role === 'customer' && (
                  <Popover open={cartOpen} onOpenChange={setCartOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="relative">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {cartItemCount > 0 && (
                          <Badge className=" -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {cartItemCount}
                          </Badge>
                        )}
                        Cart
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Shopping Cart
                        </h3>
                        {items.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Your cart is empty</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {items.map((item) => (
                              <div key={item.dish.id} className="flex items-start gap-2 p-2 rounded-lg border">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{item.dish.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(item.dish.price)} each
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-6 text-center text-xs">{item.quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="text-xs font-medium w-16 text-right">
                                  {formatCurrency(item.dish.price * item.quantity)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.dish.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Total:</span>
                              <span className="font-semibold">{formatCurrency(getTotalPrice())}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{currentUser.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currentUser.email}
                    </div>
                  </div>
                  {getRoleDisplay()}
                </div>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Badge variant="secondary">Visitor</Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
