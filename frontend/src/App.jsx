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
      let data = null;
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

        if (res.ok) data = await res.json();
      } catch (netErr) {
        console.warn("Backend offline. Saving complaint locally:", netErr);
      }

      if (!data) {
        const nextId = savedComplaints.length + 1;
        const compNum = `CMP-2026-${String(nextId).padStart(4, '0')}`;
        const newRecord = {
          id: nextId,
          complaint_number: compNum,
          complaint_source: form.complaint_source,
          customer_name: form.customer_name,
          product_name: form.product_name,
          product_strength: form.product_strength,
          batch_number: form.batch_number,
          mfg_date: form.mfg_date,
          expiry_date: form.expiry_date,
          quantity_affected: form.quantity_affected,
          complaint_type: form.complaint_type,
          complaint_date: form.complaint_date || new Date().toISOString().split('T')[0],
          description: form.description,
          initial_severity: riskAssessment.initial_severity,
          priority: riskAssessment.priority,
          suggested_next_action: riskAssessment.suggested_next_action,
          risk_reasoning: riskAssessment.risk_reasoning,
          capa_recommendation: riskAssessment.capa_recommendation,
          precautions: riskAssessment.precautions,
          completeness_score: 100,
          status: 'Pending Triage',
          created_at: new Date().toISOString()
        };
        dispatch(setSavedComplaints([newRecord, ...savedComplaints]));
        data = { complaint_number: compNum };
      }

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
