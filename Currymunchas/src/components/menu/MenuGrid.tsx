import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DishCard } from './DishCard';
import { Dish } from '../../types';

interface MenuGridProps {
  dishes: Dish[];
  isVIP?: boolean;
  onAddToCart?: (dish: Dish) => void;
}

export function MenuGrid({ dishes, isVIP = false, onAddToCart }: MenuGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price'>('popular');

  // Get unique categories
  const categories = ['all', ...new Set(dishes.map(d => d.category))];

  // Filter dishes
  let filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || dish.category === categoryFilter;
    const isAccessible = !dish.isVIPOnly || isVIP;
    
    return matchesSearch && matchesCategory && isAccessible;
  });

  // Sort dishes
  filteredDishes = [...filteredDishes].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.orderCount - a.orderCount;
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'price':
        return a.price - b.price;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price">Price (Low to High)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDishes.map(dish => (
          <DishCard
            key={dish.id}
            dish={dish}
            isVIP={isVIP}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No dishes found matching your criteria.
        </div>
      )}
    </div>
  );
}
