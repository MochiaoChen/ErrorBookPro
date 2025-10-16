
import React, { useState, useEffect, useCallback } from 'react';
import { extractQuestionsFromImage, analyzeKnowledgePoints, generatePracticeTest } from './services/geminiService';
import type { Question, PracticeQuestion } from './types';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import QuestionList from './components/QuestionList';
import AnalysisDisplay from './components/AnalysisDisplay';
import PracticeTest from './components/PracticeTest';
import Spinner from './components/Spinner';
import TabButton from './components/TabButton';
import { BookOpen, Edit, FilePlus, Zap } from './components/Icons';

type Tab = 'upload' | 'bank' | 'analysis' | 'practice';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [practiceTest, setPracticeTest] = useState<PracticeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    try {
      const savedBank = localStorage.getItem('questionBank');
      if (savedBank) {
        setQuestionBank(JSON.parse(savedBank));
      }
    } catch (e) {
      console.error("Failed to load question bank from localStorage", e);
      setError("无法从本地加载错题库。");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('questionBank', JSON.stringify(questionBank));
    } catch (e) {
      console.error("Failed to save question bank to localStorage", e);
       setError("无法将错题保存至本地。");
    }
  }, [questionBank]);

  const handleImageUpload = (imageDataUrl: string) => {
    setUploadedImage(imageDataUrl);
    setExtractedQuestions([]);
    setError('');
  };

  const handleExtractQuestions = useCallback(async () => {
    if (!uploadedImage) {
      setError('请先上传一张图片。');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const imageData = uploadedImage.split(',')[1];
      const questions = await extractQuestionsFromImage(imageData);
      setExtractedQuestions(questions);
    } catch (err) {
      console.error(err);
      setError('无法从图片中提取题目，请确保图片清晰并重试。');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage]);

  const handleAddToBank = () => {
    const newQuestions = extractedQuestions.filter(
      (eq) => !questionBank.some((bq) => bq.id === eq.id)
    );
    if (newQuestions.length > 0) {
        setQuestionBank((prevBank) => [...prevBank, ...newQuestions]);
    }
    setExtractedQuestions([]);
    setUploadedImage(null);
    setActiveTab('bank');
  };

  const handleDeleteFromBank = (id: string) => {
    setQuestionBank((prevBank) => prevBank.filter((q) => q.id !== id));
  };
  
  const handleAnalysis = useCallback(async () => {
    if (questionBank.length === 0) {
        setError("错题库为空，请先添加错题。");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
        const result = await analyzeKnowledgePoints(questionBank);
        setAnalysisResult(result);
        setActiveTab('analysis');
    } catch (err) {
        console.error(err);
        setError("生成知识点分析失败，请稍后重试。");
    } finally {
        setIsLoading(false);
    }
  }, [questionBank]);

  const handleGenerateTest = useCallback(async () => {
    if (!analysisResult) {
        setError("请先进行知识点分析。");
        setActiveTab('analysis');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
        const test = await generatePracticeTest(analysisResult);
        setPracticeTest(test);
        setActiveTab('practice');
    } catch (err) {
        console.error(err);
        setError("生成巩固练习失败，请稍后重试。");
    } finally {
        setIsLoading(false);
    }
  }, [analysisResult]);


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 border-b border-gray-200 pb-4">
            <TabButton onClick={() => setActiveTab('upload')} isActive={activeTab === 'upload'} icon={<FilePlus />}>上传错题</TabButton>
            <TabButton onClick={() => setActiveTab('bank')} isActive={activeTab === 'bank'} icon={<BookOpen />}>我的错题库</TabButton>
            <TabButton onClick={() => setActiveTab('analysis')} isActive={activeTab === 'analysis'} icon={<Zap />}>知识点分析</TabButton>
            <TabButton onClick={() => setActiveTab('practice')} isActive={activeTab === 'practice'} icon={<Edit />}>巩固练习</TabButton>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
          {isLoading && <Spinner />}
          
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-20' : 'opacity-100'}`}>
            {activeTab === 'upload' && (
              <div>
                <FileUpload onImageUpload={handleImageUpload} uploadedImage={uploadedImage} />
                {uploadedImage && (
                    <div className="text-center mt-4">
                        <button onClick={handleExtractQuestions} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300" disabled={isLoading}>
                            开始识别
                        </button>
                    </div>
                )}
                {extractedQuestions.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">识别出的错题</h2>
                    <QuestionList questions={extractedQuestions} />
                    <div className="text-center mt-4">
                        <button onClick={handleAddToBank} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300">
                            存入错题库
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'bank' && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">我的错题库 ({questionBank.length})</h2>
                {questionBank.length > 0 ? (
                  <>
                    <QuestionList questions={questionBank} onDelete={handleDeleteFromBank}/>
                     <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={handleAnalysis} disabled={isLoading} className="bg-sky-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-700 transition duration-300 disabled:bg-sky-300 text-lg flex items-center justify-center gap-2">
                            <Zap /> 分析知识点
                        </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">错题库是空的</h3>
                    <p className="mt-1 text-gray-500">请先从“上传错题”标签页添加题目。</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'analysis' && (
              <div>
                {analysisResult ? (
                    <>
                        <AnalysisDisplay analysis={analysisResult} />
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                             <button onClick={handleGenerateTest} disabled={isLoading} className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-emerald-700 transition duration-300 disabled:bg-emerald-300 text-lg flex items-center justify-center gap-2">
                                <Edit /> 生成巩固练习
                            </button>
                        </div>
                    </>
                ) : (
                   <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                    <Zap className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">暂无分析报告</h3>
                    <p className="mt-1 text-gray-500">请先在“我的错题库”中进行知识点分析。</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'practice' && (
              <div>
                {practiceTest.length > 0 ? (
                    <PracticeTest questions={practiceTest} />
                ) : (
                    <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                        <Edit className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">暂无练习题</h3>
                        <p className="mt-1 text-gray-500">请先生成知识点分析，然后创建巩固练习。</p>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
