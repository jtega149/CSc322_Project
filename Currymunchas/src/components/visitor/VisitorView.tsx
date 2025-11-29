import { useState, useEffect } from 'react';
import { Store, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MenuGrid } from '../menu/MenuGrid';
import { AIChat } from '../chat/AIChat';
import { LoginForm } from '../auth/LoginForm';
import { RegistrationForm } from '../auth/RegistrationForm';
import { mockDishes, mockChefs } from '../../lib/mockData';
import { getMostPopularDishes, getTopRatedDishes } from '../../lib/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getAllDishes, getPublicChefs } from '../../userService';
import { Dish, Chef } from '../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function VisitorView() {
  const [showAuth, setShowAuth] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [chefsLoading, setChefsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load dishes
        setDishesLoading(true);
        const fetchedDishes = await getAllDishes();
        setDishes(fetchedDishes as Dish[]);
      } catch (error: any) {
        console.error('Error loading dishes:', error);
        // Fallback to mock data if Firestore access fails
        setDishes(mockDishes);
      } finally {
        setDishesLoading(false);
      }

      try {
        // Load chefs
        setChefsLoading(true);
        const fetchedChefs = await getPublicChefs();
        
        // Get dish count for each chef
        const chefsWithDishCount = await Promise.all(
          fetchedChefs.map(async (chef) => {
            try {
              const dishesRef = collection(db, 'dishes');
              const q = query(dishesRef, where('chefId', '==', chef.id));
              const dishesSnapshot = await getDocs(q);
              const dishCount = dishesSnapshot.size;
              return {
                ...chef,
                dishCount: dishCount // Store actual count
              };
            } catch (err) {
              // If we can't get dish count, use existing dishes array length
              return {
                ...chef,
                dishCount: Array.isArray(chef.dishes) ? chef.dishes.length : 0
              };
            }
          })
        );
        
        setChefs(chefsWithDishCount as Chef[]);
      } catch (error: any) {
        console.error('Error loading chefs:', error);
        // Fallback to mock data if Firestore access fails
        setChefs(mockChefs);
      } finally {
        setChefsLoading(false);
      }
    };

    loadData();
  }, []);

  // Get top rated chefs (sorted by average rating)
  const topChefs = chefs.length > 0 
    ? [...chefs].sort((a, b) => b.averageRating - a.averageRating).slice(0, 3)
    : mockChefs.slice(0, 3);

  // Get most popular and top rated dishes
  const popularDishes = dishes.length > 0 
    ? getMostPopularDishes(dishes, 3)
    : getMostPopularDishes(mockDishes, 3);
  
  const topRatedDishes = dishes.length > 0
    ? getTopRatedDishes(dishes, 3)
    : getTopRatedDishes(mockDishes, 3);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Store className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-4xl">Welcome to AI Restaurant</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience fine dining with AI-powered ordering and personalized recommendations. 
              Browse our menu, chat with our AI assistant, and register to start ordering.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Featured Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Popular Dishes */}
        <Card>
          <CardHeader>
            <CardTitle>🔥 Most Popular Dishes</CardTitle>
            <CardDescription>
              Fan favorites ordered by our customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dishesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading dishes...</p>
              </div>
            ) : popularDishes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No dishes available at the moment.</p>
              </div>
            ) : (
              popularDishes.map(dish => (
              <div key={dish.id} className="flex gap-4 p-3 border rounded-lg hover:bg-muted/50">
                <ImageWithFallback 
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3>{dish.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {dish.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">⭐ {dish.averageRating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({dish.orderCount} orders)
                    </span>
                  </div>
                </div>
                <div className="text-lg">
                  ${dish.price.toFixed(2)}
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Rated Chefs */}
        <Card>
          <CardHeader>
            <CardTitle>👨‍🍳 Top Rated Chefs</CardTitle>
            <CardDescription>
              Meet our talented culinary team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chefsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading chefs...</p>
              </div>
            ) : topChefs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No chefs available at the moment.</p>
              </div>
            ) : (
              topChefs.map(chef => (
              <div key={chef.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                  👨‍🍳
                </div>
                <div className="flex-1">
                  <h3>{chef.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {chef.specialties.join(', ')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">⭐ {chef.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(chef as any).dishCount ?? (Array.isArray(chef.dishes) ? chef.dishes.length : 0)} dishes)
                    </span>
                  </div>
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="menu" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="menu">Browse Menu</TabsTrigger>
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle>Our Menu</CardTitle>
              <CardDescription>
                Browse our full menu. Register to start ordering!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MenuGrid dishes={dishes.length > 0 ? dishes : mockDishes} isVIP={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <div className="max-w-2xl mx-auto">
            <AIChat />
          </div>
        </TabsContent>

        <TabsContent value="register">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl mb-4">Existing Customer?</h2>
                <LoginForm />
              </div>
              <div>
                <h2 className="text-2xl mb-4">New Customer?</h2>
                <RegistrationForm />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}