import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { colors } from '../styles/theme';

const ChecklistPage = ({ setCurrentPage, onToggleSidebar, onBack }) => {
  const [checklistData, setChecklistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cycleId = localStorage.getItem('currentCycleId') || 1;

  useEffect(() => {
    fetchChecklistData();
    
    // Check if refresh needed
    const needsRefresh = localStorage.getItem('checklistNeedsRefresh');
    if (needsRefresh === 'true') {
      localStorage.removeItem('checklistNeedsRefresh');
      setTimeout(() => fetchChecklistData(), 500);
    }
  }, [cycleId]);

  const fetchChecklistData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest(`/cycles/${cycleId}/checklist/`);
      
      if (result.items) {
        result.items.sort((a, b) => {
          const numA = a.criterion_number ?? 999;
          const numB = b.criterion_number ?? 999;
          return numA - numB;
        });
      }
      
      setChecklistData(result);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCriterionStatus = (percentage) => {
    if (percentage >= 100) return 'completed';
    if (percentage > 0) return 'in-progress';
    return 'not-started';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⏱';
      case 'not-started':
        return '!';
      default:
        return '!';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'in-progress':
        return '#ffc107';
      case 'not-started':
        return '#999999';
      default:
        return '#999999';
    }
  };

  const getButtonText = (percentage) => {
    if (percentage >= 100) return 'View / Edit';
    if (percentage > 0) return 'View / Edit';
    return 'Start';
  };

  const handleItemClick = (criterionNumber) => {
    const pageMap = {
      0: 'background',
      1: 'criterion1',
      2: 'criterion2',
      3: 'criterion3',
      4: 'criterion4',
      5: 'criterion5',
      6: 'criterion6',
      7: 'criterion7',
      8: 'criterion8',
      9: 'appendices',
    };
    
    const page = pageMap[criterionNumber];
    if (page) {
      setCurrentPage(page);
    }
  };

  const calculateOverallProgress = () => {
    if (!checklistData || !checklistData.items || checklistData.items.length === 0) {
      return 0;
    }
    
    const criteriaItems = checklistData.items.filter(item => 
      item.criterion_number !== null && item.criterion_number !== 999 && item.criterion_number !== 9
    );
    
    if (criteriaItems.length === 0) return 0;
    
    const total = criteriaItems.reduce((sum, item) => 
      sum + (item.completion_percentage || 0), 0
    );
    
    return Math.round(total / criteriaItems.length);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'inherit' }}>
        <div style={{ fontSize: '16px', color: '#6c757d' }}>
          Loading checklist...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'inherit' }}>
        <div style={{ fontSize: '16px', color: '#dc3545', marginBottom: '20px' }}>
          Error: {error}
        </div>
        <button onClick={fetchChecklistData} style={{
          padding: '8px 16px', backgroundColor: '#0066cc',
          color: 'white', border: 'none', borderRadius: '6px',
          cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        }}>
          Retry
        </button>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'inherit'
    }}>
      {/* HEADER - Burgundy bar */}
      <div style={{
        backgroundColor: '#8b1538',
        color: 'white',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ≡
        </button>

        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid white',
          backgroundColor: 'transparent'
        }} />

        <div>
          <h1 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: '0 0 2px 0'
          }}>
            ABET Accreditation System
          </h1>
          <p style={{ 
            fontSize: '12px', 
            margin: 0,
            opacity: 0.9
          }}>
            Faculty of Engineering
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Overall Progress Card */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '40px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#2c3e50',
                margin: '0 0 6px 0'
              }}>
                Computer & Communication Engineering
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#6c757d',
                margin: 0
              }}>
                ABET Cycle 2025-2027
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: '700', 
                color: '#8b1538',
                lineHeight: 1,
                marginBottom: '4px'
              }}>
                {overallProgress}%
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#6c757d',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                OVERALL PROGRESS
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#e9ecef',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${overallProgress}%`,
              height: '100%',
              backgroundColor: '#8b1538',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ 
              fontSize: '13px', 
              color: '#6c757d',
              margin: 0
            }}>
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <button style={{
              padding: '8px 20px',
              backgroundColor: '#8b1538',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              View Full Report
            </button>
          </div>
        </div>

        {/* Section Title */}
        <h3 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '24px',
          marginLeft: '0'
        }}>
          ABET Criteria Checklist
        </h3>

        {/* Checklist Items - Individual Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {checklistData?.items?.map((item) => {
            const status = getCriterionStatus(item.completion_percentage);
            const statusColor = getStatusColor(status);
            const statusIcon = getStatusIcon(status);
            const buttonText = getButtonText(item.completion_percentage);
            const isAppendices = item.criterion_number === 9 || item.criterion_number === 999;
            
            return (
              <div
                key={item.item_id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Status Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: statusColor,
                  fontWeight: 'bold',
                  flexShrink: 0,
                  border: `2px solid ${statusColor}`
                }}>
                  {statusIcon}
                </div>

                {/* Item Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ 
                    fontSize: '17px', 
                    fontWeight: '600', 
                    color: '#2c3e50',
                    margin: 0
                  }}>
                    {item.item_name}
                  </h4>
                </div>

                {/* Progress Section */}
                {!isAppendices && (
                  <>
                    {/* Percentage */}
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#2c3e50',
                      minWidth: '65px',
                      textAlign: 'right'
                    }}>
                      {Math.round(item.completion_percentage)}%
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      width: '280px',
                      height: '10px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '5px',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: `${item.completion_percentage}%`,
                        height: '100%',
                        backgroundColor: statusColor,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleItemClick(item.criterion_number)}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#8b1538',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    minWidth: '120px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6d0f2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8b1538';
                  }}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* No Items Message */}
        {(!checklistData?.items || checklistData.items.length === 0) && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#6c757d',
              margin: 0
            }}>
              No checklist items found. Please create a new cycle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};



  


export default ChecklistPage;
