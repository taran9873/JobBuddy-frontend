import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Application } from '@/store/applicationStore';

interface FollowUpSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedApplication: Application | null;
  followUpSettings: {
    interval: number;
    intervalType: 'days' | 'hours' | 'minutes';
    maxFollowUps: number;
  };
  setFollowUpSettings: React.Dispatch<React.SetStateAction<{
    interval: number;
    intervalType: 'days' | 'hours' | 'minutes';
    maxFollowUps: number;
  }>>;
  saveAutoFollowUpSettings: () => void;
}

const FollowUpSettingsDialog: React.FC<FollowUpSettingsDialogProps> = ({
  open,
  onOpenChange,
  selectedApplication,
  followUpSettings,
  setFollowUpSettings,
  saveAutoFollowUpSettings,
}) => {
  if (!selectedApplication) {
    return null;
  }

  const getIntervalLimits = () => {
    switch (followUpSettings.intervalType) {
      case 'minutes':
        return { min: 5, max: 1440 }; // 5 minutes to 24 hours
      case 'hours':
        return { min: 1, max: 72 }; // 1 hour to 3 days
      case 'days':
      default:
        return { min: 1, max: 30 }; // 1 day to 30 days
    }
  };

  const limits = getIntervalLimits();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Automated Follow-ups</DialogTitle>
          <DialogDescription>
            Schedule regular follow-up emails to be sent to {selectedApplication.recipient}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="followInterval">Follow-up every</Label>
            <div className="flex items-center gap-2">
              <Input
                id="followInterval"
                type="number"
                min={limits.min}
                max={limits.max}
                value={followUpSettings.interval}
                onChange={(e) => setFollowUpSettings({
                  ...followUpSettings,
                  interval: parseInt(e.target.value) || limits.min
                })}
                className="w-20"
              />
              <Select
                value={followUpSettings.intervalType}
                onValueChange={(value: 'days' | 'hours' | 'minutes') => {
                  // Adjust the interval value when changing types to keep it reasonable
                  let newInterval = followUpSettings.interval;
                  
                  if (value === 'minutes' && followUpSettings.intervalType === 'days') {
                    newInterval = Math.min(newInterval * 24 * 60, 1440); // Convert days to minutes, max 1440
                  } else if (value === 'minutes' && followUpSettings.intervalType === 'hours') {
                    newInterval = Math.min(newInterval * 60, 1440); // Convert hours to minutes, max 1440
                  } else if (value === 'hours' && followUpSettings.intervalType === 'days') {
                    newInterval = Math.min(newInterval * 24, 72); // Convert days to hours, max 72
                  } else if (value === 'hours' && followUpSettings.intervalType === 'minutes') {
                    newInterval = Math.max(Math.ceil(newInterval / 60), 1); // Convert minutes to hours, min 1
                  } else if (value === 'days' && followUpSettings.intervalType === 'hours') {
                    newInterval = Math.max(Math.ceil(newInterval / 24), 1); // Convert hours to days, min 1
                  } else if (value === 'days' && followUpSettings.intervalType === 'minutes') {
                    newInterval = Math.max(Math.ceil(newInterval / (24 * 60)), 1); // Convert minutes to days, min 1
                  }
                  
                  setFollowUpSettings({
                    ...followUpSettings,
                    interval: newInterval,
                    intervalType: value
                  });
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">minutes</SelectItem>
                  <SelectItem value="hours">hours</SelectItem>
                  <SelectItem value="days">days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {followUpSettings.intervalType === 'minutes' && 'Minimum 5 minutes, maximum 24 hours (1440 minutes)'}
              {followUpSettings.intervalType === 'hours' && 'Minimum 1 hour, maximum 3 days (72 hours)'}
              {followUpSettings.intervalType === 'days' && 'Minimum 1 day, maximum 30 days'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxFollowUps">Maximum follow-ups</Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxFollowUps"
                type="number"
                min={1}
                max={10}
                value={followUpSettings.maxFollowUps}
                onChange={(e) => setFollowUpSettings({
                  ...followUpSettings,
                  maxFollowUps: parseInt(e.target.value) || 5
                })}
                className="w-20"
              />
              <span>times</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={saveAutoFollowUpSettings}
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpSettingsDialog;
