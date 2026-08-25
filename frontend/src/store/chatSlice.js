import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [
      {
        id: '1',
        sender: 'bot',
        text: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    isLoading: false,
    extractionProgress: 0,
    isExtracting: false,
    activeTab: 'file', // 'file' | 'paste'
    pasteText: ''
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...action.payload
      });
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setExtractionProgress: (state, action) => {
      state.extractionProgress = action.payload;
    },
    setIsExtracting: (state, action) => {
      state.isExtracting = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setPasteText: (state, action) => {
      state.pasteText = action.payload;
    },
    clearChat: (state) => {
      state.messages = [
        {
          id: '1',
          sender: 'bot',
          text: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    }
  }
});

export const {
  addMessage,
  setIsLoading,
  setExtractionProgress,
  setIsExtracting,
  setActiveTab,
  setPasteText,
  clearChat
} = chatSlice.actions;

export default chatSlice.reducer;
