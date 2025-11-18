import { useState } from 'react';
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
import { mockDishes, mockDiscussionTopics } from '../../lib/mockData';
import { formatCurrency, shouldBeVIP } from '../../lib/utils';

interface CustomerDashboardProps {
  customer: Customer;
}

export function CustomerDashboard({ customer }: CustomerDashboardProps) {
  const isVIP = customer.role === 'vip';
  const progress = isVIP ? 100 : Math.min(100, (customer.totalSpent / 100) * 100);
  const ordersUntilVIP = Math.max(0, 3 - customer.orderCount);
  const spendingUntilVIP = Math.max(0, 100 - customer.totalSpent);

  const handleAddToCart = (dish: Dish) => {
    // This would be handled by parent component with actual cart state
    console.log('Add to cart:', dish);
  };

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
            {customer.role === 'vip' && customer.warnings.length >= 2 && (
              <p className="mt-2">
                Warning: One more warning will downgrade you to regular customer status.
              </p>
            )}
            {customer.role === 'customer' && customer.warnings.length >= 2 && (
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
            <Button size="sm" className="mt-4">Deposit Funds</Button>
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
              Total spent: {formatCurrency(customer.totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="menu" className="space-y-6">
        <TabsList>
          <TabsTrigger value="menu">Browse Menu</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          <MenuGrid 
            dishes={mockDishes}
            isVIP={isVIP}
            onAddToCart={handleAddToCart}
          />
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View and rate your past orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Your order history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussions">
          <DiscussionForum
            topics={mockDiscussionTopics}
            currentUserId={customer.id}
            onCreateTopic={() => console.log('Create topic')}
            onViewTopic={(id) => console.log('View topic', id)}
          />
        </TabsContent>

        <TabsContent value="chat">
          <AIChat userId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
