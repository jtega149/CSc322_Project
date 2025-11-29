import { useState, useEffect } from 'react';
import { ArrowLeft, Star, ChefHat } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { submitFeedback, getDishById } from '../../userService';
import { Order, Dish } from '../../types';
import { Alert, AlertDescription } from '../ui/alert';

interface RateChefPageProps {
  orderId: string;
  customerId: string;
  customerName: string;
  onBack: () => void;
  onSubmitted: () => void;
}

interface ChefRatingData {
  chefId: string;
  chefName: string;
  dishIds: string[];
  dishNames: string[];
  rating: number;
  sentiment: 'compliment' | 'complaint' | '';
  comment: string;
}

export function RateChefPage({ orderId, customerId, customerName, onBack, onSubmitted }: RateChefPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [chefRatings, setChefRatings] = useState<Map<string, ChefRatingData>>(new Map());

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        setError('Order not found');
        return;
      }

      const orderData = orderDoc.data() as any;
      const loadedOrder: Order = {
        id: orderDoc.id,
        ...orderData,
        createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt),
        deliveredAt: orderData.deliveredAt?.toDate ? orderData.deliveredAt.toDate() : (orderData.deliveredAt ? new Date(orderData.deliveredAt) : undefined)
      };
      setOrder(loadedOrder);

      // Group dishes by chef
      const chefMap = new Map<string, ChefRatingData>();
      
      for (const item of loadedOrder.items) {
        const dish = await getDishById(item.dishId);
        if (dish && dish.chefId) {
          if (!chefMap.has(dish.chefId)) {
            // Fetch chef name
            const chefDoc = await getDoc(doc(db, 'employees', dish.chefId));
            const chefName = chefDoc.exists() ? chefDoc.data().name : 'Unknown Chef';
            
            chefMap.set(dish.chefId, {
              chefId: dish.chefId,
              chefName,
              dishIds: [],
              dishNames: [],
              rating: 0,
              sentiment: '',
              comment: ''
            });
          }
          
          const chefData = chefMap.get(dish.chefId)!;
          chefData.dishIds.push(dish.id);
          chefData.dishNames.push(dish.name);
        }
      }

      setChefRatings(chefMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateChefRating = (chefId: string, field: keyof ChefRatingData, value: any) => {
    const newRatings = new Map(chefRatings);
    const chefData = newRatings.get(chefId);
    if (chefData) {
      newRatings.set(chefId, { ...chefData, [field]: value });
      setChefRatings(newRatings);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Validate all chef ratings
      for (const [chefId, data] of chefRatings.entries()) {
        if (data.rating === 0) {
          setError(`Please provide a rating for ${data.chefName}`);
          setSubmitting(false);
          return;
        }
        if (!data.sentiment) {
          setError(`Please select a sentiment (compliment/complaint) for ${data.chefName}`);
          setSubmitting(false);
          return;
        }
        if (!data.comment.trim()) {
          setError(`Please provide an explanation for ${data.chefName}`);
          setSubmitting(false);
          return;
        }
      }

      // Submit feedback for each chef
      const submitPromises = Array.from(chefRatings.values()).map(data =>
        submitFeedback(
          orderId,
          customerId,
          customerName,
          'chef',
          data.chefId,
          data.chefName,
          data.rating,
          data.sentiment as 'compliment' | 'complaint',
          data.comment,
          data.dishIds
        )
      );

      await Promise.all(submitPromises);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading order details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!order || chefRatings.size === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Alert>
          <AlertDescription>No chef information found for this order.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Rate Chef(s) for Order #{orderId.slice(0, 8)}
          </CardTitle>
          <CardDescription>
            Please rate the chef(s) who prepared your order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {Array.from(chefRatings.values()).map((chefData) => (
            <Card key={chefData.chefId} className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-lg">{chefData.chefName}</CardTitle>
                <CardDescription>
                  Dishes: {chefData.dishNames.join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Star Rating */}
                <div>
                  <Label>Rating (1-5 stars)</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateChefRating(chefData.chefId, 'rating', star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= chefData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sentiment Dropdown */}
                <div>
                  <Label htmlFor={`sentiment-${chefData.chefId}`}>Sentiment</Label>
                  <Select
                    value={chefData.sentiment}
                    onValueChange={(value) => updateChefRating(chefData.chefId, 'sentiment', value)}
                  >
                    <SelectTrigger id={`sentiment-${chefData.chefId}`} className="mt-2">
                      <SelectValue placeholder="Select compliment or complaint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliment">Compliment</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Comment */}
                <div>
                  <Label htmlFor={`comment-${chefData.chefId}`}>Explanation</Label>
                  <Textarea
                    id={`comment-${chefData.chefId}`}
                    placeholder="Please explain your rating..."
                    value={chefData.comment}
                    onChange={(e) => updateChefRating(chefData.chefId, 'comment', e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onBack} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

