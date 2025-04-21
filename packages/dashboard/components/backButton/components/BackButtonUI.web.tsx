import React from 'react';
import { MoveLeft } from 'lucide-react';


interface BackUIProps {
  label: string
  navigateBack: ()=>void
}

export function BackButton({ label,navigateBack }: BackUIProps) {
  return (
    <div style={{ marginLeft: '1rem',display:'flex',alignItems:'center',paddingTop:'1rem' }} onClick={navigateBack}>
      <MoveLeft size={20} color='#262626' cursor={'pointer'}/>
      <span style={{ color: '#262626', fontSize: '1rem', marginLeft:10, letterSpacing:0.5 }}>{label || 'Go Back'}</span>
      {/* <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1> */}
    </div>
  );
}

export default BackButton;