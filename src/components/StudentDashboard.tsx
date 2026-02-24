import { useState, useEffect } from 'react';
import { User } from '../App';
import { BookOpen, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

type Material = {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  passing_score: number;
  start_date: string;
  end_date: string;
};

type Progress = {
  id: number;
  material_id: number;
  status: string;
  score: number;
  completed_at: string;
};

export default function StudentDashboard({ user }: { user: User }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matRes, progRes] = await Promise.all([
          fetch('/api/materials'),
          fetch(`/api/progress/${user.id}`)
        ]);
        setMaterials(await matRes.json());
        setProgress(await progRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your courses...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">나의 학습 과정</h2>
        <p className="text-slate-500 mt-1">교육자료를 학습하고 평가를 통과하여 수료를 완료하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map(m => {
          const p = progress.find(pr => pr.material_id === m.id);
          const isCompleted = p?.status === 'completed';
          const isStarted = p?.status === 'started';

          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isCompleted ? 'bg-emerald-100 text-emerald-600' : 
                    isStarted ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                     isStarted ? <Clock className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  {p?.score !== undefined && p.score !== null && (
                    <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {p.score} / 100점
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{m.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4">{m.description}</p>
                
                <div className="flex flex-col gap-2 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    교육기간: {m.start_date} ~ {m.end_date}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-wider font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {m.file_type.includes('video') ? 'VIDEO' : 'PDF'}
                    </span>
                    <span>통과 기준: {m.passing_score}점</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => navigate(`/material/${m.id}`)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isCompleted 
                      ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  }`}
                >
                  <PlayCircle className="w-4 h-4" />
                  {isCompleted ? '자료 다시보기' : isStarted ? '이어서 학습하기' : '학습 시작하기'}
                </button>
              </div>
            </div>
          );
        })}

        {materials.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">등록된 교육자료가 없습니다</h3>
            <p className="text-slate-500 mt-1">새로운 교육과정이 등록될 때까지 기다려주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
