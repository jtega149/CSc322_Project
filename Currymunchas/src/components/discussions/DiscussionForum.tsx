import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Heart, Pin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { getAllDiscussions, toggleDiscussionLike } from '../../userService';
import { formatDate } from '../../lib/utils';
import { CreateDiscussionPage } from './CreateDiscussionPage';
import { DiscussionDetailPage } from './DiscussionDetailPage';

interface Discussion {
  id: string;
  discussionId: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  authorId: string;
  authorName: string;
  authorRole: string;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  likedBy: string[];
  status: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastReplyAt?: Date;
  lastReplyBy?: string;
}

interface DiscussionForumProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
}

export function DiscussionForum({ 
  currentUserId,
  currentUserName,
  currentUserRole
}: DiscussionForumProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);

  useEffect(() => {
    loadDiscussions();
  }, []);

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const fetchedDiscussions = await getAllDiscussions();
      setDiscussions(fetchedDiscussions as Discussion[]);
    } catch (error: any) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (discussionId: string) => {
    try {
      await toggleDiscussionLike(discussionId, currentUserId);
      await loadDiscussions(); // Reload to get updated like count
    } catch (error: any) {
      console.error('Error toggling like:', error);
    }
  };

  const filteredDiscussions = selectedCategory === 'all' 
    ? discussions 
    : discussions.filter(d => d.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'chef': return '👨‍🍳';
      case 'dish': return '🍽️';
      case 'delivery': return '🚚';
      case 'food reviews': return '⭐';
      case 'delivery issues': return '⚠️';
      case 'vip member lounge': return '👑';
      default: return '💬';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show create page if requested
  if (showCreatePage) {
    return (
      <CreateDiscussionPage
        authorId={currentUserId}
        authorName={currentUserName}
        authorRole={currentUserRole}
        onBack={() => setShowCreatePage(false)}
        onSuccess={() => {
          setShowCreatePage(false);
          loadDiscussions();
        }}
      />
    );
  }

  // Show discussion detail page if requested
  if (selectedDiscussion) {
    return (
      <DiscussionDetailPage
        discussion={selectedDiscussion}
        onBack={() => setSelectedDiscussion(null)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
        onUpdate={loadDiscussions}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Discussion Forum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading discussions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
            <Button 
              onClick={() => setShowCreatePage(true)}
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Food Reviews">Food Reviews</TabsTrigger>
              <TabsTrigger value="Delivery Issues">Delivery</TabsTrigger>
              <TabsTrigger value="VIP Member Lounge">VIP</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              <div className="space-y-4">
                {filteredDiscussions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No discussions yet. Be the first to start one!</p>
                  </div>
                ) : (
                  filteredDiscussions.map(discussion => {
                    const isLiked = discussion.likedBy?.includes(currentUserId) || false;
                    
                    return (
                      <Card 
                        key={discussion.id}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${discussion.isPinned ? 'border-l-4 border-l-amber-500' : ''}`}
                        onClick={() => setSelectedDiscussion(discussion)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {discussion.isPinned && (
                                  <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                                )}
                                <span className="text-xl">{getCategoryIcon(discussion.category)}</span>
                                <Badge variant="outline">{discussion.category}</Badge>
                                <Badge className={getStatusColor(discussion.status)}>
                                  {discussion.status}
                                </Badge>
                                {discussion.isResolved && (
                                  <Badge className="bg-blue-100 text-blue-800">Resolved</Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg">{discussion.title}</CardTitle>
                              <CardDescription className="mt-2">
                                {discussion.content.length > 150 
                                  ? `${discussion.content.substring(0, 150)}...` 
                                  : discussion.content}
                              </CardDescription>
                              {discussion.tags && discussion.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {discussion.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>By {discussion.authorName} ({discussion.authorRole})</span>
                              <span>•</span>
                              <span>{formatDate(discussion.createdAt)}</span>
                              <span>•</span>
                              <span>{discussion.replyCount} replies</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(discussion.id);
                              }}
                              className={isLiked ? 'text-red-600' : ''}
                            >
                              <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-red-600' : ''}`} />
                              {discussion.likeCount}
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
