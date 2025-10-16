
import React from 'react';

interface TabButtonProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ onClick, isActive, children, icon }) => {
  const baseClasses = "w-full flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
  const activeClasses = "bg-indigo-600 text-white shadow-md";
  const inactiveClasses = "text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-800";
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      {icon}
      <span>{children}</span>
    </button>
  );
};

export default TabButton;
