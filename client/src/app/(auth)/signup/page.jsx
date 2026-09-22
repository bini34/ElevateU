import { AuthPage } from '@/components/auth/AuthPage';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignUpPage() {
  return <AuthPage title="Create your account" description="Join ElevateU and make room for growth." signup><AuthForm kind="register" /></AuthPage>;
}