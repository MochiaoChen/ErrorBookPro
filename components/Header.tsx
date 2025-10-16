
import React from 'react';
import { BookMarked } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex items-center">
        <BookMarked className="h-8 w-8 text-indigo-600 mr-3"/>
        <h1 className="text-2xl font-bold text-gray-800">
          错题本 Pro <span className="text-sm font-medium text-indigo-500">智能版</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
