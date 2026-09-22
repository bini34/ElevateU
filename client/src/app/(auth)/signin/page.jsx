import { AuthPage } from '@/components/auth/AuthPage';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignInPage() {
  return <AuthPage title="Welcome back" description="Log in to continue your journey."><AuthForm kind="login" /></AuthPage>;
}