
import React, { useRef, useState } from 'react';
import { UploadCloud } from './Icons';

interface FileUploadProps {
  onImageUpload: (imageDataUrl: string) => void;
  uploadedImage: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageUpload, uploadedImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageUpload(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageUpload(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      {!uploadedImage ? (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex justify-center w-full h-64 px-4 transition bg-white border-2 ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'} border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none`}>
          <span className="flex flex-col items-center justify-center space-x-2 text-center">
            <UploadCloud className={`w-16 h-16 ${isDragging ? 'text-indigo-600' : 'text-gray-600'}`} />
            <span className="font-medium text-gray-600">
              拖拽错题图片到这里, 或 <span className="text-indigo-600 underline" onClick={(e) => { e.preventDefault(); openFileDialog(); }}>点击上传</span>
            </span>
             <span className="text-sm text-gray-500 mt-1">支持 PNG, JPG, JPEG 格式</span>
          </span>
        </label>
      ) : (
        <div className="mt-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">图片预览</h3>
            <img src={uploadedImage} alt="Uploaded preview" className="max-h-96 w-auto rounded-lg shadow-lg border"/>
            <button onClick={openFileDialog} className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium transition">更换图片</button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
