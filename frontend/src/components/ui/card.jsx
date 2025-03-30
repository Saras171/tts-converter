import React from 'react';

export const Card = ({ children, className }) => {
  return (
    <div
      className={`w-full max-w-2xl shadow-2xl rounded-3xl  ${className}`}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children }) => {
  return <div className="p-4">{children}</div>;
};
