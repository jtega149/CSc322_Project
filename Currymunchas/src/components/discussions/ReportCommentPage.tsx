import { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { submitCommentComplaint } from '../../userService';

interface ReportCommentPageProps {
  discussionId: string;
  discussionTitle: string;
  replyId: string;
  replyContent: string;
  commenterId: string;
  commenterName: string;
  commenterRole: string;
  reporterId: string;
  reporterName: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ReportCommentPage({
  discussionId,
  discussionTitle,
  replyId,
  replyContent,
  commenterId,
  commenterName,
  commenterRole,
  reporterId,
  reporterName,
  onBack,
  onSuccess
}: ReportCommentPageProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please provide a reason for filing this complaint.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please provide a more detailed explanation (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCommentComplaint(
        discussionId,
        discussionTitle,
        replyId,
        replyContent,
        commenterId,
        commenterName,
        commenterRole,
        reporterId,
        reporterName,
        reason.trim()
      );
      
      alert('Complaint filed successfully. It will be reviewed by a manager.');
      onSuccess();
    } catch (error: any) {
      console.error('Error filing complaint:', error);
      setError(error.message || 'Failed to file complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Discussion
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Report Comment
          </CardTitle>
          <CardDescription>
            File a complaint about a comment in the discussion forum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Comment Information */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="text-sm font-medium">Discussion:</div>
              <div className="text-sm">{discussionTitle}</div>
              
              <div className="text-sm font-medium mt-4">Reported Comment:</div>
              <div className="text-sm bg-background p-3 rounded border">
                {replyContent}
              </div>
              
              <div className="text-sm font-medium mt-4">Commenter:</div>
              <div className="text-sm">{commenterName} ({commenterRole})</div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Why are you filing this complaint? *
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you believe this comment violates community guidelines or is inappropriate..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required. Be specific about what makes this comment inappropriate.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Complaints are reviewed by managers. The commenter will have the right to dispute your complaint. 
                  If your complaint is found to be without merit, you will receive a warning. False complaints may result in account restrictions.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting || !reason.trim() || reason.trim().length < 10}
                >
                  {isSubmitting ? 'Submitting...' : 'File Complaint'}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

