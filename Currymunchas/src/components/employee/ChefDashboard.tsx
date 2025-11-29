import React, { useState, useEffect } from 'react';
import { ChefHat, TrendingUp, AlertCircle, DollarSign, Plus, Clock, Package, CheckCircle, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Chef, Dish, Order } from '../../types';
import { formatCurrency, calculatePerformanceScore } from '../../lib/utils';
import { DishCard } from '../menu/DishCard';
import { 
  getDishesByChefId, 
  getPendingOrders, 
  getChefPreparingOrders, 
  acceptOrder, 
  markOrderReady, 
  createDish,
  getDishById,
  getFeedbackForEmployee
} from '../../userService';
import { DisputeComplaintsTab } from '../complaints/DisputeComplaintsTab';
import { formatDate } from '../../lib/utils';

interface ChefDashboardProps {
  chef: Chef;
}

export function ChefDashboard({ chef }: ChefDashboardProps) {
  const [myDishes, setMyDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [dishNames, setDishNames] = useState<{ [dishId: string]: string }>({});
  
  // Create dish form state
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishCategory, setDishCategory] = useState('');
  const [dishIsVIPOnly, setDishIsVIPOnly] = useState(false);
  const [isCreatingDish, setIsCreatingDish] = useState(false);
  const [createDishSuccess, setCreateDishSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('dishes');
  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  const performanceScore = calculatePerformanceScore(
    chef.averageRating,
    chef.complaints.length,
    chef.compliments.length
  );

  useEffect(() => {
    loadMyDishes();
    loadOrders();
    loadFeedback();
    // Set up interval to refresh orders every 5 seconds
    const interval = setInterval(() => {
      loadOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [chef.id]);

  const loadFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const feedbacks = await getFeedbackForEmployee('chef', chef.id);
      setFeedback(feedbacks);
    } catch (error: any) {
      console.error('Error loading feedback:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const loadMyDishes = async () => {
    try {
      setDishesLoading(true);
      const dishes = await getDishesByChefId(chef.id);
      setMyDishes(dishes as Dish[]);
    } catch (error: any) {
      console.error('Error loading dishes:', error);
    } finally {
      setDishesLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const [pending, preparing] = await Promise.all([
        getPendingOrders(),
        getChefPreparingOrders(chef.id)
      ]);
      setPendingOrders(pending as Order[]);
      setPreparingOrders(preparing as Order[]);
      
      // Fetch dish names for all unique dish IDs
      const allDishIds = new Set<string>();
      [...pending, ...preparing].forEach(order => {
        order.items.forEach(item => allDishIds.add(item.dishId));
      });
      
      const names: { [dishId: string]: string } = {};
      await Promise.all(
        Array.from(allDishIds).map(async (dishId) => {
          try {
            const dish = await getDishById(dishId);
            if (dish) {
              names[dishId] = dish.name;
            } else {
              names[dishId] = 'Unknown Dish';
            }
          } catch (error) {
            names[dishId] = 'Unknown Dish';
          }
        })
      );
      setDishNames(names);
    } catch (error: any) {
      console.error('Error loading orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId, chef.id);
      await loadOrders();
    } catch (error: any) {
      alert('Error accepting order: ' + error.message);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await markOrderReady(orderId);
      await loadOrders();
    } catch (error: any) {
      alert('Error marking order as ready: ' + error.message);
    }
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName || !dishDescription || !dishPrice || !dishCategory) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreatingDish(true);
    try {
      await createDish(
        chef.id,
        dishName,
        dishDescription,
        parseFloat(dishPrice),
        dishImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
        dishCategory,
        dishIsVIPOnly
      );
      setCreateDishSuccess(true);
      // Reset form
      setDishName('');
      setDishDescription('');
      setDishPrice('');
      setDishImageUrl('');
      setDishCategory('');
      setDishIsVIPOnly(false);
      // Reload dishes
      await loadMyDishes();
      // Reset success message after 3 seconds
      setTimeout(() => setCreateDishSuccess(false), 3000);
    } catch (error: any) {
      alert('Error creating dish: ' + error.message);
    } finally {
      setIsCreatingDish(false);
    }
  };

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
            <div className="text-2xl">{chef.averageRating.toFixed(1)} / 5.0</div>
            <Progress value={chef.averageRating * 20} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Salary</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(chef.salary)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Annual salary
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Feedback</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <div className="text-2xl text-green-600">
                  {feedbackLoading ? 0 : feedback.filter(fb => fb.sentiment === 'compliment').length}
                </div>
                <p className="text-xs text-muted-foreground">Compliments</p>
              </div>
              <div>
                <div className="text-2xl text-red-600">
                  {feedbackLoading ? 0 : feedback.filter(fb => fb.sentiment === 'complaint').length}
                </div>
                <p className="text-xs text-muted-foreground">Complaints</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Performance</CardTitle>
            <ChefHat className="w-4 h-4 text-muted-foreground" />
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

      {/* Current Orders Being Worked On */}
      {preparingOrders.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Current Orders Being Worked On ({preparingOrders.length})
            </CardTitle>
            <CardDescription>
              Orders you are currently preparing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {preparingOrders.map(order => (
                <Card key={order.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-800">Preparing</Badge>
                          <span className="text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">Qty {item.quantity}:</span> {dishNames[item.dishId] || `Dish ID: ${item.dishId}`}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm font-semibold">
                          Total: {formatCurrency(order.finalPrice)}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleMarkReady(order.id)}
                        className="ml-4"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Order is Ready
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Alerts */}
      {chef.status === 'demoted' && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600">Demoted Status</CardTitle>
            <CardDescription>
              Your performance needs improvement. Another demotion will result in termination.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {chef.complaints.length >= 2 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Performance Warning</CardTitle>
            <CardDescription>
              You have {chef.complaints.length} complaints. Three complaints will result in demotion.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dishes">My Dishes</TabsTrigger>
          <TabsTrigger value="pending">Pending Orders</TabsTrigger>
          <TabsTrigger value="create">Create New Dish</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="disputes">Dispute Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="dishes">
          <Card>
            <CardHeader>
              <CardTitle>My Dishes ({myDishes.length})</CardTitle>
              <CardDescription>
                Manage and view performance of your dishes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dishesLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading dishes...</p>
                </div>
              ) : myDishes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't created any dishes yet</p>
                  <Button className="mt-4" onClick={() => setActiveTab('create')}>
                    Create Your First Dish
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myDishes.map(dish => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Orders ({pendingOrders.length})
              </CardTitle>
              <CardDescription>
                Accept orders to start preparing them
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading orders...</p>
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending orders at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map(order => (
                    <Card key={order.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                              <span className="text-sm text-muted-foreground">
                                Order #{order.id.slice(0, 8)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                • {formatDate(order.createdAt)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">Qty {item.quantity}:</span> Dish ID: {item.dishId}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-sm font-semibold">
                              Total: {formatCurrency(order.finalPrice)}
                            </div>
                            {order.deliveryInfo && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Delivery to: {order.deliveryInfo.streetAddress}, {order.deliveryInfo.city}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="ml-4"
                          >
                            <ChefHat className="w-4 h-4 mr-2" />
                            Accept Order
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Dish</CardTitle>
              <CardDescription>
                Add a new dish to the menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {createDishSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  Dish created successfully!
                </div>
              )}
              <form onSubmit={handleCreateDish} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dishName">Dish Name *</Label>
                  <Input
                    id="dishName"
                    placeholder="e.g., Truffle Carbonara"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dishDescription">Description *</Label>
                  <Textarea
                    id="dishDescription"
                    placeholder="Describe your dish..."
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dishPrice">Price ($) *</Label>
                    <Input
                      id="dishPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="24.99"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dishCategory">Category *</Label>
                    <Select value={dishCategory} onValueChange={setDishCategory} required>
                      <SelectTrigger id="dishCategory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pasta">Pasta</SelectItem>
                        <SelectItem value="Pizza">Pizza</SelectItem>
                        <SelectItem value="Seafood">Seafood</SelectItem>
                        <SelectItem value="Sushi">Sushi</SelectItem>
                        <SelectItem value="Thai">Thai</SelectItem>
                        <SelectItem value="Dessert">Dessert</SelectItem>
                        <SelectItem value="Appetizer">Appetizer</SelectItem>
                        <SelectItem value="Main Course">Main Course</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dishImageUrl">Image URL (optional)</Label>
                  <Input
                    id="dishImageUrl"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={dishImageUrl}
                    onChange={(e) => setDishImageUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dishIsVIPOnly"
                    checked={dishIsVIPOnly}
                    onChange={(e) => setDishIsVIPOnly(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dishIsVIPOnly" className="cursor-pointer">
                    VIP Only (exclusive dish for VIP customers)
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isCreatingDish}>
                  {isCreatingDish ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Dish
                    </>
                  )}
                </Button>
              </form>
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
                {feedbackLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading feedback...</p>
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((fb) => (
                      <Card key={fb.id} className={`border-l-4 ${
                        fb.sentiment === 'compliment' ? 'border-l-green-500' : 'border-l-red-500'
                      }`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={fb.sentiment === 'compliment' ? 'default' : 'destructive'}>
                                  {fb.sentiment === 'compliment' ? 'Compliment' : 'Complaint'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Order #{fb.orderId.slice(0, 8)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                From {fb.customerName} • {formatDate(fb.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= fb.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {fb.comment && (
                            <p className="text-sm mt-3">{fb.comment}</p>
                          )}
                          {fb.dishIds && fb.dishIds.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Dishes: {fb.dishIds.length} dish(es)
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <DisputeComplaintsTab userId={chef.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
