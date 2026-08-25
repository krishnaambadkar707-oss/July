import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Header from './components/Header';
import ComplaintForm from './components/ComplaintForm';
import AICopilotPanel from './components/AICopilotPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AnalyticsModal from './components/AnalyticsModal';
import SavedComplaintsModal from './components/SavedComplaintsModal';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import { setSavedComplaints, resetForm } from './store/complaintSlice';
import { addMessage } from './store/chatSlice';
import { addNotification } from './store/notificationSlice';
import { getApiUrl } from './config/api';

export default function App() {
  const dispatch = useDispatch();
  const { form, riskAssessment, savedComplaints } = useSelector((state) => state.complaint);
  const { mode } = useSelector((state) => state.theme);

  const [activeMainView, setActiveMainView] = useState('intake'); // 'intake' | 'analytics'
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Saved Complaints from FastAPI DB on load
  const fetchComplaints = async () => {
    try {
      const res = await fetch(getApiUrl('/api/complaints'));
      if (res.ok) {
        const data = await res.json();
        dispatch(setSavedComplaints(data));
      }
    } catch (e) {
      console.error("Error fetching complaints:", e);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Save Complaint Handler
  const handleSaveComplaint = async () => {
    if (!form.product_name && !form.description) {
      alert("Form is empty! Please log a complaint using the AI Copilot on the right first.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl('/api/complaints'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_data: form,
          risk_assessment: riskAssessment,
          status: 'Pending Triage'
        })
      });

      if (!res.ok) throw new Error("Failed to save complaint to database");

      const data = await res.json();
      alert(`Success! Complaint logged under reference: ${data.complaint_number}`);
      
      dispatch(addMessage({
        sender: 'bot',
        text: `Complaint record ${data.complaint_number} has been saved to the QMS database successfully.`
      }));

      dispatch(addNotification({
        title: 'Complaint Saved',
        message: `Complaint reference ${data.complaint_number} saved to QMS database.`,
        type: 'success'
      }));

      dispatch(resetForm());
      fetchComplaints();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-container" data-theme={mode}>
      {/* Consolidated Top Navigation Header */}
      <Header
        activeMainView={activeMainView}
        setActiveMainView={setActiveMainView}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
        savedCount={savedComplaints.length}
      />

      <main className="main-content">
        {activeMainView === 'intake' ? (
          <>
            <ComplaintForm
              onSaveComplaint={handleSaveComplaint}
              isSaving={isSaving}
            />
            <AICopilotPanel />
          </>
        ) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <AnalyticsDashboard />
          </div>
        )}
      </main>

      <SavedComplaintsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        complaints={savedComplaints}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />
    </div>
  );
}
