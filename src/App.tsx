import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import MaterialViewer from './components/MaterialViewer';

export type User = {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  role: 'admin' | 'student';
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="KPTR Logo" 
                className="h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                }}
              />
              <h1 className="text-xl font-bold text-indigo-900">KPTR - EduTrak</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                환영합니다, <span className="font-medium text-slate-900">{user.name}</span> ({user.department || user.role})
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route 
              path="/" 
              element={
                user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard user={user} />
              } 
            />
            <Route 
              path="/material/:id" 
              element={<MaterialViewer user={user} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
