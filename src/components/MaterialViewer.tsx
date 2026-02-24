import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { User } from '../App';
import { ArrowLeft, Download, CheckCircle, XCircle, PlayCircle } from 'lucide-react';

type Question = {
  id: number;
  question_text: string;
  options: string[];
  correct_option_index: number;
};

type Material = {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  original_name: string;
  passing_score: number;
  questions: Question[];
};

export default function MaterialViewer({ user }: { user: User }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const res = await fetch(`/api/materials/${id}`);
        if (res.ok) {
          setMaterial(await res.json());
          // Mark as started
          await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              material_id: Number(id),
              status: 'started'
            })
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id, user.id]);

  const handleAnswer = (qIndex: number, oIndex: number) => {
    setAnswers({ ...answers, [qIndex]: oIndex });
  };

  const submitTest = async () => {
    if (!material) return;
    setSubmitting(true);

    let correctCount = 0;
    material.questions.forEach((q, index) => {
      if (answers[index] === q.correct_option_index) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / material.questions.length) * 100);
    const passed = calculatedScore >= material.passing_score;

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          material_id: material.id,
          score: calculatedScore,
          status: passed ? 'completed' : 'started'
        })
      });
      setScore(calculatedScore);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">교육자료를 불러오는 중...</div>;
  if (!material) return <div className="p-8 text-center text-red-500">교육자료를 찾을 수 없습니다.</div>;

  const fileUrl = `/uploads/${material.file_path}`;
  const isVideo = material.file_type.startsWith('video/');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드로 돌아가기
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{material.title}</h2>
            <p className="text-slate-500 mt-2">{material.description}</p>
          </div>
          <a
            href={fileUrl}
            download={material.original_name}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            다운로드
          </a>
        </div>

        <div className="bg-slate-900 aspect-video flex items-center justify-center relative">
          {isVideo ? (
            <video
              src={fileUrl}
              controls
              className="w-full h-full object-contain"
              onEnded={() => setShowTest(true)}
            />
          ) : (
            <iframe
              src={fileUrl}
              className="w-full h-full bg-white"
              title={material.title}
              onLoad={() => setShowTest(true)}
            />
          )}
        </div>
      </div>

      {(!showTest && score === null) && (
        <div className="text-center py-8">
          <button
            onClick={() => setShowTest(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            학습을 완료했습니다. 평가 시작하기
          </button>
        </div>
      )}

      {(showTest && score === null) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          <div className="text-center border-b border-slate-100 pb-6">
            <h3 className="text-2xl font-bold text-slate-900">교육 평가</h3>
            <p className="text-slate-500 mt-2">
              통과 기준 점수: <span className="font-semibold text-slate-900">{material.passing_score}점</span>
            </p>
          </div>

          <div className="space-y-8">
            {material.questions.map((q, qIndex) => (
              <div key={q.id} className="space-y-4">
                <h4 className="text-lg font-medium text-slate-900">
                  {qIndex + 1}. {q.question_text}
                </h4>
                <div className="space-y-3">
                  {q.options.map((opt, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        answers[qIndex] === oIndex
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={answers[qIndex] === oIndex}
                        onChange={() => handleAnswer(qIndex, oIndex)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={submitTest}
              disabled={submitting || Object.keys(answers).length < material.questions.length}
              className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {submitting ? '제출 중...' : '답안 제출'}
            </button>
          </div>
        </div>
      )}

      {score !== null && (
        <div className={`rounded-2xl shadow-sm border p-8 text-center space-y-4 ${
          score >= material.passing_score 
            ? 'bg-emerald-50 border-emerald-100' 
            : 'bg-amber-50 border-amber-100'
        }`}>
          <div className="flex justify-center">
            {score >= material.passing_score ? (
              <CheckCircle className="w-16 h-16 text-emerald-500" />
            ) : (
              <XCircle className="w-16 h-16 text-amber-500" />
            )}
          </div>
          <h3 className={`text-3xl font-bold ${
            score >= material.passing_score ? 'text-emerald-900' : 'text-amber-900'
          }`}>
            {score} / 100점
          </h3>
          <p className={`text-lg font-medium ${
            score >= material.passing_score ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {score >= material.passing_score 
              ? '축하합니다! 평가를 통과하여 수료를 완료했습니다.' 
              : '통과 기준 점수에 미달했습니다. 자료를 다시 확인하고 재도전하세요.'}
          </p>
          
          <div className="pt-6">
            {score < material.passing_score ? (
              <button
                onClick={() => {
                  setScore(null);
                  setAnswers({});
                  setShowTest(false);
                }}
                className="rounded-xl bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                다시 평가하기
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                대시보드로 돌아가기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
