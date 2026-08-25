import { createSlice } from '@reduxjs/toolkit';

const initialFormState = {
  complaint_source: '',
  customer_name: '',
  product_name: '',
  product_strength: '',
  batch_number: '',
  mfg_date: '',
  expiry_date: '',
  quantity_affected: '',
  complaint_type: '',
  complaint_date: '',
  description: '',
  initial_severity: 'Awaiting AI extraction...',
  priority: 'Awaiting AI extraction...'
};

const initialRiskAssessment = {
  initial_severity: 'Awaiting AI extraction...',
  priority: 'Awaiting AI extraction...',
  suggested_next_action: 'Awaiting AI extraction...',
  risk_reasoning: 'Awaiting AI extraction...',
  capa_recommendation: 'Awaiting AI extraction...',
  precautions: 'Awaiting AI extraction...'
};

const initialCompleteness = {
  score: 0,
  missing_fields: ['Customer Name', 'Product Name', 'Product Strength', 'Batch/Lot Number', 'Quantity Affected', 'Complaint Type', 'Description'],
  is_complete: false
};

const complaintSlice = createSlice({
  name: 'complaint',
  initialState: {
    form: initialFormState,
    riskAssessment: initialRiskAssessment,
    completeness: initialCompleteness,
    savedComplaints: [],
    duplicateAlert: null,
    statusBadge: 'Pending Triage',
    isSaving: false
  },
  reducers: {
    updateFormField: (state, action) => {
      const { name, value } = action.payload;
      state.form[name] = value;
    },
    setExtractedData: (state, action) => {
      const { extracted_form, risk_assessment, completeness, duplicate_found, duplicate_info } = action.payload;
      if (extracted_form) {
        state.form = { ...state.form, ...extracted_form };
      }
      if (risk_assessment) {
        state.riskAssessment = risk_assessment;
      }
      if (completeness) {
        state.completeness = completeness;
      }
      if (duplicate_found) {
        state.duplicateAlert = duplicate_info;
      } else {
        state.duplicateAlert = null;
      }
    },
    resetForm: (state) => {
      state.form = initialFormState;
      state.riskAssessment = initialRiskAssessment;
      state.completeness = initialCompleteness;
      state.duplicateAlert = null;
      state.statusBadge = 'Pending Triage';
    },
    setSavedComplaints: (state, action) => {
      state.savedComplaints = action.payload;
    },
    setStatusBadge: (state, action) => {
      state.statusBadge = action.payload;
    },
    clearDuplicateAlert: (state) => {
      state.duplicateAlert = null;
    }
  }
});

export const {
  updateFormField,
  setExtractedData,
  resetForm,
  setSavedComplaints,
  setStatusBadge,
  clearDuplicateAlert
} = complaintSlice.actions;

export default complaintSlice.reducer;
