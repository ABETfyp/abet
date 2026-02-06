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
      
      // Sort items by criterion number
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

  const handleRefresh = () => {
    fetchChecklistData();
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
        return '#6c757d';
      default:
        return '#6c757d';
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

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!checklistData || !checklistData.items || checklistData.items.length === 0) {
      return 0;
    }
    
    // Only count criteria items (not appendices)
    const criteriaItems = checklistData.items.filter(item => 
      item.criterion_number !== null && item.criterion_number !== 999
    );
    
    if (criteriaItems.length === 0) return 0;
    
    const total = criteriaItems.reduce((sum, item) => 
      sum + (item.completion_percentage || 0), 0
    );
    
    return Math.round(total / criteriaItems.length);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'inherit'
      }}>
        <div style={{ fontSize: '18px', color: colors.mediumGray || '#6c757d' }}>
          Loading checklist...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'inherit'
      }}>
        <div style={{ fontSize: '18px', color: '#dc3545', marginBottom: '20px' }}>
          Error: {error}
        </div>
        <button 
          onClick={fetchChecklistData}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.primary || '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div style={{ 
      padding: '40px',
      maxWidth: '1600px',
      margin: '0 auto',
      fontFamily: 'inherit'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: colors.darkGray || '#2c3e50',
            margin: '0 0 8px 0'
          }}>
            ABET Criteria Checklist
          </h1>
        </div>
        
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '10px 16px',
            backgroundColor: colors.lightGray || '#f8f9fa',
            border: `1px solid ${colors.border || '#dee2e6'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ☰ Menu
        </button>
      </div>

      {/* List of All Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {checklistData?.items?.map((item) => {
          const status = getCriterionStatus(item.completion_percentage);
          const statusColor = getStatusColor(status);
          const statusIcon = getStatusIcon(status);
          const buttonText = getButtonText(item.completion_percentage);
          
          return (
            <div
              key={item.item_id}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${colors.border || '#dee2e6'}`,
                borderRadius: '8px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                transition: 'box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Status Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: statusColor + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: statusColor,
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {statusIcon}
              </div>

              {/* Item Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: colors.darkGray || '#2c3e50',
                  margin: 0
                }}>
                  {item.item_name}
                </h3>
              </div>

              {/* Progress Percentage */}
              {item.criterion_number !== 9 && item.criterion_number !== 999 && (
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: colors.darkGray || '#2c3e50',
                  minWidth: '80px',
                  textAlign: 'right'
                }}>
                  {Math.round(item.completion_percentage)}%
                </div>
              )}

              {/* Progress Bar */}
              {item.criterion_number !== 9 && item.criterion_number !== 999 && (
                <div style={{
                  width: '300px',
                  height: '12px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '6px',
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
          border: `1px solid ${colors.border || '#dee2e6'}`,
          borderRadius: '8px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '16px', 
            color: colors.mediumGray || '#6c757d',
            margin: 0
          }}>
            No checklist items found. Please create a new cycle.
          </p>
        </div>
      )}
    </div>
  );
};



  


export default ChecklistPage;
