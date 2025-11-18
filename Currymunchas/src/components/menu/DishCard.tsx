import { Star, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dish } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface DishCardProps {
  dish: Dish;
  isVIP?: boolean;
  onAddToCart?: (dish: Dish) => void;
  showChef?: boolean;
}

export function DishCard({ dish, isVIP = false, onAddToCart, showChef = false }: DishCardProps) {
  const canOrder = !dish.isVIPOnly || isVIP;

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video overflow-hidden">
        <ImageWithFallback
          src={dish.imageUrl}
          alt={dish.name}
          className="w-full h-full object-cover"
        />
        {dish.isVIPOnly && (
          <Badge className="absolute top-2 right-2 bg-amber-500">
            <Crown className="w-3 h-3 mr-1" />
            VIP Only
          </Badge>
        )}
        {!dish.isAvailable && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            Unavailable
          </Badge>
        )}
      </div>

      <CardHeader>
        <CardTitle>{dish.name}</CardTitle>
        <CardDescription>{dish.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1">{dish.averageRating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground text-sm">
              ({dish.orderCount} orders)
            </span>
          </div>

          <div>
            <Badge variant="outline">{dish.category}</Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <span className="text-lg">{formatCurrency(dish.price)}</span>
        {onAddToCart && canOrder && dish.isAvailable && (
          <Button onClick={() => onAddToCart(dish)} size="sm">
            Add to Cart
          </Button>
        )}
        {!canOrder && (
          <Badge variant="secondary">VIP Required</Badge>
        )}
      </CardFooter>
    </Card>
  );
}
