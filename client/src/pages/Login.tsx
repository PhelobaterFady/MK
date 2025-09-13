import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const { currentUser, login, register, loginWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
    
    // Check for disabled account parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('disabled') === 'true') {
      setError('Your account has been disabled. Please contact support for assistance.');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast({
          title: "Success",
          description: "Welcome back!"
        });
      } else {
        if (!formData.username.trim()) {
          throw new Error('Username is required');
        }
        await register(formData.email, formData.password, formData.username);
        toast({
          title: "Success",
          description: "Account created successfully! Welcome to Monlyking!"
        });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetPassword(formData.email);
      setSuccess('Password reset email sent! Please check your inbox and spam/junk folder.');
      toast({
        title: "Email Sent",
        description: "Check your email and spam/junk folder for password reset instructions."
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await loginWithGoogle();
      toast({
        title: "Success",
        description: "Successfully logged in with Google!"
      });
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 via-blue-200 to-blue-400 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center mr-3">
              <img 
                src="/src/Public/monkeyicn.png" 
                alt="Monly King Logo" 
                className="w-16 h-16 object-cover rounded-full shadow-lg"
              />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">Monly King</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">
            {showForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h1>
          <p className="text-blue-900">
            {showForgotPassword 
              ? 'Enter your email to receive reset instructions'
              : (isLogin 
                ? 'Sign in to your account to continue'
                : 'Join Monly King and start trading game accounts'
              )
            }
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-2 border-blue-200 bg-blue-100/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-6 border-blue-300 bg-blue-100">
                <AlertDescription className="text-blue-900">{success}</AlertDescription>
              </Alert>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-blue-900">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-12 border-blue-400 focus:border-blue-700 focus:ring-blue-700"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>
                
                {/* Note about spam/junk folder */}
                <div className="text-center">
                  <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <i className="fas fa-info-circle mr-2"></i>
                    <strong>Note:</strong> Please check your spam/junk folder if you don't receive the email within a few minutes.
                  </p>
                </div>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                  >
                    ← Back to {isLogin ? 'Login' : 'Register'}
                  </button>
                </div>
              </form>
            ) : (
              /* Login/Register Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-blue-900">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="h-12 border-blue-400 focus:border-blue-700 focus:ring-blue-700"
                      data-testid="username-input"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-blue-900">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-12 border-blue-400 focus:border-blue-700 focus:ring-blue-700"
                    data-testid="email-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-blue-900">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="h-12 border-blue-400 focus:border-blue-700 focus:ring-blue-700"
                    data-testid="password-input"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-medium"
                  disabled={loading}
                  data-testid="auth-submit-button"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
                
                {/* Forgot Password Link - Only show on login */}
                {isLogin && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Google Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-blue-100 px-4 text-blue-700 font-medium">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 mt-4 border-blue-400 hover:bg-blue-100"
                data-testid="google-login-button"
              >
                <i className="fab fa-google mr-2 text-red-500"></i>
                Continue with Google
              </Button>
            </div>

            {/* Toggle between Login/Register */}
            <div className="text-center mt-6">
              <span className="text-blue-700">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                  setFormData({ email: '', password: '', username: '' });
                }}
                className="text-blue-700 hover:text-blue-900 font-medium"
                data-testid="toggle-auth-mode"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
