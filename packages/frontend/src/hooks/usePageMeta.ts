import { useEffect } from 'react';

const defaultDescription = '计算机科学与技术学院学生素质综合测评填写系统';

export function usePageMeta(title: string, description = defaultDescription) {
  useEffect(() => {
    document.title = title;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    }
  }, [description, title]);
}
