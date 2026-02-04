import React from 'react';
import { ChevronRight, Menu } from 'lucide-react';
import { colors } from '../../styles/theme';

const GlobalHeader = ({ title, subtitle, showBackButton = false, onToggleSidebar, onBack }) => (
  <div style={{ backgroundColor: colors.primary, padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button onClick={onToggleSidebar} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '20px', padding: '8px' }}>
        <Menu size={24} />
      </button>
      <div style={{ backgroundColor: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: colors.primary }}></div>
      </div>
      <div>
        <div style={{ color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '0.3px' }}>{title || 'ABET Accreditation System'}</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '2px' }}>{subtitle || 'Faculty of Engineering'}</div>
      </div>
    </div>
    {showBackButton && (
      <button onClick={onBack} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
        Back to Checklist
      </button>
    )}
  </div>
);

export default GlobalHeader;
