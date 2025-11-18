import { useState } from 'react';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface RatingDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (foodRating: number, deliveryRating: number, comment: string) => void;
  dishName: string;
}

export function RatingDialog({ open, onClose, onSubmit, dishName }: RatingDialogProps) {
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredFoodStar, setHoveredFoodStar] = useState(0);
  const [hoveredDeliveryStar, setHoveredDeliveryStar] = useState(0);

  const handleSubmit = () => {
    if (foodRating === 0 || deliveryRating === 0) {
      alert('Please provide both food and delivery ratings');
      return;
    }

    onSubmit(foodRating, deliveryRating, comment);
    
    // Reset form
    setFoodRating(0);
    setDeliveryRating(0);
    setComment('');
    onClose();
  };

  const StarRating = ({ 
    rating, 
    setRating, 
    hoveredStar, 
    setHoveredStar 
  }: { 
    rating: number; 
    setRating: (r: number) => void;
    hoveredStar: number;
    setHoveredStar: (r: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hoveredStar || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Order</DialogTitle>
          <DialogDescription>
            Please rate your experience with {dishName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Food Quality (1-5 stars)</Label>
            <StarRating 
              rating={foodRating}
              setRating={setFoodRating}
              hoveredStar={hoveredFoodStar}
              setHoveredStar={setHoveredFoodStar}
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Quality (1-5 stars)</Label>
            <StarRating 
              rating={deliveryRating}
              setRating={setDeliveryRating}
              hoveredStar={hoveredDeliveryStar}
              setHoveredStar={setHoveredDeliveryStar}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
