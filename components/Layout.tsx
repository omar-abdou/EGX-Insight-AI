
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, toggleDarkMode }) => {
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">EGX Insight AI</h1>
            </div>
            
            <nav className="hidden md:flex space-x-reverse space-x-8">
              <a href="#" className="text-emerald-600 font-semibold border-b-2 border-emerald-600 pb-1">الرئيسية</a>
              <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors">الأسهم</a>
              <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors">الصناديق</a>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                title={isDarkMode ? "تفعيل الوضع المضيء" : "تفعيل الوضع المظلم"}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md">
                بحث متقدم
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 mt-12 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>© 2024 محلل البورصة المصرية الذكي. جميع البيانات لأغراض تعليمية فقط.</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="https://ar.tradingview.com" target="_blank" className="hover:text-emerald-600">TradingView</a>
            <a href="https://sa.investing.com" target="_blank" className="hover:text-emerald-600">Investing</a>
            <a href="https://finance.yahoo.com" target="_blank" className="hover:text-emerald-600">Yahoo Finance</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
