import React from 'react';
import { Coins } from 'lucide-react';

export const KPBadge = ({ amount, animated = false, size = 'md' }) => {
  const sizeStyles = {
    sm: { padding: '4px 10px', fontSize: '0.8rem', iconSize: 14 },
    md: { padding: '6px 14px', fontSize: '0.9rem', iconSize: 16 },
    lg: { padding: '8px 18px', fontSize: '1.1rem', iconSize: 20 }
  };

  const style = sizeStyles[size] || sizeStyles.md;

  return (
    <div 
      className={`kp-chip ${animated ? 'animated' : ''}`}
      style={{ padding: style.padding, fontSize: style.fontSize }}
      title="Knowledge Points (KP)"
    >
      <Coins size={style.iconSize} className="kp-icon" />
      <span>{amount ?? 0} KP</span>
    </div>
  );
};

export default KPBadge;
