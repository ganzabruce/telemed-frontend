import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMyAvailability, setAvailability, deleteAvailabilitySlot, type AvailabilitySlot } from '../../api/availabilityApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
] as const;

const AvailabilityPage = () => {
  const [availability, setAvailabilityState] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 'MONDAY' as const,
    startTime: '09:00',
    endTime: '17:00',
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const data = await getMyAvailability();
      setAvailabilityState(data);
    } catch (error: any) {
      console.error('Error fetching availability:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    // Validate time
    const [startHour, startMin] = newSlot.startTime.split(':').map(Number);
    const [endHour, endMin] = newSlot.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast.error('Start time must be before end time');
      return;
    }

    // Check for duplicates
    const duplicate = availability.find(
      (slot) =>
        slot.dayOfWeek === newSlot.dayOfWeek &&
        slot.startTime === newSlot.startTime &&
        slot.endTime === newSlot.endTime
    );

    if (duplicate) {
      toast.error('This availability slot already exists');
      return;
    }

    // Add to local state (will be saved when user clicks Save)
    setAvailabilityState([
      ...availability,
      {
        id: `temp-${Date.now()}`,
        ...newSlot,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Reset form
    setNewSlot({
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '17:00',
    });

    toast.success('Availability slot added. Click Save to save changes.');
  };

  const handleDeleteSlot = async (slotId: string) => {
    // If it's a temporary slot (starts with 'temp-'), just remove from local state
    if (slotId.startsWith('temp-')) {
      setAvailabilityState(availability.filter((slot) => slot.id !== slotId));
      return;
    }

    try {
      await deleteAvailabilitySlot(slotId);
      setAvailabilityState(availability.filter((slot) => slot.id !== slotId));
      toast.success('Availability slot deleted');
    } catch (error: any) {
      console.error('Error deleting availability slot:', error);
      toast.error(error.response?.data?.message || 'Failed to delete availability slot');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Filter out temporary slots and prepare data
      const slotsToSave = availability
        .filter((slot) => !slot.id.startsWith('temp-'))
        .map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));

      // Add temporary slots
      const tempSlots = availability
        .filter((slot) => slot.id.startsWith('temp-'))
        .map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));

      const allSlots = [...slotsToSave, ...tempSlots];

      await setAvailability(allSlots);
      toast.success('Availability saved successfully');
      await fetchAvailability(); // Refresh to get the saved data with proper IDs
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast.error(error.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const groupedAvailability = DAYS_OF_WEEK.map((day) => ({
    day,
    slots: availability.filter((slot) => slot.dayOfWeek === day.value),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
          <p className="text-gray-600 mt-2">
            Set your available days and times. Patients can only book appointments during these hours.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Add New Slot */}
      <Card>
        <CardHeader>
          <CardTitle>Add Availability Slot</CardTitle>
          <CardDescription>Add a new time slot when you're available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select
                value={newSlot.dayOfWeek}
                onValueChange={(value: any) => setNewSlot({ ...newSlot, dayOfWeek: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddSlot} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Add Slot
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Current Availability</CardTitle>
          <CardDescription>Your scheduled availability slots</CardDescription>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No availability slots set</p>
              <p className="text-gray-400 text-sm mt-1">
                Add availability slots above to allow patients to book appointments with you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedAvailability.map(({ day, slots }) => {
                if (slots.length === 0) return null;
                return (
                  <div key={day.value} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{day.label}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      {availability.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">Important Information</p>
            <p className="text-sm text-blue-700 mt-1">
              Patients can only book appointments during your available time slots. If you don't set any availability,
              patients can book appointments at any time (backward compatibility). Make sure to click "Save Changes" to
              apply your updates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;

