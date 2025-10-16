import React from 'react';

const Spinner: React.FC<{ message?: string }> = ({ message = "正在处理中..." }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-50">
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-xl border">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-indigo-600"></div>
        <p className="mt-4 text-indigo-700 font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default Spinner;
