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

  // Handle Send Prompt
  const handleSendPrompt = async (textToSend) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    dispatch(addMessage({ sender: 'user', text: prompt }));
    if (!textToSend) setInputPrompt('');
    dispatch(setIsLoading(true));

    try {
      const res = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          current_form_state: form
        })
      });

      if (!res.ok) throw new Error('Failed to get response from AI assistant');

      const data = await res.json();
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
        title: 'Extraction Failed',
        message: err.message,
        type: 'critical'
      }));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  // Handle Document Upload
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
      const res = await fetch(getApiUrl('/api/extract-document'), {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);
      dispatch(setExtractionProgress(100));

      if (!res.ok) throw new Error('Failed to extract document');

      const data = await res.json();
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
      const res = await fetch(getApiUrl(`/api/sample-docs/${type}`));
      if (!res.ok) throw new Error('Sample file download failed');
      const blob = await res.blob();
      const filename = type === 'pdf' ? 'amoxicillin_discoloration_complaint.pdf' : 'metformin_api_impurity_email.eml';
      const file = new File([blob], filename, { type: blob.type });
      handleFileUpload(file);
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
