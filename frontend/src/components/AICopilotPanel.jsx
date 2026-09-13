import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addMessage,
  setIsLoading,
  setExtractionProgress,
  setIsExtracting,
  setActiveTab,
  setPasteText
} from '../store/chatSlice';
import { setExtractedData } from '../store/complaintSlice';
import { addNotification } from '../store/notificationSlice';
import { getApiUrl } from '../config/api';
import { processClientAIChat } from '../utils/aiCopilotEngine';
import {
  Upload,
  FileText,
  Send,
  Sparkles,
  Bot,
  Info,
  FileSpreadsheet
} from 'lucide-react';

export default function AICopilotPanel() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  const { form } = useSelector((state) => state.complaint);
  const {
    messages,
    isLoading,
    extractionProgress,
    isExtracting,
    activeTab,
    pasteText
  } = useSelector((state) => state.chat);

  const [inputPrompt, setInputPrompt] = React.useState('');

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Send Prompt (with seamless backend API + client-side AI engine failover)
  const handleSendPrompt = async (textToSend) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    dispatch(addMessage({ sender: 'user', text: prompt }));
    if (!textToSend) setInputPrompt('');
    dispatch(setIsLoading(true));

    try {
      let data = null;
      try {
        const res = await fetch(getApiUrl('/api/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            current_form_state: form
          })
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (netErr) {
        console.warn("Backend server offline. Running client-side AI Copilot fallback:", netErr);
      }

      if (!data) {
        data = processClientAIChat(prompt, form);
      }

      dispatch(setExtractedData(data));
      let botReply = data.reply;
      if (data.risk_assessment?.precautions && data.risk_assessment.precautions !== 'Awaiting AI extraction...') {
        botReply += `\n\n⚠️ Immediate Precaution: ${data.risk_assessment.precautions}`;
      }
      dispatch(addMessage({ sender: 'bot', text: botReply }));

      if (data.duplicate_found) {
        dispatch(addNotification({
          title: 'Duplicate Complaint Alert',
          message: data.duplicate_info,
          type: 'warning'
        }));
      } else {
        dispatch(addNotification({
          title: data.action_taken === 'EDITED' ? 'Complaint Details Updated' : 'Complaint Extraction Complete',
          message: `Product: ${data.extracted_form?.product_name || 'N/A'}, Batch: ${data.extracted_form?.batch_number || 'N/A'}. Form auto-populated (${data.completeness?.score || 0}% complete).`,
          type: 'success'
        }));
      }
    } catch (err) {
      dispatch(addMessage({ sender: 'bot', text: `Error: ${err.message}` }));
      dispatch(addNotification({
        title: 'Extraction Error',
        message: err.message,
        type: 'critical'
      }));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  // Handle Document Upload (with backend + client-side parser failover)
  const handleFileUpload = async (file) => {
    if (!file) return;

    dispatch(setIsExtracting(true));
    dispatch(setExtractionProgress(10));
    dispatch(addMessage({ sender: 'user', text: `Uploaded document: ${file.name}` }));

    const formData = new FormData();
    formData.append('file', file);

    const interval = setInterval(() => {
      dispatch(setExtractionProgress((prev) => (prev < 90 ? prev + 25 : prev)));
    }, 200);

    try {
      let data = null;
      try {
        const res = await fetch(getApiUrl('/api/extract-document'), {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (netErr) {
        console.warn("Backend document extraction offline. Using client-side document parser fallback:", netErr);
      }

      clearInterval(interval);
      dispatch(setExtractionProgress(100));

      if (!data) {
        let textContent = "";
        try {
          textContent = await file.text();
        } catch (e) {
          textContent = file.name;
        }
        data = processClientAIChat(textContent || file.name, {});
      }

      dispatch(setExtractedData(data));
      dispatch(addMessage({ sender: 'bot', text: data.reply }));

      dispatch(addNotification({
        title: 'Document Extraction Complete',
        message: `Extracted details from '${file.name}'. Batch: ${data.extracted_form?.batch_number || 'N/A'}.`,
        type: 'success'
      }));
    } catch (err) {
      dispatch(addMessage({ sender: 'bot', text: `Extraction failed: ${err.message}` }));
      dispatch(addNotification({
        title: 'Document Extraction Error',
        message: err.message,
        type: 'critical'
      }));
    } finally {
      setTimeout(() => {
        dispatch(setIsExtracting(false));
        dispatch(setExtractionProgress(0));
      }, 500);
    }
  };

  // Load Sample File Button
  const handleLoadSample = async (type) => {
    try {
      let blob = null;
      try {
        const res = await fetch(getApiUrl(`/api/sample-docs/${type}`));
        if (res.ok) blob = await res.blob();
      } catch (e) {}

      const filename = type === 'pdf' ? 'amoxicillin_discoloration_complaint.pdf' : 'metformin_api_impurity_email.eml';
      if (blob) {
        const file = new File([blob], filename, { type: blob.type });
        handleFileUpload(file);
      } else {
        const sampleText = type === 'pdf'
          ? `APOLLO PHARMACY NETWORK - QUALITY COMPLAINT REPORT
Date: August 12, 2026
Source: Apollo Pharmacy Central Distribution Center
Customer Name: Apollo Pharmacy Ltd
Product Name: Amoxicillin Capsules
Product Strength: 500 mg
Batch / Lot Number: BMX24602
Manufacturing Date: 2026-01-15
Expiry Date: 2028-01-14
Affected Quantity: 48 capsules
Complaint Type: Discoloration / Appearance Defect
Detailed Description: Apollo Pharmacy reported discolored capsules in Amoxicillin capsules 500 mg (Batch BMX24602). Upon opening blister packs, 48 capsules exhibited yellowish-brown spots on outer gelatin shells.`
          : `From: quality@biohealthlabs.com
To: qms-complaints@aivoa-pharma.com
Subject: Customer Complaint: Foreign Particulate Impurity in Metformin Hydrochloride API
Details:
- Customer Name: BioHealth Laboratories Inc
- Complaint Source: Email Notification
- Product Name: Metformin Hydrochloride API
- Grade / Strength: IP / BP Grade
- Batch / Lot Number: MFH260712A
- Manufacturing Date: 2026-06-10
- Expiry Date: 2029-06-09
- Affected Quantity: 50 kg (2 HDP drums)
- Complaint Type: Foreign Contamination / Impurity
Description: During raw material receiving inspection at BioHealth Labs, dark particulate inclusions were observed inside 2 HDP drums of Metformin Hydrochloride API (Batch MFH260712A).`;

        const file = new File([sampleText], filename, { type: 'text/plain' });
        handleFileUpload(file);
      }
    } catch (e) {
      alert(`Could not load sample document: ${e.message}`);
    }
  };

  return (
    <div className="card-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="var(--primary-emerald)" />
          <div className="panel-title" style={{ fontSize: '1.2rem' }}>
            AI Complaint Intake Assistant
          </div>
        </div>
        <span className="badge-beta">BETA</span>
      </div>

      {/* Mode Switch Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <button
          onClick={() => dispatch(setActiveTab('file'))}
          className={activeTab === 'file' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
        >
          <Upload size={14} /> Upload Document
        </button>
        <button
          onClick={() => dispatch(setActiveTab('paste'))}
          className={activeTab === 'paste' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
        >
          <FileText size={14} /> Paste Text / Email
        </button>
      </div>

      {/* Tab Content: File Upload */}
      {activeTab === 'file' ? (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files[0])}
            style={{ display: 'none' }}
            accept=".pdf,.eml,.txt,.docx"
          />

          <div
            className="upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="dropzone-icon" />
            <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Drag & drop complaint document here
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-emerald)', marginTop: '4px' }}>
              or click to browse
            </div>
          </div>

          <div className="supported-formats-box">
            <Info size={18} />
            <div>Supported formats: <strong>PDF, DOCX, TXT, EML</strong> (Max 10MB)</div>
          </div>

          {/* Quick Sample File Action Chips */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', alignSelf: 'center' }}>
              Try Demo Files:
            </span>
            <button
              onClick={() => handleLoadSample('pdf')}
              className="btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: 'var(--border-radius-pill)' }}
            >
              <FileSpreadsheet size={12} color="#ffb4ab" /> Amoxicillin Complaint PDF
            </button>
            <button
              onClick={() => handleLoadSample('eml')}
              className="btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: 'var(--border-radius-pill)' }}
            >
              <FileText size={12} color="#6bd8cb" /> Metformin API Email
            </button>
          </div>
        </div>
      ) : (
        /* Tab Content: Paste Text */
        <div style={{ marginBottom: '14px' }}>
          <textarea
            value={pasteText}
            onChange={(e) => dispatch(setPasteText(e.target.value))}
            placeholder="Paste raw complaint text, email body, or call summary here..."
            className="form-textarea"
            style={{ minHeight: '120px', marginBottom: '8px' }}
          />
          <button
            onClick={() => {
              if (pasteText.trim()) {
                handleSendPrompt(pasteText);
                dispatch(setPasteText(''));
              }
            }}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            Extract from Pasted Text
          </button>
        </div>
      )}

      {/* Extraction Progress Indicator */}
      {isExtracting && (
        <div className="progress-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary-emerald)', marginBottom: '4px' }}>
            <span>Analyzing document content and extracting key details...</span>
            <span>{extractionProgress}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${extractionProgress}%` }} />
          </div>
        </div>
      )}

      {/* Chat Thread */}
      <div className="chat-thread">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
            <div style={{ fontSize: '0.72rem', opacity: 0.8, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{msg.sender === 'bot' ? 'AIVOA Co-Pilot' : 'User'}</span>
              <span>{msg.timestamp}</span>
            </div>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={16} className="animate-spin" /> AI Assistant is processing...
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Sample Prompt Chips for 1-Click Testing */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        <button
          onClick={() => handleSendPrompt('Apollo Pharmacy reported discolored capsules in Amoxicillin capsules 500 mg.')}
          style={{ background: 'rgba(78, 222, 163, 0.12)', border: '1px solid rgba(78, 222, 163, 0.25)', padding: '4px 12px', borderRadius: 'var(--border-radius-pill)', fontSize: '0.75rem', color: 'var(--primary-emerald)', cursor: 'pointer' }}
        >
          Prompt: "Apollo Pharmacy reported discolored capsules..."
        </button>
        <button
          onClick={() => handleSendPrompt('Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules.')}
          style={{ background: 'rgba(107, 216, 203, 0.12)', border: '1px solid rgba(107, 216, 203, 0.25)', padding: '4px 12px', borderRadius: 'var(--border-radius-pill)', fontSize: '0.75rem', color: 'var(--secondary-teal)', cursor: 'pointer' }}
        >
          Edit: "Sorry, batch number is BMX24602..."
        </button>
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
          placeholder="Ask me anything about this complaint or log/edit via chat..."
          className="chat-input"
        />
        <button onClick={() => handleSendPrompt()} className="chat-send-btn">
          <Send size={18} />
        </button>
      </div>

      <div className="footer-disclaimer" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
        AI responses may contain errors. Please verify information in compliance with QMS SOPs.
      </div>
    </div>
  );
}
