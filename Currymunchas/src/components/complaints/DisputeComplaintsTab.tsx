import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Star } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { getFeedbackForEmployee, disputeComplaint } from '../../userService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface DisputeComplaintsTabProps {
  userId: string;
}

export function DisputeComplaintsTab({ userId }: DisputeComplaintsTabProps) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputeReasons, setDisputeReasons] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadDisputes();
  }, [userId]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      // Get all complaints where this user is the target
      const feedbackRef = collection(db, 'feedback');
      const q = query(
        feedbackRef,
        where('targetId', '==', userId),
        where('sentiment', '==', 'complaint')
      );
      const querySnapshot = await getDocs(q);
      
      const complaints = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          disputeCreatedAt: data.disputeCreatedAt?.toDate ? data.disputeCreatedAt.toDate() : (data.disputeCreatedAt ? new Date(data.disputeCreatedAt) : undefined),
          managerDecisionAt: data.managerDecisionAt?.toDate ? data.managerDecisionAt.toDate() : (data.managerDecisionAt ? new Date(data.managerDecisionAt) : undefined)
        };
      });
      
      // Filter to only show complaints that can be disputed (not already disputed or resolved)
      const disputableComplaints = complaints.filter((d: any) => 
        !d.isDisputed &&
        !d.managerDecision
      );
      
      // Sort by creation date (newest first)
      disputableComplaints.sort((a: any, b: any) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setDisputes(disputableComplaints);
    } catch (error: any) {
      console.error('Error loading disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async (feedbackId: string) => {
    const reason = disputeReasons[feedbackId];
    if (!reason || !reason.trim()) {
      alert('Please provide a reason for disputing this complaint');
      return;
    }

    setIsSubmitting({ ...isSubmitting, [feedbackId]: true });
    try {
      await disputeComplaint(feedbackId, userId, reason);
      await loadDisputes();
      setDisputeReasons({ ...disputeReasons, [feedbackId]: '' });
      alert('Complaint disputed successfully. Manager will review your dispute.');
    } catch (error: any) {
      alert('Error disputing complaint: ' + error.message);
    } finally {
      setIsSubmitting({ ...isSubmitting, [feedbackId]: false });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading complaints...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (disputes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dispute Complaints</CardTitle>
          <CardDescription>
            Dispute complaints filed against you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No complaints to dispute at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Complaints</CardTitle>
        <CardDescription>
          Dispute complaints filed against you. Provide a reason and the manager will review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {disputes.map((complaint) => (
            <Card key={complaint.id} className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive">Complaint</Badge>
                      <span className="text-sm text-muted-foreground">
                        Order #{complaint.orderId?.slice(0, 8) || 'N/A'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                    <p className="font-semibold">
                      From {complaint.customerName}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= complaint.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm ml-2">Rating: {complaint.rating}/5</span>
                    </div>
                    {complaint.comment && (
                      <p className="text-sm mt-3 p-3 bg-red-50 rounded-md">{complaint.comment}</p>
                    )}
                  </div>

                  {!complaint.isDisputed ? (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label htmlFor={`dispute-reason-${complaint.id}`}>
                          Reason for Dispute
                        </Label>
                        <Textarea
                          id={`dispute-reason-${complaint.id}`}
                          placeholder="Explain why you believe this complaint is unfair or incorrect..."
                          value={disputeReasons[complaint.id] || ''}
                          onChange={(e) => setDisputeReasons({
                            ...disputeReasons,
                            [complaint.id]: e.target.value
                          })}
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDispute(complaint.id)}
                        disabled={isSubmitting[complaint.id]}
                      >
                        {isSubmitting[complaint.id] ? 'Submitting...' : 'Submit Dispute'}
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <Badge variant="secondary">
                        {complaint.managerDecision 
                          ? complaint.managerDecision === 'dismissed' 
                            ? 'Dispute Upheld - Complaint Dismissed' 
                            : 'Dispute Denied - Complaint Upheld'
                          : 'Dispute Pending Review'}
                      </Badge>
                      {complaint.disputeReason && (
                        <p className="text-sm mt-2 p-3 bg-blue-50 rounded-md">
                          <strong>Your dispute:</strong> {complaint.disputeReason}
                        </p>
                      )}
                      {complaint.managerDecisionReason && (
                        <p className="text-sm mt-2 p-3 bg-gray-50 rounded-md">
                          <strong>Manager's decision:</strong> {complaint.managerDecisionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

