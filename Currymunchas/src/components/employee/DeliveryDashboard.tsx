import { Truck, TrendingUp, DollarSign, Package, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { DeliveryPerson } from '../../types';
import { formatCurrency, calculatePerformanceScore } from '../../lib/utils';

interface DeliveryDashboardProps {
  deliveryPerson: DeliveryPerson;
}

export function DeliveryDashboard({ deliveryPerson }: DeliveryDashboardProps) {
  const performanceScore = calculatePerformanceScore(
    deliveryPerson.averageRating,
    deliveryPerson.complaints.length,
    deliveryPerson.compliments.length
  );

  // Mock active deliveries
  const activeDeliveries = [];
  const availableOrders = [
    {
      id: 'order1',
      customerName: 'John Doe',
      address: '123 Main St',
      items: 2,
      suggestedBid: 5.00
    },
    {
      id: 'order2',
      customerName: 'Jane Smith',
      address: '456 Oak Ave',
      items: 1,
      suggestedBid: 4.00
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Average Rating</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{deliveryPerson.averageRating.toFixed(1)} / 5.0</div>
            <Progress value={deliveryPerson.averageRating * 20} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Salary</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(deliveryPerson.salary)}</div>
            <p className="text-xs text-muted-foreground mt-1">Annual salary</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Deliveries</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{deliveryPerson.deliveryCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Performance</CardTitle>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{performanceScore.status}</div>
            <Badge 
              className="mt-2"
              variant={
                performanceScore.status === 'excellent' ? 'default' : 
                performanceScore.status === 'poor' ? 'destructive' : 
                'secondary'
              }
            >
              Score: {performanceScore.score.toFixed(0)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>{deliveryPerson.currentLocation || 'Location not set'}</span>
            <Button size="sm">Update Location</Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Available Orders</TabsTrigger>
          <TabsTrigger value="active">Active Deliveries</TabsTrigger>
          <TabsTrigger value="history">Delivery History</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Orders ({availableOrders.length})</CardTitle>
              <CardDescription>
                Submit bids for delivery orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders available at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(order => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{order.customerName}</CardTitle>
                            <CardDescription>{order.address}</CardDescription>
                          </div>
                          <Badge>{order.items} items</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Suggested bid: {formatCurrency(order.suggestedBid)}
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              step="0.50"
                              placeholder="Bid amount"
                              className="w-24 px-2 py-1 border rounded text-sm"
                            />
                            <Button size="sm">Submit Bid</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Deliveries</CardTitle>
              <CardDescription>
                Orders currently being delivered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active deliveries</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>
                Past completed deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Delivery history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Customer Feedback</CardTitle>
              <CardDescription>
                View complaints and compliments from customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl text-green-600">{deliveryPerson.compliments.length}</div>
                    <div className="text-sm text-muted-foreground">Compliments</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl text-red-600">{deliveryPerson.complaints.length}</div>
                    <div className="text-sm text-muted-foreground">Complaints</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
