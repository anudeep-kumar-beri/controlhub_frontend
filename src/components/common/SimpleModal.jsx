import React from 'react';

export default function SimpleModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div style={{background:'#111',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:16,minWidth:320,maxWidth:560}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <h3 style={{margin:0}}>{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
