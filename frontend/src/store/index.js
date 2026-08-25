import { configureStore } from '@reduxjs/toolkit';
import complaintReducer from './complaintSlice';
import chatReducer from './chatSlice';
import themeReducer from './themeSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    chat: chatReducer,
    theme: themeReducer,
    notifications: notificationReducer
  }
});
