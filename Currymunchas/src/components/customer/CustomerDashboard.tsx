import React, { useState, useEffect } from 'react';
import { Crown, AlertTriangle, Wallet, Package, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Customer, Dish } from '../../types';
import { MenuGrid } from '../menu/MenuGrid';
import { AIChat } from '../chat/AIChat';
import { DiscussionForum } from '../discussions/DiscussionForum';
import { DepositPage } from '../finance/DepositPage';
import { CheckoutPage } from '../orders/CheckoutPage';
import { OrderHistory } from '../orders/OrderHistory';
import { RateChefPage } from '../orders/RateChefPage';
import { RateDeliveryPage } from '../orders/RateDeliveryPage';
import { DisputeComplaintsTab } from '../complaints/DisputeComplaintsTab';
import { formatCurrency, shouldBeVIP } from '../../lib/utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getAllDishes } from '../../userService';

interface CustomerDashboardProps {
  customer: Customer;
}

export function CustomerDashboard({ customer }: CustomerDashboardProps) {
  const [showDepositPage, setShowDepositPage] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingType, setRatingType] = useState<'chef' | 'delivery' | null>(null);
  const [ordersReloadKey, setOrdersReloadKey] = useState(0);
  const { refreshUser } = useAuthContext();
  const { addToCart, items, getTotalItems } = useCart();
  const isVIP = customer.isVIP || false;
  const totalSpent = customer.totalSpent || 0;
  const progress = isVIP ? 100 : Math.min(100, (totalSpent / 100) * 100);
  const ordersUntilVIP = Math.max(0, 3 - customer.orderCount);
  const spendingUntilVIP = Math.max(0, 100 - totalSpent);

  useEffect(() => {
    const loadDishes = async () => {
      try {
        setDishesLoading(true);
        const fetchedDishes = await getAllDishes();
        setDishes(fetchedDishes as Dish[]);
      } catch (error: any) {
        console.error('Error loading dishes:', error);
        // Fallback to empty array on error
        setDishes([]);
      } finally {
        setDishesLoading(false);
      }
    };

    loadDishes();
  }, []);

  const handleAddToCart = (dish: Dish) => {
    addToCart(dish);
  };

  const handleDepositComplete = async () => {
    // Refresh user data to get updated balance
    await refreshUser();
    setShowDepositPage(false);
  };

  const handleRateChef = (orderId: string) => {
    setRatingOrderId(orderId);
    setRatingType('chef');
  };

  const handleRateDelivery = (orderId: string) => {
    setRatingOrderId(orderId);
    setRatingType('delivery');
  };

  const handleRatingSubmitted = () => {
    setRatingOrderId(null);
    setRatingType(null);
    setOrdersReloadKey(prev => prev + 1);
  };

  // Show rating pages if requested
  if (ratingOrderId && ratingType === 'chef') {
    return (
      <RateChefPage
        orderId={ratingOrderId}
        customerId={customer.id}
        customerName={customer.name}
        onBack={() => {
          setRatingOrderId(null);
          setRatingType(null);
        }}
        onSubmitted={handleRatingSubmitted}
      />
    );
  }

  if (ratingOrderId && ratingType === 'delivery') {
    return (
      <RateDeliveryPage
        orderId={ratingOrderId}
        customerId={customer.id}
        customerName={customer.name}
        onBack={() => {
          setRatingOrderId(null);
          setRatingType(null);
        }}
        onSubmitted={handleRatingSubmitted}
      />
    );
  }

  // Show checkout page if requested
  if (showCheckout) {
    return (
      <CheckoutPage
        customer={customer}
        onBack={() => setShowCheckout(false)}
        onOrderComplete={async () => {
          await refreshUser();
          setShowCheckout(false);
        }}
      />
    );
  }

  // Show deposit page if requested
  if (showDepositPage) {
    return (
      <DepositPage
        currentBalance={customer.accountBalance}
        onBack={() => setShowDepositPage(false)}
        onDepositComplete={handleDepositComplete}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Warnings Alert */}
      {customer.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings ({customer.warnings.length})</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {customer.warnings.map((warning) => (
                <li key={warning.id}>
                  {warning.reason} - {new Date(warning.issuedAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
            {customer.isVIP && customer.warnings.length >= 2 && (
              <p className="mt-2">
                Warning: One more warning will downgrade you to regular customer status.
              </p>
            )}
            {!customer.isVIP && customer.warnings.length >= 2 && (
              <p className="mt-2">
                Warning: One more warning will result in account deregistration.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Account Status</CardTitle>
            {isVIP && <Crown className="w-4 h-4 text-amber-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {isVIP ? 'VIP Member' : 'Registered Customer'}
            </div>
            {!isVIP && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  Progress to VIP
                </div>
                <Progress value={progress} />
                <div className="text-xs text-muted-foreground">
                  {spendingUntilVIP > 0 && `$${spendingUntilVIP.toFixed(2)} more to spend`}
                  {spendingUntilVIP > 0 && ordersUntilVIP > 0 && ' or '}
                  {ordersUntilVIP > 0 && `${ordersUntilVIP} more orders`}
                </div>
              </div>
            )}
            {isVIP && (
              <div className="mt-4 space-y-2">
                <Badge className="bg-amber-500">5% Discount Active</Badge>
                <div className="text-sm text-muted-foreground">
                  Free deliveries: {customer.freeDeliveriesEarned - customer.freeDeliveriesUsed} available
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Account Balance</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(customer.accountBalance)}</div>
            <Button 
              size="sm" 
              type="button"
              className="mt-4 cursor-pointer"
              onClick={() => setShowDepositPage(true)}
            >
              Deposit Funds
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Order Statistics</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{customer.orderCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total orders
            </p>
            <p className="text-sm mt-2">
              Total spent: {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Button - Show when cart has items */}
      {getTotalItems() > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">You have {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart</p>
                <p className="text-sm text-muted-foreground">Ready to checkout?</p>
              </div>
              <Button onClick={() => setShowCheckout(true)} size="lg" className="cursor-pointer">
                Proceed to Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="menu" className="space-y-6">
        <TabsList>
          <TabsTrigger value="menu">Browse Menu</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          <TabsTrigger value="disputes">Dispute Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          {dishesLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading menu...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <MenuGrid 
              dishes={dishes}
              isVIP={isVIP}
              onAddToCart={handleAddToCart}
            />
          )}
        </TabsContent>

        <TabsContent value="orders">
          <OrderHistory 
            customerId={customer.id} 
            orderHistory={customer.orderHistory || []}
            reloadKey={ordersReloadKey}
            onRateChef={handleRateChef}
            onRateDelivery={handleRateDelivery}
          />
        </TabsContent>

        <TabsContent value="discussions">

          <DiscussionForum
            currentUserId={customer.id}
            currentUserName={customer.name}
            currentUserRole={customer.role}
          />
        </TabsContent>

        <TabsContent value="chat">
          <AIChat userId={customer.id} />
        </TabsContent>

        <TabsContent value="disputes">
          <DisputeComplaintsTab userId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
