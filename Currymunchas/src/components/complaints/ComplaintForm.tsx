import { useState } from 'react';
import { AlertCircle, ThumbsUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ComplaintType, ComplaintTarget } from '../../types';

interface ComplaintFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (type: ComplaintType, targetId: string, targetType: ComplaintTarget, reason: string) => void;
  targetId: string;
  targetType: ComplaintTarget;
  targetName: string;
}

export function ComplaintForm({ 
  open, 
  onClose, 
  onSubmit, 
  targetId,
  targetType,
  targetName 
}: ComplaintFormProps) {
  const [type, setType] = useState<ComplaintType>('complaint');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    onSubmit(type, targetId, targetType, reason);
    
    // Reset form
    setType('complaint');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'complaint' ? 'File Complaint' : 'Submit Compliment'}
          </DialogTitle>
          <DialogDescription>
            Regarding {targetType}: {targetName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as ComplaintType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="complaint" id="complaint" />
                <Label htmlFor="complaint" className="flex items-center gap-2 cursor-pointer">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Complaint
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compliment" id="compliment" />
                <Label htmlFor="compliment" className="flex items-center gap-2 cursor-pointer">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  Compliment
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              {type === 'complaint' ? 'What went wrong?' : 'What did they do well?'}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                type === 'complaint' 
                  ? 'Please describe the issue...' 
                  : 'Please describe what you appreciated...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={6}
            />
          </div>

          {type === 'complaint' && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              Note: Complaints are reviewed by the manager. The {targetType} will have the right to dispute. 
              False complaints may result in warnings to your account.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit {type === 'complaint' ? 'Complaint' : 'Compliment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
