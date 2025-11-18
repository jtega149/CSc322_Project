import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { DiscussionTopic } from '../../types';
import { formatDate } from '../../lib/utils';

interface DiscussionForumProps {
  topics: DiscussionTopic[];
  currentUserId: string;
  onCreateTopic: () => void;
  onViewTopic: (topicId: string) => void;
}

export function DiscussionForum({ 
  topics, 
  currentUserId,
  onCreateTopic,
  onViewTopic 
}: DiscussionForumProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTopics = selectedCategory === 'all' 
    ? topics 
    : topics.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chef': return '👨‍🍳';
      case 'dish': return '🍽️';
      case 'delivery': return '🚚';
      default: return '💬';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Discussion Forum
            </CardTitle>
            <CardDescription>
              Share your thoughts and experiences with the community
            </CardDescription>
          </div>
          <Button onClick={onCreateTopic}>
            <Plus className="w-4 h-4 mr-2" />
            New Topic
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="chef">Chefs</TabsTrigger>
            <TabsTrigger value="dish">Dishes</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <div className="space-y-4">
              {filteredTopics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No topics yet. Be the first to start a discussion!</p>
                </div>
              ) : (
                filteredTopics.map(topic => (
                  <Card 
                    key={topic.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onViewTopic(topic.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{getCategoryIcon(topic.category)}</span>
                            <Badge variant="outline">{topic.category}</Badge>
                          </div>
                          <CardTitle className="text-lg">{topic.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {topic.content.length > 150 
                              ? `${topic.content.substring(0, 150)}...` 
                              : topic.content}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                        <span>{formatDate(topic.createdAt)}</span>
                        <span>•</span>
                        <span>{topic.posts.length} replies</span>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
