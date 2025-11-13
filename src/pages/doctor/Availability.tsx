import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, AlertCircle, Copy, Check } from 'lucide-react';
import {
  getMyAvailability,
  addAvailabilitySlot,
  deleteAvailabilitySlot,
  type AvailabilitySlot,
} from '@/api/availabilityApi';
import { toast } from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday', short: 'Mon' },
  { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { value: 'SUNDAY', label: 'Sunday', short: 'Sun' },
];

const AvailabilityPage = () => {
  const [availability, setAvailabilityState] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedDay, setCopiedDay] = useState<{ dayValue: AvailabilitySlot['dayOfWeek']; slots: AvailabilitySlot[] } | null>(null);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 'MONDAY' as AvailabilitySlot['dayOfWeek'],
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
      const errorMessage = error.response?.data?.message || 'Failed to fetch availability';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
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

    try {
      // Add slot directly to backend
      const addedSlot = await addAvailabilitySlot(newSlot);
      
      // Update state with the new slot from backend
      setAvailabilityState([...availability, addedSlot]);
      
      setNewSlot({
        dayOfWeek: 'MONDAY' as AvailabilitySlot['dayOfWeek'],
        startTime: '09:00',
        endTime: '17:00',
      });
      
      toast.success('Slot added successfully');
    } catch (error: any) {
      console.error('Error adding slot:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add slot';
      toast.error(errorMessage);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteAvailabilitySlot(slotId);
      setAvailabilityState(availability.filter((slot) => slot.id !== slotId));
      toast.success('Slot deleted successfully');
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete slot';
      toast.error(errorMessage);
    }
  };


  const copyDaySlots = (dayValue: AvailabilitySlot['dayOfWeek']) => {
    const slots = availability.filter(slot => slot.dayOfWeek === dayValue);
    setCopiedDay({ dayValue, slots });
    toast.success(`Copied ${slots.length} slot(s) from ${DAYS_OF_WEEK.find(d => d.value === dayValue)?.label}`);
  };

  const pasteDaySlots = async (targetDay: AvailabilitySlot['dayOfWeek']) => {
    if (!copiedDay) return;
    
    try {
      // Add each slot individually to the backend
      // Use Promise.allSettled to handle partial failures (e.g., duplicates)
      const results = await Promise.allSettled(
        copiedDay.slots.map(slot =>
          addAvailabilitySlot({
            dayOfWeek: targetDay,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })
        )
      );

      const newSlots: AvailabilitySlot[] = [];
      let failureCount = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newSlots.push(result.value);
        } else {
          failureCount++;
          console.error('Failed to add slot:', result.reason);
        }
      });

      // Update state with successfully added slots
      if (newSlots.length > 0) {
        setAvailabilityState([...availability, ...newSlots]);
        if (failureCount === 0) {
          toast.success(`Pasted ${newSlots.length} slot(s) to ${DAYS_OF_WEEK.find(d => d.value === targetDay)?.label}`);
          setCopiedDay(null); // Clear copied slots after successful paste
        } else {
          toast.success(`Pasted ${newSlots.length} slot(s). ${failureCount} slot(s) could not be added (may be duplicates).`);
        }
      } else {
        toast.error(`Failed to paste slots. They may already exist for ${DAYS_OF_WEEK.find(d => d.value === targetDay)?.label}.`);
      }
    } catch (error: any) {
      console.error('Error pasting slots:', error);
      const errorMessage = error.response?.data?.message || 'Failed to paste slots';
      toast.error(errorMessage);
    }
  };

  const groupedAvailability = DAYS_OF_WEEK.map((day) => ({
    day,
    slots: availability
      .filter((slot) => slot.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const totalSlots = availability.length;
  const totalHours = availability.reduce((sum, slot) => {
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    return sum + ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
          </div>
          <p className="text-gray-500">Manage when patients can book appointments with you</p>
          
          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Total Slots</p>
              <p className="text-2xl font-bold text-blue-500">{totalSlots}</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Hours/Week</p>
              <p className="text-2xl font-bold text-blue-500">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Add Slot Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Time Slot</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
              <select
                value={newSlot.dayOfWeek}
                onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value as AvailabilitySlot['dayOfWeek'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddSlot}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
          </div>
          
          {availability.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-1">No availability set</p>
              <p className="text-gray-400 text-sm">Add time slots above to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groupedAvailability.map(({ day, slots }) => (
                <div key={day.value} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-blue-500 font-semibold text-sm">{day.short}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{day.label}</h3>
                        <p className="text-sm text-gray-500">
                          {slots.length === 0 ? 'No slots' : `${slots.length} slot${slots.length > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    
                    {slots.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyDaySlots(day.value as AvailabilitySlot['dayOfWeek'])}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Copy slots"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {copiedDay && copiedDay.dayValue !== day.value && (
                          <button
                            onClick={() => pasteDaySlots(day.value as AvailabilitySlot['dayOfWeek'])}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Paste slots"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {slots.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="group flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-900 text-sm">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {slots.length === 0 && copiedDay && (
                    <button
                      onClick={() => pasteDaySlots(day.value as AvailabilitySlot['dayOfWeek'])}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                    >
                      Paste copied slots
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Important</p>
            <p className="text-sm text-blue-700">
              Patients can only book appointments during your available time slots.
              {availability.length === 0 && ' Add time slots above to allow patients to book appointments with you.'}
              {availability.length > 0 && ' Changes are saved automatically when you add or delete slots.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;