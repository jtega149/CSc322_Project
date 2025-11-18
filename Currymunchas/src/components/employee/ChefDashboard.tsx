import { useState } from 'react';
import { ChefHat, TrendingUp, AlertCircle, DollarSign, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Chef, Dish } from '../../types';
import { mockDishes } from '../../lib/mockData';
import { formatCurrency, calculatePerformanceScore } from '../../lib/utils';
import { DishCard } from '../menu/DishCard';

interface ChefDashboardProps {
  chef: Chef;
}

export function ChefDashboard({ chef }: ChefDashboardProps) {
  const myDishes = mockDishes.filter(d => d.chefId === chef.id);
  const performanceScore = calculatePerformanceScore(
    chef.averageRating,
    chef.complaints.length,
    chef.compliments.length
  );

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
                <div className="text-2xl text-green-600">{chef.compliments.length}</div>
                <p className="text-xs text-muted-foreground">Compliments</p>
              </div>
              <div>
                <div className="text-2xl text-red-600">{chef.complaints.length}</div>
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
      <Tabs defaultValue="dishes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dishes">My Dishes</TabsTrigger>
          <TabsTrigger value="create">Create New Dish</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
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
              {myDishes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't created any dishes yet</p>
                  <Button className="mt-4">Create Your First Dish</Button>
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

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Dish</CardTitle>
              <CardDescription>
                Add a new dish to the menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Dish creation form would go here</p>
                <Button>Create Dish</Button>
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
                {chef.compliments.length === 0 && chef.complaints.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback yet</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="mb-4">Feedback will be displayed here</h3>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
