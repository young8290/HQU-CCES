import LoginForm from '../components/auth/LoginForm';
import { usePageMeta } from '../hooks/usePageMeta';

export default function LoginRoute() {
  usePageMeta('登录 - 综测填写系统');

  return <LoginForm />;
}
