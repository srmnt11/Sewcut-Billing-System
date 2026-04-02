import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { AlertCircle, Loader2, FileText, Eye, EyeOff, ShieldCheck, Sun, Moon, LockKeyhole } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ValidationErrors {
  username?: string;
  password?: string;
  general?: string;
}

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });

  // Real-time validation
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

  const validatePassword = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return undefined;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      const error = validateUsername(value);
      setErrors(prev => ({ ...prev, username: error, general: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error, general: undefined }));
    }
  };

  const handleUsernameBlur = () => {
    setTouched(prev => ({ ...prev, username: true }));
    const error = validateUsername(username);
    setErrors(prev => ({ ...prev, username: error }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const error = validatePassword(password);
    setErrors(prev => ({ ...prev, password: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ username: true, password: true });
    
    // Validate all fields
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    
    if (usernameError || passwordError) {
      setErrors({
        username: usernameError,
        password: passwordError,
      });
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle different error types
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (errorData.detail) {
          setErrors({ general: errorData.detail });
        } else if (errorData.username) {
          setErrors({ username: errorData.username });
        } else if (errorData.password) {
          setErrors({ password: errorData.password });
        } else {
          setErrors({ general: 'Login failed. Please check your credentials.' });
        }
      } else {
        setErrors({ 
          general: err.message || 'Unable to connect to server. Please try again.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(2deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-3deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(249,115,22,0.5); }
          70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(249,115,22,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 8s ease-in-out infinite; }
        .animate-float3 { animation: float 10s ease-in-out infinite reverse; }
        .animate-fade-slide-up { animation: fadeSlideUp 0.6s ease-out forwards; }
        .animate-fade-slide-right { animation: fadeSlideRight 0.5s ease-out forwards; }
        .feature-item { opacity: 0; animation: fadeSlideRight 0.5s ease-out forwards; }
        .feature-item:nth-child(1) { animation-delay: 0.2s; }
        .feature-item:nth-child(2) { animation-delay: 0.4s; }
        .feature-item:nth-child(3) { animation-delay: 0.6s; }
        .login-card { opacity: 0; animation: fadeSlideUp 0.7s ease-out 0.1s forwards; }
        .btn-shimmer {
          background: linear-gradient(90deg, #f97316 0%, #fb923c 40%, #fdba74 50%, #fb923c 60%, #f97316 100%);
          background-size: 200% auto;
          transition: background-position 0.5s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-shimmer:hover:not(:disabled) {
          background-position: right center;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px -5px rgba(249,115,22,0.5);
        }
        .btn-shimmer:active:not(:disabled) {
          transform: translateY(0px);
        }
        .input-glow:focus-within {
          box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
          border-color: #f97316;
        }
        .input-glow { transition: box-shadow 0.2s ease, border-color 0.2s ease; border-radius: 0.5rem; }
        .logo-pulse { animation: pulse-ring 3s ease-in-out infinite; }
        .orb-spin { animation: spin-slow 20s linear infinite; }
      `}</style>

      <div className="min-h-screen flex bg-[var(--neu-bg)]">
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="absolute top-5 right-5 z-20 neu-button rounded-xl w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* ===== LEFT — Branding ===== */}
        <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-12 neu-hero">

          {/* Animated background orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 animate-float"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
            <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full opacity-15 animate-float2"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
            <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full opacity-10 animate-float3"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
            {/* Grid dot pattern */}
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            {/* Orbiting ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 orb-spin" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-orange-500/10"
              style={{ animation: 'spin-slow 30s linear infinite reverse' }} />
          </div>

          {/* Logo */}
          <div className="relative z-10 animate-fade-slide-right">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 neu-press rounded-2xl flex items-center justify-center shadow-xl">
                <FileText className="w-8 h-8 text-slate-700" />
              </div>
              <div>
                <h2 className="text-slate-800 text-2xl font-bold tracking-tight">Sewcut</h2>
                <p className="text-slate-500 text-sm">Apparel Manufacturing</p>
              </div>
            </div>
          </div>

          {/* Admin context */}
          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold text-slate-800 leading-tight tracking-tight"
                style={{ animation: 'fadeSlideUp 0.7s ease-out 0.1s both' }}>
                Sewcut Admin Portal
              </h1>
              <p className="text-slate-500 text-base leading-relaxed max-w-sm"
                style={{ animation: 'fadeSlideUp 0.7s ease-out 0.25s both' }}>
                Secure access to billing operations and management tools.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: <ShieldCheck className="w-5 h-5" />, text: 'Role-based admin access' },
                { icon: <LockKeyhole className="w-5 h-5" />, text: 'Protected financial records' },
                { icon: <FileText className="w-5 h-5" />, text: 'Invoice and quotation control' },
              ].map((f, i) => (
                <div key={i} className="feature-item flex items-center gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl neu-press flex items-center justify-center text-slate-600">
                    {f.icon}
                  </div>
                  <span className="text-slate-600 text-sm font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== RIGHT — Login Form ===== */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[var(--neu-bg)] relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 animate-float"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', animationDelay: '2s' }} />

          <div className="w-full max-w-md relative z-10 login-card">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 neu-press rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h2 className="text-slate-900 text-lg font-bold">Sewcut</h2>
                <p className="text-slate-500 text-xs">Apparel Manufacturing</p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight dark:text-slate-100">Admin Login</h1>
              <p className="text-slate-500 dark:text-slate-300">Enter your credentials to continue.</p>
            </div>

            {/* Card */}
            <div className="neu-surface-soft rounded-2xl p-8 transition-shadow duration-300">

              {errors.general && (
                <div className="mb-6 neu-inset rounded-xl p-4 flex items-start gap-3 animate-fade-slide-up">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Username */}
                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="neu-inset rounded-lg">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      onBlur={handleUsernameBlur}
                      placeholder="Enter your username"
                      autoComplete="username"
                      className="border-0 shadow-none focus-visible:ring-0 bg-transparent rounded-lg h-11 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && touched.username && (
                    <p className="text-xs text-red-600 flex items-center gap-1 animate-fade-slide-up">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="neu-inset rounded-lg relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onBlur={handlePasswordBlur}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="border-0 shadow-none focus-visible:ring-0 bg-transparent rounded-lg h-11 text-sm pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-150 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="text-xs text-red-600 flex items-center gap-1 animate-fade-slide-up">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || !!errors.username || !!errors.password}
                    className="neu-button w-full h-11 rounded-xl text-slate-700 font-semibold text-sm
                               disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                               flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
              </form>


            </div>
          </div>
        </div>
      </div>
    </>
  );
}

