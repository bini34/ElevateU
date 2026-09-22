import { AuthPage } from '@/components/auth/AuthPage';
import { AuthForm } from '@/components/auth/AuthForm';

export default function ForgotPasswordPage() {
  return <AuthPage title="Forgot your password?" description="Enter your email and we'll send instructions if an account is associated with it." signup><AuthForm kind="forgot" /></AuthPage>;
}