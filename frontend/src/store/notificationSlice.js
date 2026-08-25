import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [
      {
        id: 'init-1',
        title: 'System Ready',
        message: 'AIVOA QMS Customer Complaint Assistant online & ready.',
        type: 'info',
        read: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    isPopoverOpen: false
  },
  reducers: {
    addNotification: (state, action) => {
      const { title, message, type = 'info' } = action.payload;
      state.items.unshift({
        id: Date.now().toString(),
        title,
        message,
        type,
        read: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    },
    markAllAsRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
    },
    clearNotifications: (state) => {
      state.items = [];
    },
    togglePopover: (state) => {
      state.isPopoverOpen = !state.isPopoverOpen;
    },
    closePopover: (state) => {
      state.isPopoverOpen = false;
    }
  }
});

export const {
  addNotification,
  markAllAsRead,
  clearNotifications,
  togglePopover,
  closePopover
} = notificationSlice.actions;

export default notificationSlice.reducer;
