import React, { useEffect, useState } from 'react';
import { Truck, TrendingUp, DollarSign, Package, MapPin, Clock, Star, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DeliveryPerson, Order } from '../../types';
import { formatCurrency, calculatePerformanceScore, formatDate } from '../../lib/utils';
import { 
  getAvailableDeliveryOrders, 
  getDeliveryBidsForOrders, 
  submitDeliveryBid, 
  getActiveDeliveriesForDriver,
  markDeliveryFinished,
  getDeliveryHistoryForDriver,
  getFeedbackForEmployee,
  submitCustomerFeedback,
  hasFeedbackForOrder
} from '../../userService';
import { DisputeComplaintsTab } from '../complaints/DisputeComplaintsTab';
import { useAuthContext } from '../../contexts/AuthContext';

interface DeliveryDashboardProps {
  deliveryPerson: DeliveryPerson;
}

export function DeliveryDashboard({ deliveryPerson }: DeliveryDashboardProps) {
  const { refreshUser } = useAuthContext();
  const performanceScore = calculatePerformanceScore(
    deliveryPerson.averageRating,
    deliveryPerson.complaints.length,
    deliveryPerson.compliments.length
  );

  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [availableLoading, setAvailableLoading] = useState(true);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [bidsByOrder, setBidsByOrder] = useState<Record<string, { bids: any[]; lowestBidAmount: number | null; lowestBidderId: string | null }>>({});
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});
  const [isSubmittingBid, setIsSubmittingBid] = useState<Record<string, boolean>>({});
  const [isFinishingDelivery, setIsFinishingDelivery] = useState<Record<string, boolean>>({});
  const [historyDeliveries, setHistoryDeliveries] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [customerRatings, setCustomerRatings] = useState<Record<string, { rating: number; sentiment: 'compliment' | 'complaint' | ''; comment: string }>>({});
  const [hasRatedCustomer, setHasRatedCustomer] = useState<Record<string, boolean>>({});
  const [isSubmittingCustomerRating, setIsSubmittingCustomerRating] = useState<Record<string, boolean>>({});
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  // Load data on mount and poll periodically (excluding history, which is manual)
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([loadAvailableOrders(), loadActiveDeliveries()]);
    };
    // Initial loads
    loadAll();
    loadHistoryDeliveries();
    loadFeedback();

    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [deliveryPerson.id]);

  const loadFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const feedbacks = await getFeedbackForEmployee('delivery', deliveryPerson.id);
      setFeedback(feedbacks);
    } catch (error: any) {
      console.error('Error loading feedback:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      setAvailableLoading(true);
      const orders = await getAvailableDeliveryOrders();
      setAvailableOrders(orders as Order[]);

      const orderIds = (orders as Order[]).map(o => o.id);
      const bidsInfo = await getDeliveryBidsForOrders(orderIds);
      setBidsByOrder(bidsInfo as any);
    } catch (error: any) {
      console.error('Error loading available orders:', error);
    } finally {
      setAvailableLoading(false);
    }
  };

  // Refresh only bids info for currently loaded available orders
  const loadBidsForAvailableOrders = async () => {
    try {
      const orderIds = availableOrders.map(o => o.id);
      const bidsInfo = await getDeliveryBidsForOrders(orderIds);
      setBidsByOrder(bidsInfo as any);
    } catch (error: any) {
      console.error('Error loading bids for available orders:', error);
    }
  };

  const loadActiveDeliveries = async () => {
    try {
      setActiveLoading(true);
      const orders = await getActiveDeliveriesForDriver(deliveryPerson.id);
      setActiveDeliveries(orders as Order[]);
    } catch (error: any) {
      console.error('Error loading active deliveries:', error);
    } finally {
      setActiveLoading(false);
    }
  };

  const loadHistoryDeliveries = async () => {
    try {
      setHistoryLoading(true);
      const orders = await getDeliveryHistoryForDriver(deliveryPerson.id);
      setHistoryDeliveries(orders as Order[]);
      
      // Load customer names and check which customers have already been rated
      const ratedMap: Record<string, boolean> = {};
      const namesMap: Record<string, string> = {};
      for (const order of orders) {
        const hasRated = await hasFeedbackForOrder(order.id, deliveryPerson.id, 'customer');
        ratedMap[order.id] = hasRated;
        
        // Load customer name
        try {
          const customerDoc = await getDoc(doc(db, 'users', order.customerId));
          if (customerDoc.exists()) {
            namesMap[order.id] = customerDoc.data().name;
          } else {
            namesMap[order.id] = 'Unknown Customer';
          }
        } catch (err) {
          namesMap[order.id] = 'Unknown Customer';
        }
      }
      setHasRatedCustomer(ratedMap);
      setCustomerNames(namesMap);
    } catch (error: any) {
      console.error('Error loading delivery history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitCustomerRating = async (orderId: string, customerId: string, customerName: string) => {
    const ratingData = customerRatings[orderId];
    if (!ratingData || ratingData.rating === 0 || !ratingData.sentiment || !ratingData.comment.trim()) {
      alert('Please provide a rating, sentiment, and comment');
      return;
    }

    setIsSubmittingCustomerRating({ ...isSubmittingCustomerRating, [orderId]: true });
    try {
      await submitCustomerFeedback(
        orderId,
        deliveryPerson.id,
        deliveryPerson.name,
        customerId,
        customerName,
        ratingData.rating,
        ratingData.sentiment as 'compliment' | 'complaint',
        ratingData.comment
      );
      setHasRatedCustomer({ ...hasRatedCustomer, [orderId]: true });
      setCustomerRatings({ ...customerRatings, [orderId]: { rating: 0, sentiment: '', comment: '' } });
      alert('Customer feedback submitted successfully');
    } catch (error: any) {
      alert('Error submitting feedback: ' + error.message);
    } finally {
      setIsSubmittingCustomerRating({ ...isSubmittingCustomerRating, [orderId]: false });
    }
  };

  const handleBidChange = (orderId: string, value: string) => {
    setBidInputs(prev => ({ ...prev, [orderId]: value }));
  };

  const handleSubmitBid = async (orderId: string) => {
    const value = bidInputs[orderId];
    const amount = parseFloat(value);
    if (!value || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }

    setIsSubmittingBid(prev => ({ ...prev, [orderId]: true }));
    try {
      await submitDeliveryBid(orderId, deliveryPerson.id, deliveryPerson.name, amount);
      // Reload bids (and orders in case something changed)
      await loadAvailableOrders();
      setBidInputs(prev => ({ ...prev, [orderId]: '' }));
    } catch (error: any) {
      alert('Error submitting bid: ' + error.message);
    } finally {
      setIsSubmittingBid(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleFinishDelivery = async (orderId: string) => {
    setIsFinishingDelivery(prev => ({ ...prev, [orderId]: true }));
    try {
      await markDeliveryFinished(orderId);
      await loadActiveDeliveries();
      // Refresh delivery person data to update delivery count
      await refreshUser();
    } catch (error: any) {
      alert('Error marking delivery as finished: ' + error.message);
    } finally {
      setIsFinishingDelivery(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Orders where this driver has at least one bid (ongoing bids)
  const ongoingBidOrders = availableOrders.filter(order => {
    const bidInfo = bidsByOrder[order.id];
    if (!bidInfo || !bidInfo.bids) return false;
    return bidInfo.bids.some((b: any) => b.deliveryPersonId === deliveryPerson.id);
  });

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
          <TabsTrigger value="disputes">Dispute Complaints</TabsTrigger>
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
              {availableLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading available orders...</p>
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders available at the moment</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {availableOrders.map(order => {
                      const bidInfo = bidsByOrder[order.id];
                      const lowestBid = bidInfo?.lowestBidAmount ?? null;
                      const hasBidByDriver = bidInfo?.bids?.some((b: any) => b.deliveryPersonId === deliveryPerson.id);

                      return (
                        <Card key={order.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  Order #{order.id.slice(0, 8)}
                                </CardTitle>
                                {order.deliveryInfo && (
                                  <CardDescription>
                                    {order.deliveryInfo.streetAddress}, {order.deliveryInfo.city}
                                  </CardDescription>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  Placed: {formatDate(order.createdAt)}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge>
                                  {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
                                </Badge>
                                <div className="text-sm font-semibold mt-1">
                                  Total: {formatCurrency(order.finalPrice)}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="text-muted-foreground">
                                  Current lowest bid:{' '}
                                  {lowestBid !== null ? (
                                    <span className="font-semibold text-green-700">
                                      {formatCurrency(lowestBid)}
                                    </span>
                                  ) : (
                                    <span className="italic">No bids yet</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-2">
                                <input 
                                  type="number" 
                                  step="0.50"
                                  placeholder="Your bid"
                                  className="w-24 px-2 py-1 border rounded text-sm"
                                  value={bidInputs[order.id] ?? ''}
                                  onChange={(e) => handleBidChange(order.id, e.target.value)}
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSubmitBid(order.id)}
                                  disabled={isSubmittingBid[order.id]}
                                >
                                  {isSubmittingBid[order.id] ? 'Submitting...' : 'Submit Bid'}
                                </Button>
                              </div>
                              {hasBidByDriver && (
                                <div className="text-xs text-blue-700 mt-1">
                                  You have an active bid on this order.
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ongoing Bids Section */}
          {ongoingBidOrders.length > 0 && (
            <Card className="mt-6 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Ongoing Bids ({ongoingBidOrders.length})
                </CardTitle>
                <CardDescription>
                  Orders where you have placed a bid. Refresh to see if any have been accepted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button size="sm" variant="outline" onClick={loadBidsForAvailableOrders}>
                    Refresh
                  </Button>
                </div>
                <div className="space-y-3">
                  {ongoingBidOrders.map(order => {
                    const bidInfo = bidsByOrder[order.id];
                    const myBids = (bidInfo?.bids || []).filter((b: any) => b.deliveryPersonId === deliveryPerson.id);
                    const myLatestBid = myBids.length > 0 ? myBids[myBids.length - 1] : null;
                    const lowestBid = bidInfo?.lowestBidAmount ?? null;

                    return (
                      <Card key={order.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-sm">
                                Order #{order.id.slice(0, 8)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Placed: {formatDate(order.createdAt)}
                              </div>
                              {order.deliveryInfo && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {order.deliveryInfo.streetAddress}, {order.deliveryInfo.city}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-xs">
                              {myLatestBid && (
                                <div>
                                  <div>Your last bid:</div>
                                  <div className="font-semibold">
                                    {formatCurrency(myLatestBid.bidAmount)}
                                  </div>
                                </div>
                              )}
                              <div className="mt-1">
                                <div>Current lowest:</div>
                                <div className="font-semibold text-green-700">
                                  {lowestBid !== null ? formatCurrency(lowestBid) : 'No bids'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Deliveries</CardTitle>
              <CardDescription>
                Orders currently assigned to you for delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading active deliveries...</p>
                </div>
              ) : activeDeliveries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active deliveries</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button size="sm" variant="outline" onClick={loadActiveDeliveries}>
                      Refresh
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {activeDeliveries.map(order => (
                      <Card key={order.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                Order #{order.id.slice(0, 8)}
                              </CardTitle>
                              {order.deliveryInfo && (
                                <CardDescription>
                                  {order.deliveryInfo.streetAddress}, {order.deliveryInfo.city}
                                </CardDescription>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                Placed: {formatDate(order.createdAt)}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge className="mb-1">
                                {order.status === 'delivering' ? 'Delivering' : 'Ready for pickup'}
                              </Badge>
                              <div className="text-sm font-semibold">
                                Total: {formatCurrency(order.finalPrice)}
                              </div>
                              {order.status === 'delivering' && (
                                <Button
                                  size="sm"
                                  className="mt-1 cursor-pointer"
                                  onClick={() => handleFinishDelivery(order.id)}
                                  disabled={isFinishingDelivery[order.id]}
                                >
                                  {isFinishingDelivery[order.id] ? 'Finishing...' : 'Finished Delivery'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </>
              )}
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
              {historyLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading delivery history...</p>
                </div>
              ) : historyDeliveries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No completed deliveries yet.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button size="sm" variant="outline" onClick={loadHistoryDeliveries}>
                      Refresh
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {historyDeliveries.map((order) => {
                      const customerName = customerNames[order.id] || 'Unknown Customer';
                      const customerId = order.customerId;
                      const hasRated = hasRatedCustomer[order.id] || false;
                      const ratingData = customerRatings[order.id] || { rating: 0, sentiment: '' as 'compliment' | 'complaint' | '', comment: '' };
                      
                      return (
                        <Card key={order.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  Order #{order.id.slice(0, 8)}
                                </CardTitle>
                                {order.deliveryInfo && (
                                  <CardDescription>
                                    {order.deliveryInfo.streetAddress}, {order.deliveryInfo.city}
                                  </CardDescription>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  Customer: {customerName}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Placed: {formatDate(order.createdAt)}
                                </div>
                                {order.deliveredAt && (
                                  <div className="text-xs text-muted-foreground">
                                    Delivered: {formatDate(order.deliveredAt)}
                                  </div>
                                )}
                              </div>
                              <div className="text-right space-y-1">
                                <Badge className="mb-1">Delivered</Badge>
                                <div className="text-sm font-semibold">
                                  Total: {formatCurrency(order.finalPrice)}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {!hasRated ? (
                              <div className="space-y-4 pt-4 border-t">
                                <div>
                                  <Label>Rate Customer</Label>
                                  <div className="flex gap-2 mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setCustomerRatings({
                                          ...customerRatings,
                                          [order.id]: { ...ratingData, rating: star }
                                        })}
                                        className="focus:outline-none"
                                      >
                                        <Star
                                          className={`w-6 h-6 ${
                                            star <= ratingData.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor={`sentiment-${order.id}`}>Sentiment</Label>
                                  <Select
                                    value={ratingData.sentiment}
                                    onValueChange={(value) => setCustomerRatings({
                                      ...customerRatings,
                                      [order.id]: { ...ratingData, sentiment: value as 'compliment' | 'complaint' }
                                    })}
                                  >
                                    <SelectTrigger id={`sentiment-${order.id}`} className="mt-2">
                                      <SelectValue placeholder="Select compliment or complaint" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="compliment">Compliment</SelectItem>
                                      <SelectItem value="complaint">Complaint</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor={`comment-${order.id}`}>Comment</Label>
                                  <Textarea
                                    id={`comment-${order.id}`}
                                    placeholder="Please explain your rating..."
                                    value={ratingData.comment}
                                    onChange={(e) => setCustomerRatings({
                                      ...customerRatings,
                                      [order.id]: { ...ratingData, comment: e.target.value }
                                    })}
                                    className="mt-2"
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitCustomerRating(order.id, customerId, customerName)}
                                  disabled={isSubmittingCustomerRating[order.id]}
                                >
                                  {isSubmittingCustomerRating[order.id] ? 'Submitting...' : 'Submit Feedback'}
                                </Button>
                              </div>
                            ) : (
                              <div className="pt-4 border-t text-sm text-muted-foreground">
                                <Badge variant="secondary">Customer Rated</Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
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
          <DisputeComplaintsTab userId={deliveryPerson.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
