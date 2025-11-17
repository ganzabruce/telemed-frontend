import { api } from "./client";

export interface CallRoomInfo {
  id: string;
  occupants: number;
  createdAt: string;
}

/**
 * Create a call room for a confirmed appointment
 */
export const createCallRoom = async (
  appointmentId: string
): Promise<{ roomId: string }> => {
  const response = await api.post("/calls/create", { appointmentId });
  // Backend returns { success: true, roomId }
  return { roomId: response.data.roomId };
};

/**
 * Get information about an existing call room
 */
export const getCallRoomInfo = async (
  roomId: string
): Promise<CallRoomInfo> => {
  const response = await api.get(`/calls/${roomId}`);
  return response.data.data;
};

