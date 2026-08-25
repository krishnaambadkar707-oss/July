import React from 'react';
import { useSelector } from 'react-redux';
import {
  PieChart,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Package,
  Layers,
  Activity,
  Award
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const { savedComplaints, form, completeness } = useSelector((state) => state.complaint);

  // Combine saved complaints and current form data for comprehensive analytics
  const allRecords = [...savedComplaints];

  // If current form has product or description, include it in analytics preview
  if (form.product_name || form.description) {
    allRecords.unshift({
      id: 'current-draft',
      complaint_number: 'DRAFT-IN-PROGRESS',
      product_name: form.product_name || 'Draft Product',
      product_strength: form.product_strength || '',
      customer_name: form.customer_name || 'Unassigned',
      batch_number: form.batch_number || 'N/A',
      complaint_type: form.complaint_type || 'Quality Issue',
      initial_severity: form.initial_severity && form.initial_severity !== 'Awaiting AI extraction...' ? form.initial_severity : 'Major',
      priority: form.priority && form.priority !== 'Awaiting AI extraction...' ? form.priority : 'High',
      completeness_score: completeness.score || 0,
      created_at: new Date().toISOString()
    });
  }

  // 1. Metric Calculations
  const totalCount = allRecords.length;
  const criticalCount = allRecords.filter((r) => r.initial_severity === 'Critical').length;
  const majorCount = allRecords.filter((r) => r.initial_severity === 'Major' || !r.initial_severity).length;
  const minorCount = allRecords.filter((r) => r.initial_severity === 'Minor').length;

  const highPriorityCount = allRecords.filter((r) => r.priority === 'High' || !r.priority).length;
  const medPriorityCount = allRecords.filter((r) => r.priority === 'Medium').length;
  const lowPriorityCount = allRecords.filter((r) => r.priority === 'Low').length;

  const avgCompleteness = totalCount > 0
    ? Math.round(allRecords.reduce((acc, r) => acc + (r.completeness_score || 85), 0) / totalCount)
    : 85;

  // 2. Complaint Type Distribution
  const typeCounts = {
    'Discoloration': 0,
    'Foreign Matter': 0,
    'Packaging / Seal': 0,
    'Efficacy / OOS': 0,
    'Labeling Error': 0,
    'Shortage Defect': 0,
    'General Quality': 0
  };

  allRecords.forEach((r) => {
    const type = r.complaint_type || '';
    if (type.includes('Discolor')) typeCounts['Discoloration'] += 1;
    else if (type.includes('Foreign') || type.includes('Contamination')) typeCounts['Foreign Matter'] += 1;
    else if (type.includes('Packaging') || type.includes('Seal')) typeCounts['Packaging / Seal'] += 1;
    else if (type.includes('Efficacy') || type.includes('Specification')) typeCounts['Efficacy / OOS'] += 1;
    else if (type.includes('Labeling')) typeCounts['Labeling Error'] += 1;
    else if (type.includes('Quantity') || type.includes('Shortage')) typeCounts['Shortage Defect'] += 1;
    else typeCounts['General Quality'] += 1;
  });

  const maxTypeCount = Math.max(...Object.values(typeCounts), 1);

  // 3. Top Product Risk Aggregation
  const productMap = {};
  allRecords.forEach((r) => {
    const pName = r.product_name ? r.product_name.trim() : 'Unknown Product';
    if (!productMap[pName]) {
      productMap[pName] = { count: 0, critical: 0, batch: r.batch_number || 'N/A' };
    }
    productMap[pName].count += 1;
    if (r.initial_severity === 'Critical') productMap[pName].critical += 1;
  });

  const sortedProducts = Object.entries(productMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // SVG Donut Chart Slices Math
  const totalSeverity = (criticalCount + majorCount + minorCount) || 1;
  const critPct = (criticalCount / totalSeverity) * 100;
  const majPct = (majorCount / totalSeverity) * 100;
  const minPct = (minorCount / totalSeverity) * 100;

  const radius = 40;
  const circum = 2 * Math.PI * radius;
  const strokeCrit = (critPct / 100) * circum;
  const strokeMaj = (majPct / 100) * circum;
  const strokeMin = (minPct / 100) * circum;

  const offsetCrit = 0;
  const offsetMaj = -strokeCrit;
  const offsetMin = -(strokeCrit + strokeMaj);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* SECTION 1: TOP METRIC SUMMARY CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Total Complaints */}
        <div className="card-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(78, 222, 163, 0.15)', color: 'var(--primary-emerald)', padding: '12px', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Complaints
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary-emerald)', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> Vitalis QMS Sync
            </div>
          </div>
        </div>

        {/* Card 2: Critical Alerts */}
        <div className="card-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255, 180, 171, 0.15)', color: 'var(--error-pink)', padding: '12px', borderRadius: '12px' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical Severity
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--error-pink)', lineHeight: 1.2 }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Requires Immediate QA Quarantine
            </div>
          </div>
        </div>

        {/* Card 3: Avg Completeness Score */}
        <div className="card-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(107, 216, 203, 0.15)', color: 'var(--secondary-teal)', padding: '12px', borderRadius: '12px' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Quality Index
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--secondary-teal)', lineHeight: 1.2 }}>
              {avgCompleteness}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              QMS Field Extraction Accuracy
            </div>
          </div>
        </div>

        {/* Card 4: Action Triage Pending */}
        <div className="card-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255, 185, 95, 0.15)', color: 'var(--tertiary-amber)', padding: '12px', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending QA Triage
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--tertiary-amber)', lineHeight: 1.2 }}>
              {allRecords.filter((r) => r.status === 'Pending Triage' || !r.status).length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Active CAPA Review Queue
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CHARTS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* CHART 1: SEVERITY DISTRIBUTION (SVG DONUT CHART) */}
        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieChart size={18} color="var(--primary-emerald)" />
            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Complaints Severity Breakdown
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', flexWrap: 'wrap' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--input-border)" strokeWidth="14" />
                {/* Critical Slice (Pink/Red) */}
                {critPct > 0 && (
                  <circle
                    cx="50" cy="50" r={radius} fill="transparent" stroke="#ffb4ab" strokeWidth="14"
                    strokeDasharray={`${strokeCrit} ${circum}`} strokeDashoffset={offsetCrit}
                  />
                )}
                {/* Major Slice (Amber) */}
                {majPct > 0 && (
                  <circle
                    cx="50" cy="50" r={radius} fill="transparent" stroke="#ffb95f" strokeWidth="14"
                    strokeDasharray={`${strokeMaj} ${circum}`} strokeDashoffset={offsetMaj}
                  />
                )}
                {/* Minor Slice (Emerald) */}
                {minPct > 0 && (
                  <circle
                    cx="50" cy="50" r={radius} fill="transparent" stroke="#4edea3" strokeWidth="14"
                    strokeDasharray={`${strokeMin} ${circum}`} strokeDashoffset={offsetMin}
                  />
                )}
              </svg>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalCount}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Records</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffb4ab' }} />
                <span>Critical: <strong>{criticalCount}</strong> ({Math.round(critPct)}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffb95f' }} />
                <span>Major: <strong>{majorCount}</strong> ({Math.round(majPct)}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4edea3' }} />
                <span>Minor: <strong>{minorCount}</strong> ({Math.round(minPct)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: COMPLAINT TYPES (HORIZONTAL BAR CHART) */}
        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart2 size={18} color="var(--primary-emerald)" />
            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Complaint Category Distribution
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(typeCounts).map(([label, count]) => {
              const pct = Math.round((count / maxTypeCount) * 100);
              return (
                <div key={label} style={{ fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} items</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--input-bg)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #4edea3, #6bd8cb)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: PRODUCT RISK LEADERBOARD & PRIORITY METERS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* TOP PRODUCT RISK RANKING */}
        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Package size={18} color="var(--primary-emerald)" />
            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Top Affected Products Risk Leaderboard
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedProducts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No product complaint records available.</div>
            ) : (
              sortedProducts.map(([pName, info], idx) => (
                <div
                  key={pName}
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    background: 'var(--input-bg)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontWeight: '800',
                      color: 'var(--primary-emerald)',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(78, 222, 163, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>{pName}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sample Batch: {info.batch}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{info.count} complaints</span>
                    {info.critical > 0 && (
                      <span className="badge-pending" style={{ background: 'rgba(255,180,171,0.15)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.3)', padding: '2px 8px', fontSize: '0.72rem' }}>
                        {info.critical} Critical
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RISK PRIORITY LEVEL METERS */}
        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Layers size={18} color="var(--primary-emerald)" />
            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Risk Priority Distribution
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#ffb4ab' }}>High Priority (Immediate Action)</span>
                <span><strong>{highPriorityCount}</strong> ({Math.round((highPriorityCount / totalCount) * 100 || 0)}%)</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--input-bg)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: `${(highPriorityCount / totalCount) * 100 || 0}%`, height: '100%', background: '#ffb4ab', transition: 'width 0.4s' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#ffb95f' }}>Medium Priority (Standard QA Review)</span>
                <span><strong>{medPriorityCount}</strong> ({Math.round((medPriorityCount / totalCount) * 100 || 0)}%)</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--input-bg)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: `${(medPriorityCount / totalCount) * 100 || 0}%`, height: '100%', background: '#ffb95f', transition: 'width 0.4s' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#4edea3' }}>Low Priority (Routine Log)</span>
                <span><strong>{lowPriorityCount}</strong> ({Math.round((lowPriorityCount / totalCount) * 100 || 0)}%)</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--input-bg)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: `${(lowPriorityCount / totalCount) * 100 || 0}%`, height: '100%', background: '#4edea3', transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
