import { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Pin, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { getDiscussionReplies, addReplyToDiscussion, toggleDiscussionLike } from '../../userService';
import { formatDate } from '../../lib/utils';

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

interface Reply {
  id: string;
  replyId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  likeCount: number;
  isAcceptedAnswer: boolean;
  createdAt: Date;
}

interface DiscussionDetailDialogProps {
  discussion: Discussion;
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onUpdate: () => void;
}

export function DiscussionDetailDialog({
  discussion,
  open,
  onClose,
  currentUserId,
  currentUserName,
  currentUserRole,
  onUpdate
}: DiscussionDetailDialogProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(discussion.likedBy?.includes(currentUserId) || false);

  useEffect(() => {
    if (open) {
      loadReplies();
      setIsLiked(discussion.likedBy?.includes(currentUserId) || false);
    }
  }, [open, discussion.id]);

  const loadReplies = async () => {
    try {
      setLoading(true);
      const fetchedReplies = await getDiscussionReplies(discussion.id);
      setReplies(fetchedReplies as Reply[]);
    } catch (error: any) {
      console.error('Error loading replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addReplyToDiscussion(
        discussion.id,
        currentUserId,
        currentUserName,
        currentUserRole,
        replyContent.trim()
      );
      setReplyContent('');
      await loadReplies();
      onUpdate(); // Refresh discussion list
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      await toggleDiscussionLike(discussion.id, currentUserId);
      setIsLiked(!isLiked);
      onUpdate(); // Refresh discussion list
    } catch (error: any) {
      console.error('Error toggling like:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'chef': return 'bg-orange-100 text-orange-800';
      case 'vip': return 'bg-amber-100 text-amber-800';
      case 'customer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {discussion.isPinned && (
                  <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                )}
                <Badge variant="outline">{discussion.category}</Badge>
                {discussion.isResolved && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl">{discussion.title}</DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-2">
                  <span>By {discussion.authorName}</span>
                  <Badge className={getRoleBadgeColor(discussion.authorRole)}>
                    {discussion.authorRole}
                  </Badge>
                  <span>•</span>
                  <span>{formatDate(discussion.createdAt)}</span>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Main Discussion Content */}
            <div className="space-y-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{discussion.content}</p>
              </div>
              
              {discussion.tags && discussion.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {discussion.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? 'text-red-600' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-red-600' : ''}`} />
                  {discussion.likeCount} likes
                </Button>
                <span className="text-sm text-muted-foreground">
                  {discussion.replyCount} replies
                </span>
              </div>
            </div>

            {/* Replies Section */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Replies ({replies.length})
              </h3>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading replies...</p>
                </div>
              ) : replies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No replies yet. Be the first to reply!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg border ${
                        reply.isAcceptedAnswer ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{reply.authorName}</span>
                          <Badge className={getRoleBadgeColor(reply.authorRole)}>
                            {reply.authorRole}
                          </Badge>
                          {reply.isAcceptedAnswer && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accepted Answer
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Form */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add a Reply</h4>
              <form onSubmit={handleSubmitReply} className="space-y-3">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !replyContent.trim()}>
                    {isSubmitting ? 'Submitting...' : 'Post Reply'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

