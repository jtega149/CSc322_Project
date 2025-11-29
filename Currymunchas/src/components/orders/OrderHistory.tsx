import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, ChefHat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getAuth } from 'firebase/auth';

interface OrderHistoryProps {
  customerId: string;
  orderHistory: string[]; // Array of order IDs
  reloadKey?: number;
  onRateChef?: (orderId: string) => void;
  onRateDelivery?: (orderId: string) => void;
}

interface OrderWithDishNames extends Order {
  dishNames?: { [dishId: string]: string };
  hasChefReview?: boolean;
  hasDeliveryReview?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: 'Pending',
    icon: <Clock className="w-4 h-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  preparing: {
    label: 'Preparing',
    icon: <ChefHat className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  ready: {
    label: 'Ready',
    icon: <Package className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  delivering: {
    label: 'Delivering',
    icon: <Truck className="w-4 h-4" />,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  delivered: {
    label: 'Delivered',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle className="w-4 h-4" />,
    color: 'bg-red-100 text-red-800 border-red-200'
  }
};

export function OrderHistory({ customerId, orderHistory, reloadKey = 0, onRateChef, onRateDelivery }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderWithDishNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'active' | 'delivered'>('active');

  useEffect(() => {
    loadOrders();
  }, [orderHistory, reloadKey]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!orderHistory || orderHistory.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch each order document directly by ID
      const orderPromises = orderHistory.map(async (orderId) => {
        try {
          const orderDoc = await getDoc(doc(db, 'orders', orderId));
          if (orderDoc.exists()) {
            const data = orderDoc.data();
            return {
              id: orderDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : (data.deliveredAt ? new Date(data.deliveredAt) : undefined)
            } as Order;
          }
          return null;
        } catch (err) {
          console.error(`Error fetching order ${orderId}:`, err);
          return null;
        }
      });

      const fetchedOrders = (await Promise.all(orderPromises)).filter((order): order is Order => order !== null);
      
      // Sort by creation date (newest first)
      fetchedOrders.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Fetch dish names and rating flags for each order
      const ordersWithDishNames = await Promise.all(
        fetchedOrders.map(async (order) => {
          const dishNames: { [dishId: string]: string } = {};
          
          // Fetch dish names for each item
          await Promise.all(
            order.items.map(async (item) => {
              try {
                const dishDoc = await getDoc(doc(db, 'dishes', item.dishId));
                if (dishDoc.exists()) {
                  dishNames[item.dishId] = dishDoc.data().name;
                } else {
                  dishNames[item.dishId] = 'Unknown Dish';
                }
              } catch (err) {
                dishNames[item.dishId] = 'Unknown Dish';
              }
            })
          );

          // Check if this order has chef or delivery reviews from this customer
          let hasChefReview = false;
          let hasDeliveryReview = false;
          try {
            const feedbackRef = collection(db, 'feedback');
            const chefQ = query(
              feedbackRef,
              where('orderId', '==', order.id),
              where('customerId', '==', customerId),
              where('targetType', '==', 'chef')
            );
            const chefSnap = await getDocs(chefQ);
            hasChefReview = !chefSnap.empty;

            const deliveryQ = query(
              feedbackRef,
              where('orderId', '==', order.id),
              where('customerId', '==', customerId),
              where('targetType', '==', 'delivery')
            );
            const deliverySnap = await getDocs(deliveryQ);
            hasDeliveryReview = !deliverySnap.empty;
          } catch (err) {
            // If feedback check fails, we just treat as not reviewed
            console.error('Error checking feedback for order', order.id, err);
          }
          
          return { ...order, dishNames, hasChefReview, hasDeliveryReview };
        })
      );
      
      setOrders(ordersWithDishNames);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and rate your past orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading orders...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and rate your past orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadOrders} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and rate your past orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>You haven't placed any orders yet.</p>
            <p className="text-sm mt-2">Start browsing the menu to place your first order!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const listToRender = view === 'active' ? activeOrders : deliveredOrders;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Order History</CardTitle>
            <CardDescription>View and rate your past orders</CardDescription>
          </div>
          <div className="inline-flex rounded-md border p-1 text-xs">
            <button
              type="button"
              onClick={() => setView('active')}
              className={`px-3 py-1 rounded-sm ${
                view === 'active' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              In-Progress / Pending
            </button>
            <button
              type="button"
              onClick={() => setView('delivered')}
              className={`px-3 py-1 rounded-sm ${
                view === 'delivered' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {listToRender.map((order) => {
            const status = statusConfig[order.status];
            const tipAmount = (order as any).tipAmount || 0;
            
            const isDelivered = order.status === 'delivered';

            return (
              <Card key={order.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                        <Badge className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {order.deliveredAt && (
                        <p className="text-sm text-muted-foreground">
                          Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatCurrency(order.finalPrice)}
                      </div>
                      {tipAmount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Includes {formatCurrency(tipAmount)} tip
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-medium text-sm mb-2">Items:</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {order.dishNames?.[item.dishId] || 'Unknown Dish'} x{item.quantity}
                        </span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(order.totalPrice)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>
                        {order.deliveryFee === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          formatCurrency(order.deliveryFee)
                        )}
                      </span>
                    </div>
                    {tipAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tip</span>
                        <span>{formatCurrency(tipAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(order.finalPrice)}</span>
                    </div>
                  </div>

                  {(order as any).deliveryInfo && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-sm mb-2">Delivery Address:</h4>
                      <p className="text-sm text-muted-foreground">
                        {(order as any).deliveryInfo.streetAddress}, {(order as any).deliveryInfo.city}, {(order as any).deliveryInfo.state} {(order as any).deliveryInfo.zipCode}
                      </p>
                      {(order as any).deliveryInfo.deliveryInstructions && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Instructions:</span> {(order as any).deliveryInfo.deliveryInstructions}
                        </p>
                      )}
                    </div>
                  )}

                  {isDelivered && (onRateChef || onRateDelivery) && (
                    <div className="border-t pt-4 mt-4 flex flex-wrap gap-3">
                      {onRateChef && (
                        <Button
                          size="sm"
                          className="cursor-pointer"
                          disabled={order.hasChefReview}
                          onClick={() => onRateChef(order.id)}
                        >
                          {order.hasChefReview ? 'Chef(s) Rated' : 'Rate Chef(s)'}
                        </Button>
                      )}
                      {onRateDelivery && (order as any).deliveryPersonId && (
                        <Button
                          size="sm"
                          className="cursor-pointer"
                          disabled={order.hasDeliveryReview}
                          onClick={() => onRateDelivery(order.id)}
                        >
                          {order.hasDeliveryReview ? 'Delivery Rated' : 'Rate Delivery'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

