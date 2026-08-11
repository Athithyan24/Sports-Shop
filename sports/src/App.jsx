import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Search } from 'lucide-react';
import TopNav from './components/TopNav';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import CategoryManager from './pages/CategoryManager';

export default function App() {
  return (
    <Router>
      {/* 
        Removed the gray background, padding, and centered container. 
        The app now spans full width and height natively.
      */}
      <div className="min-h-screen bg-brand-white font-sans flex flex-col w-full">
        
        {/* Top Search Bar (Now spans 100% of the screen width) */}
        <div className="bg-gray-100 px-6 py-3 flex items-center gap-4 border-b border-brand-border w-full">
          {/* Aesthetic Window Controls */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          {/* Browser Search/Address Bar */}
          <div className="flex-1 max-w-3xl bg-white rounded-md px-3 py-1.5 flex items-center gap-2 shadow-sm border border-gray-200">
            <Search size={14} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-transparent text-sm outline-none text-brand-textMain" 
            />
          </div>
        </div>

        {/* Navigation */}
        <TopNav />
        
        {/* Main Content Area (Centers the content with a max-width, but backgrounds fill the screen) */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/form" element={<AddProduct />} />
            <Route path="/categories" element={<CategoryManager />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}