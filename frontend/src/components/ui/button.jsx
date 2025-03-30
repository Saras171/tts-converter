import React from 'react';

export const Button = ({ children, onClick, className, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md hover:shadow-lg transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};
