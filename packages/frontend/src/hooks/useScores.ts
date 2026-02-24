import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../lib/ws';
import { api } from '../lib/api';
import { validateScore } from '../lib/validation';

interface ScoreData {
  value: number;
  remark: string | null;
}

interface StudentScore {
  id: number;
  studentNo: string;
  name: string;
  scores: Record<string, ScoreData>;
}

export function useScores(classId: number | null) {
  const [students, setStudents] = useState<StudentScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string>('');
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load scores
  const loadScores = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const data = await api.get(`/scores/class/${classId}`);
      setStudents(data);
    } catch (err) {
      console.error('Failed to load scores:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  // WebSocket handlers
  useEffect(() => {
    if (!classId) return;

    wsClient.connect();
    wsClient.joinClass(classId);

    const handleUpdated = (data: any) => {
      setSaveStatus('saved');
      setLastSaved(new Date().toLocaleTimeString());
      // Update local state with new scores
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === data.studentId) {
            return { ...s, scores: { ...s.scores, ...data.scores } };
          }
          return s;
        })
      );
    };

    const handleSync = (data: any) => {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === data.studentId) {
            return { ...s, scores: { ...s.scores, ...data.scores } };
          }
          return s;
        })
      );
    };

    const handleError = (data: any) => {
      setSaveStatus('error');
      console.error('Score save error:', data.error);
    };

    wsClient.on('score:updated', handleUpdated);
    wsClient.on('score:sync', handleSync);
    wsClient.on('score:error', handleError);

    return () => {
      wsClient.off('score:updated', handleUpdated);
      wsClient.off('score:sync', handleSync);
      wsClient.off('score:error', handleError);
      wsClient.disconnect();
    };
  }, [classId]);

  // Update a score with debounce
  const updateScore = useCallback(
    (studentId: number, category: string, value: number, remark?: string) => {
      const error = validateScore(category, value);
      if (error) {
        setSaveStatus('error');
        return error;
      }

      // Optimistic update
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentId) {
            const newScores = {
              ...s.scores,
              [category]: { value, remark: remark ?? s.scores[category]?.remark ?? null },
            };
            return { ...s, scores: newScores };
          }
          return s;
        })
      );

      // Debounce the actual save
      const key = `${studentId}:${category}`;
      const existing = debounceTimers.current.get(key);
      if (existing) clearTimeout(existing);

      debounceTimers.current.set(
        key,
        setTimeout(() => {
          setSaveStatus('saving');
          wsClient.updateScore(studentId, category, value, remark);
          debounceTimers.current.delete(key);
        }, 300)
      );

      return null;
    },
    []
  );

  const updateRemark = useCallback(
    (studentId: number, category: string, remark: string) => {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentId) {
            const existing = s.scores[category] || { value: 0, remark: null };
            return {
              ...s,
              scores: { ...s.scores, [category]: { ...existing, remark } },
            };
          }
          return s;
        })
      );

      const key = `${studentId}:${category}:remark`;
      const existing = debounceTimers.current.get(key);
      if (existing) clearTimeout(existing);

      debounceTimers.current.set(
        key,
        setTimeout(() => {
          const student = students.find((s) => s.id === studentId);
          const value = student?.scores[category]?.value || 0;
          setSaveStatus('saving');
          wsClient.updateScore(studentId, category, value, remark);
          debounceTimers.current.delete(key);
        }, 500)
      );
    },
    [students]
  );

  return {
    students,
    loading,
    saveStatus,
    lastSaved,
    updateScore,
    updateRemark,
    loadScores,
  };
}
