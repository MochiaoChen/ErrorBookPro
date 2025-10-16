
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-indigo-600"></div>
        <p className="mt-4 text-indigo-700 font-semibold">正在处理中...</p>
      </div>
    </div>
  );
};

export default Spinner;
