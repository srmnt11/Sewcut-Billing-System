import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { AlertCircle, Loader2, FileText, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface ValidationErrors {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    firstName: false,
    lastName: false,
    password: false,
    confirmPassword: false,
  });

  // Validation functions
  const validateUsername = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 150) {
      return 'Username must not exceed 150 characters';
    }
    if (!/^[\w.@+-]+$/.test(value)) {
      return 'Username may only contain letters, numbers, and @/./+/-/_ characters';
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    return undefined;
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Please confirm your password';
    }
    if (value !== password) {
      return 'Passwords do not match';
    }
    return undefined;
  };

  // Handle field changes with real-time validation
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      const error = validateUsername(value);
      setErrors(prev => ({ ...prev, username: error, general: undefined }));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error, general: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error, general: undefined }));
    }
    // Also revalidate confirm password if it's been touched
    if (touched.confirmPassword && confirmPassword) {
      const confirmError = value !== confirmPassword ? 'Passwords do not match' : undefined;
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const error = validateConfirmPassword(value);
      setErrors(prev => ({ ...prev, confirmPassword: error, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      password: true,
      confirmPassword: true,
    });
    
    // Validate all fields
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    if (usernameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        username: usernameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      
      // Register the user with correct field names for Django
      await api.auth.register({ 
        username: username.trim(), 
        email: email.trim(), 
        password,
        password2: confirmPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'user'
      });
      
      // After successful registration, login
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle different error types
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Map backend errors to frontend fields
        setErrors({
          username: errorData.username?.[0] || errorData.username,
          email: errorData.email?.[0] || errorData.email,
          password: errorData.password?.[0] || errorData.password,
          general: errorData.detail || errorData.non_field_errors?.[0],
        });
      } else {
        setErrors({ 
          general: err.message || 'Registration failed. Please try again.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--neu-bg)] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 neu-hero p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 neu-press rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-slate-700" />
            </div>
            <div>
              <h2 className="text-slate-800 text-xl font-bold">Sew-cut</h2>
              <p className="text-slate-500 text-sm">Apparel Manufacturing</p>
            </div>
          </div>
          
          <div className="mt-16 space-y-6">
            <h1 className="text-4xl font-bold text-slate-800 leading-tight">
              Join Sew-cut<br />Billing System
            </h1>
            <p className="text-slate-500 text-lg">
              Create your account and start managing your business more efficiently.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-500 text-sm">
            Trusted by apparel manufacturing businesses
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 neu-press rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h2 className="text-slate-900 text-lg font-bold">Sewcut</h2>
                <p className="text-slate-600 text-xs">Apparel Manufacturing</p>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create account</h1>
            <p className="text-slate-600">Get started with Sewcut Billing System</p>
          </div>

          <Card className="neu-surface-soft">
          <CardContent className="p-8">
            {errors.general && (
              <div className="mb-6 neu-inset rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, username: true }));
                    setErrors(prev => ({ ...prev, username: validateUsername(username) }));
                  }}
                  placeholder="username"
                  autoComplete="username"
                  className={errors.username && touched.username ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.username && touched.username && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    autoComplete="given-name"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    autoComplete="family-name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true }));
                    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={errors.email && touched.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.email && touched.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, password: true }));
                      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={errors.password && touched.password ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && touched.password ? (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, confirmPassword: true }));
                      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={errors.confirmPassword && touched.confirmPassword ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword ? (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                ) : password && confirmPassword && password === confirmPassword && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
              </div>

                <Button
                  type="submit"
                  className="w-full text-slate-700 h-11"
                  disabled={isLoading || Object.values(errors).some(e => e !== undefined)}
                >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-slate-700 hover:text-slate-900 font-semibold">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

