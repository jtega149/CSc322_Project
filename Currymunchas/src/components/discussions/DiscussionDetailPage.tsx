import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageSquare, Pin, CheckCircle, Flag } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { getDiscussionReplies, addReplyToDiscussion, toggleDiscussionLike } from '../../userService';
import { formatDate } from '../../lib/utils';
import { ReportCommentPage } from './ReportCommentPage';
import { ReportDiscussionPage } from './ReportDiscussionPage';

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

interface DiscussionDetailPageProps {
  discussion: Discussion;
  onBack: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onUpdate: () => void;
}

export function DiscussionDetailPage({
  discussion,
  onBack,
  currentUserId,
  currentUserName,
  currentUserRole,
  onUpdate
}: DiscussionDetailPageProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(discussion.likedBy?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(discussion.likeCount);
  const [reportingReply, setReportingReply] = useState<Reply | null>(null);
  const [reportingDiscussion, setReportingDiscussion] = useState(false);

  useEffect(() => {
    loadReplies();
    setIsLiked(discussion.likedBy?.includes(currentUserId) || false);
    setLikeCount(discussion.likeCount);
  }, [discussion.id]);

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
      const newLikedState = !isLiked;
      await toggleDiscussionLike(discussion.id, currentUserId);
      setIsLiked(newLikedState);
      setLikeCount(newLikedState ? likeCount + 1 : likeCount - 1);
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

  // Show report page if discussion is being reported
  if (reportingDiscussion) {
    return (
      <ReportDiscussionPage
        discussionId={discussion.id}
        discussionTitle={discussion.title}
        discussionContent={discussion.content}
        authorId={discussion.authorId}
        authorName={discussion.authorName}
        authorRole={discussion.authorRole}
        reporterId={currentUserId}
        reporterName={currentUserName}
        onBack={() => setReportingDiscussion(false)}
        onSuccess={() => {
          setReportingDiscussion(false);
          onUpdate();
        }}
      />
    );
  }

  // Show report page if a reply is being reported
  if (reportingReply) {
    return (
      <ReportCommentPage
        discussionId={discussion.id}
        discussionTitle={discussion.title}
        replyId={reportingReply.id}
        replyContent={reportingReply.content}
        commenterId={reportingReply.authorId}
        commenterName={reportingReply.authorName}
        commenterRole={reportingReply.authorRole}
        reporterId={currentUserId}
        reporterName={currentUserName}
        onBack={() => setReportingReply(null)}
        onSuccess={() => {
          setReportingReply(null);
          loadReplies();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Discussions
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {discussion.isPinned && (
                  <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                )}
                <Badge variant="outline">{discussion.category}</Badge>
                <Badge className={discussion.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {discussion.status}
                </Badge>
                {discussion.isResolved && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">{discussion.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <span>By {discussion.authorName}</span>
                  <Badge className={getRoleBadgeColor(discussion.authorRole)}>
                    {discussion.authorRole}
                  </Badge>
                  <span>•</span>
                  <span>{formatDate(discussion.createdAt)}</span>
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Discussion Content */}
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-base">{discussion.content}</p>
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

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? 'text-red-600' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-red-600' : ''}`} />
                  {likeCount} likes
                </Button>
                <span className="text-sm text-muted-foreground">
                  {discussion.replyCount} replies
                </span>
              </div>
              {discussion.authorId !== currentUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportingDiscussion(true)}
                  className="text-xs hover:text-red-600 hover:border-red-300"
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Report Discussion
                </Button>
              )}
            </div>
          </div>

          {/* Replies Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Replies ({replies.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading replies...</p>
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No replies yet. Be the first to reply!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <Card
                    key={reply.id}
                    className={reply.isAcceptedAnswer ? 'bg-green-50 border-green-200' : ''}
                  >
                    <CardContent className="pt-6">
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap mb-3">{reply.content}</p>
                      {reply.authorId !== currentUserId && (
                        <div className="flex justify-end pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportingReply(reply)}
                            className="text-xs hover:text-red-600 hover:border-red-300"
                          >
                            <Flag className="w-4 h-4 mr-1" />
                            Report Comment
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Reply Form */}
          <div className="border-t pt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}

