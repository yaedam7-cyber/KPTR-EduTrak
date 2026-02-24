import React, { useState, useEffect } from 'react';
import { Plus, Users, BookOpen, CheckCircle, Clock, Trash2, Download } from 'lucide-react';
import { User } from '../App';

type Material = {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  original_name: string;
  passing_score: number;
  start_date: string;
  end_date: string;
};

type Progress = {
  id: number;
  user_id: number;
  material_id: number;
  status: string;
  score: number;
  completed_at: string;
  user_name: string;
  department: string;
  employee_id: string;
  material_title: string;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'materials' | 'students' | 'settings'>('materials');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([{ question_text: '', options: ['', '', '', ''], correct_option_index: 0 }]);
  const [uploading, setUploading] = useState(false);

  // Student form state
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matRes, progRes, usersRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/progress'),
        fetch('/api/users')
      ]);
      setMaterials(await matRes.json());
      setProgress(await progRes.json());
      setUsers(await usersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('file', file);
    formData.append('passing_score', passingScore.toString());
    formData.append('questions', JSON.stringify(questions));

    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setShowUpload(false);
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setFile(null);
        setQuestions([{ question_text: '', options: ['', '', '', ''], correct_option_index: 0 }]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_option_index: 0 }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    setAddUserSuccess('');
    setAddingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: empId, name: empName, department: empDept })
      });
      if (res.ok) {
        setEmpId('');
        setEmpName('');
        setEmpDept('');
        setAddUserSuccess('교육생이 성공적으로 등록되었습니다.');
        fetchData();
      } else {
        const data = await res.json();
        setAddUserError(data.error || '등록 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
      setAddUserError('등록 중 오류가 발생했습니다.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('정말 이 교육생을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.ok) {
        setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setPasswordError(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setChangingPassword(false);
    }
  };

  const downloadCSV = () => {
    if (progress.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // Sort by material, then department, then name
    const sorted = [...progress].sort((a, b) => {
      if (a.material_title !== b.material_title) return a.material_title.localeCompare(b.material_title);
      if (a.department !== b.department) return (a.department || '').localeCompare(b.department || '');
      return a.user_name.localeCompare(b.user_name);
    });

    const headers = ['교육과정', '부서', '사번', '이름', '상태', '점수(100점 만점)', '수료일'];
    const rows = sorted.map(p => [
      p.material_title,
      p.department || '-',
      p.employee_id || '-',
      p.user_name,
      p.status === 'completed' ? '수료 완료' : '학습 중',
      p.score !== null ? `${p.score} / 100` : '-',
      p.completed_at ? new Date(p.completed_at).toLocaleDateString() : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `교육참석자_결과_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">관리자 대시보드</h2>
        <div className="flex gap-4">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              교육자료 관리
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              교육생 관리
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              설정
            </button>
          </div>
          {activeTab === 'materials' && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {showUpload ? '업로드 취소' : '교육 및 평가자료 업로드'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'materials' ? (
        <>
          {showUpload && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4">새 교육자료 및 평가 등록</h3>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">교육자료 제목</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">교육 시작일</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">교육 종료일</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">교육자료 파일 (Video/PDF)</label>
                  <input
                    type="file"
                    required
                    accept="video/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">평가 통과 기준 점수 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">평가 문제 (객관식)</h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    + 문제 추가
                  </button>
                </div>
                
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">문제 {qIndex + 1}</label>
                        <input
                          type="text"
                          required
                          value={q.question_text}
                          onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correct_option_index === oIndex}
                              onChange={() => updateQuestion(qIndex, 'correct_option_index', oIndex)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              required
                              placeholder={`보기 ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {uploading ? '업로드 중...' : '교육자료 및 평가 저장'}
              </button>
            </div>
          </form>
        </div>
      )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Materials List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-900">등록된 교육자료</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {materials.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">등록된 교육자료가 없습니다.</div>
                ) : (
                  materials.map(m => (
                    <div key={m.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <h4 className="font-medium text-slate-900">{m.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {m.start_date} ~ {m.end_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          통과 기준: {m.passing_score}점
                        </span>
                        <span className="uppercase tracking-wider font-mono">{m.file_type.split('/')[1] || 'FILE'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Progress List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-semibold text-slate-900">학생 교육 및 평가 현황</h3>
                </div>
                <button
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  결과 다운로드 (CSV)
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {progress.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">아직 학습을 시작한 학생이 없습니다.</div>
                ) : (
                  progress.map(p => (
                    <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-medium text-slate-900">{p.user_name} <span className="text-xs text-slate-500 font-normal">({p.department || '소속 없음'})</span></h4>
                        <p className="text-sm text-slate-500 mt-1">{p.material_title}</p>
                        {p.completed_at && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(p.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status === 'completed' ? '수료 완료' : '학습 중'}
                        </span>
                        {p.score !== null && (
                          <p className="text-sm font-semibold text-slate-700 mt-2">
                            평가 점수: {p.score} / 100점
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'students' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4">교육생 사전 등록</h3>
              {addUserError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                  {addUserError}
                </div>
              )}
              {addUserSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm border border-emerald-100">
                  {addUserSuccess}
                </div>
              )}
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">사번 (ID)</label>
                  <input
                    type="text"
                    required
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="예: 2023001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="예: 홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">소속</label>
                  <input
                    type="text"
                    required
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="예: 개발팀"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors mt-2"
                >
                  {addingUser ? '등록 중...' : '교육생 등록'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-900">등록된 교육생 목록</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">등록된 교육생이 없습니다.</div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">사번</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">이름</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">소속</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">관리</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.employee_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-4">관리자 비밀번호 변경</h3>
            {passwordError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-600 text-sm border border-emerald-100">
                {passwordSuccess}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {changingPassword ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
