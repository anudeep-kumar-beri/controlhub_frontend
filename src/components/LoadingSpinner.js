import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = '40px', color = '#00ff99' }) => {
  const spinnerStyle = {
    border: `3px solid #333`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    width: size,
    height: size,
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: color,
    fontFamily: 'Inter, sans-serif',
    minHeight: '200px'
  };

  const messageStyle = {
    marginTop: '1rem',
    fontSize: '0.9rem',
    opacity: 0.8
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      <p style={messageStyle}>{message}</p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;