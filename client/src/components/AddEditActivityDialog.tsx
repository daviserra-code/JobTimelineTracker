import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Activity, ActivityType, ActivityStatus } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, REGIONS } from '@/lib/constants';

interface AddEditActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity;
}

// Form schema for improved type safety
const activitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.enum(['project', 'meeting', 'training', 'holiday'] as const),
  status: z.enum(['confirmed', 'tentative', 'hypothetical'] as const),
  category: z.string().optional(),
  location: z.string().optional(),
  notificationEnabled: z.boolean().default(false),
  notificationDate: z.string().optional(),
  region: z.string().optional()
}).refine(
  (data) => {
    // If notifications are enabled, make sure there's a date
    if (data.notificationEnabled && !data.notificationDate) {
      return false;
    }
    return true;
  },
  {
    message: "Notification date is required when notifications are enabled",
    path: ["notificationDate"]
  }
);

type FormValues = z.infer<typeof activitySchema>;

const AddEditActivityDialog = ({ 
  isOpen, 
  onClose, 
  activity 
}: AddEditActivityDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!activity;
  
  // Default values for the form
  const defaultValues: FormValues = {
    title: activity?.title || '',
    description: activity?.description || '',
    startDate: activity?.startDate ? format(new Date(activity.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: activity?.endDate ? format(new Date(activity.endDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    type: (activity?.type as ActivityType) || 'meeting',
    status: (activity?.status as ActivityStatus) || 'confirmed',
    category: activity?.category || '',
    location: activity?.location || '',
    notificationEnabled: false,
    notificationDate: '',
    region: activity?.region || ''
  };
  
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues
  });
  
  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert dates to Date objects
      const payload = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        notificationDate: data.notificationEnabled && data.notificationDate 
          ? new Date(data.notificationDate) 
          : undefined
      };
      
      const response = await apiRequest('POST', '/api/activities', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: 'Activity created',
        description: 'Your activity has been created successfully',
        variant: 'default',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create activity',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });
  
  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!activity) throw new Error('No activity to update');
      
      // Convert dates to Date objects
      const payload = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        notificationDate: data.notificationEnabled && data.notificationDate 
          ? new Date(data.notificationDate) 
          : undefined
      };
      
      const response = await apiRequest('PUT', `/api/activities/${activity.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: 'Activity updated',
        description: 'Your activity has been updated successfully',
        variant: 'default',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to update activity',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });
  
  // Form submission
  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateActivityMutation.mutate(data);
    } else {
      createActivityMutation.mutate(data);
    }
  };
  
  // Show notification date field only when notificationEnabled is true
  const watchNotificationEnabled = form.watch('notificationEnabled');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter activity description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ACTIVITY_TYPES).map(([type, { label, color }]) => (
                        <SelectItem key={type} value={type} className="flex items-center">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Status*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ACTIVITY_STATUSES).map(([status, { label, color }]) => (
                        <SelectItem key={status} value={status} className="flex items-center">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notificationEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Notification</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {watchNotificationEnabled && (
              <FormField
                control={form.control}
                name="notificationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(REGIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
              >
                {(createActivityMutation.isPending || updateActivityMutation.isPending) ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Saving...
                  </>
                ) : (
                  isEditing ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditActivityDialog;
