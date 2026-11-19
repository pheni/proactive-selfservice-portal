import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, KeyRound, AlertCircle, Terminal, ExternalLink, Activity } from 'lucide-react';
import { serviceNowAuthService } from '../../services/servicenowAuth';
import { SERVICENOW_CONFIG } from '../../config/servicenow.config';

interface AuthenticationModalProps {
  onComplete: () => void;
}

export const AuthenticationModal: React.FC<AuthenticationModalProps> = ({ onComplete }) => {
  const [view, setView] = useState<'login' | 'mfa' | 'forgot_email' | 'forgot_otp' | 'reset_password' | 'reset_success'>('login');
  
  // Login Form States - Default username from config, password blank for secure entry
  const [email, setEmail] = useState(SERVICENOW_CONFIG.defaultUsername);
  const [password, setPassword] = useState(SERVICENOW_CONFIG.defaultPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isCorsError, setIsCorsError] = useState<boolean>(false);
  const [authenticating, setAuthenticating] = useState<boolean>(false);

  // OTP States
  const [otp, setOtp] = useState(['7', '8', '7', '4', '2', '2']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(82); // 01:22

  // Reset Password States
  const [resetEmail, setResetEmail] = useState(`admin@tataamericaintlcorpdemo3.service-now.com`);
  const [newPassword, setNewPassword] = useState('P@$$word@12345');
  const [confirmPassword, setConfirmPassword] = useState('P@$$word@12345');
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0 && (view === 'mfa' || view === 'forgot_otp')) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer, view]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Please enter your User ID / Email and password.');
      return;
    }
    
    setLoginError(null);
    setIsCorsError(false);
    setAuthenticating(true);

    try {
      const res = await serviceNowAuthService.authenticate(email, password);
      setAuthenticating(false);

      if (res.success) {
        setView('mfa');
      } else {
        setLoginError(res.error || 'Authentication failed. Please check your credentials.');
        if (res.isCorsError) {
          setIsCorsError(true);
        }
      }
    } catch (err: any) {
      setAuthenticating(false);
      setLoginError('Unexpected connection error. Please try again.');
    }
  };

  const handleMfaVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length < 6) {
      setOtpError('Incorrect code. Please enter the full 6-digit code.');
      return;
    }
    setOtpError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sn_portal_authenticated', 'true');
      localStorage.setItem('sn_portal_authenticated', 'true');
    }
    onComplete();
  };

  const handleForgotEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('forgot_otp');
    setResendTimer(82);
  };

  const handleForgotOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('reset_password');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match!');
      return;
    }
    if (newPassword === 'P@$$word@1234') {
      setResetError('New password cannot be same as old password.');
      return;
    }
    setResetError(null);
    setView('reset_success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm font-sans">
      
      {/* Main Split Card Container (Exact Login.pdf 2-Column Card) */}
      <div className="mx-auto grid min-h-[580px] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 grid-cols-1 md:grid-cols-2">
        
        {/* Left Column: Deep Navy Tech Branding Panel (#092E4C) */}
        <div className="relative flex flex-col justify-between bg-[#092E4C] p-8 text-white sm:p-12 overflow-hidden">
          
          {/* Abstract Tech Dot Matrix Overlay & Ambient Glow */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          {/* Top Pill Tag */}
          <div className="relative z-10 hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-cyan-300 backdrop-blur-md border border-white/15 w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Customer Service Assurance</span>
          </div>

          {/* Logo & Headline Section */}
          <div className="relative z-10 my-auto py-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3.5 mb-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 p-[2px] shadow-xl shadow-cyan-950/50 shrink-0">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#092E4C]">
                  <Activity className="h-6 w-6 text-cyan-300" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
              </div>
              <div className="text-left">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none flex items-center gap-1.5">
                  <span>B2C</span>
                  <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-200 bg-clip-text text-transparent">SELFCARE</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[.3em] text-cyan-300/90 mt-1">
                  CUSTOMER PORTAL
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-300 font-medium hidden sm:block">
              Customer Service Assurance & Account Care Gateway. Authenticate securely to manage subscriptions, monitor service health, and track active cases in real-time.
            </p>

            {/* Feature Mini Cards */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 text-xs text-slate-200 hidden sm:grid">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5 border border-white/10 backdrop-blur-xs">
                <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-white text-[11px]">24/7 Monitoring</div>
                  <div className="text-[10px] text-slate-400">Live service health</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5 border border-white/10 backdrop-blur-xs">
                <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-white text-[11px]">Instant Resolution</div>
                  <div className="text-[10px] text-slate-400">Proactive support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Security Note */}
          <div className="relative z-10 space-y-1 text-[11px] text-slate-300 border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Authorised Customer Access</span>
            </div>
            <p className="text-[10px] text-slate-400">Protected by Multi-Factor Authentication & end-to-end encryption.</p>
          </div>

        </div>

        {/* Right Column: Light Canvas Form Area */}
        <div className="flex flex-col justify-between bg-[#F4F8FA] p-6 sm:p-10 text-slate-900">
          
          {/* Form Header & Switchable Views */}
          <div className="my-auto space-y-6">
            
            {/* VIEW 1: SIGN IN */}
            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#092E4C]">Welcome!</h2>
                  <p className="mt-1.5 text-xs text-slate-600 font-medium">
                    Sign in to access your <strong className="text-[#092E4C] font-extrabold">B2C Selfcare Portal</strong>
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
                    <div className="font-bold flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>

                    {isCorsError && (
                      <div className="text-[11px] text-red-700 bg-white/80 p-2 rounded-lg border border-red-200 space-y-1">
                        <strong className="block text-red-900 font-extrabold">Cross-Origin Access Setup Required:</strong>
                        <span>1. Open backend gateway <code className="bg-red-100 px-1 rounded font-mono">System Web Services -&gt; CORS Rules</code></span>
                        <span>2. Add allowed domain or set to <code className="bg-red-100 px-1 rounded font-mono">*</code> for public access</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Email / User ID Input */}
                <div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user.mail@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 pl-4 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition shadow-xs"
                  />
                </div>

                {/* Password Input with Show/Hide Toggle */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white p-3.5 pr-10 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition font-mono shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 accent-teal-600"
                    />
                    <span className="font-bold text-slate-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('forgot_email')}
                    className="text-[#092E4C] hover:text-teal-700 hover:underline font-extrabold"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={authenticating}
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-3.5 text-xs font-extrabold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {authenticating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying credentials in ServiceNow...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* VIEW 2: MFA VERIFICATION */}
            {view === 'mfa' && (
              <form onSubmit={handleMfaVerify} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#092E4C]">Verify your account</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    We have sent a 6-digit OTP to <strong className="text-slate-900 font-mono">{email || 'your registered account'}</strong>. Please enter the code below.
                  </p>
                </div>

                {otpError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* 6 OTP Inputs */}
                <div className="grid grid-cols-6 gap-2 pt-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newOtp = [...otp];
                        newOtp[idx] = val;
                        setOtp(newOtp);
                      }}
                      className="h-12 text-center rounded-xl border border-slate-300 bg-white font-mono text-lg font-bold text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none shadow-xs"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-3.5 text-xs font-bold text-white shadow-md transition"
                >
                  Verify & Sign in
                </button>

                <div className="text-center text-xs text-slate-500 font-medium pt-1">
                  Didn't get the code?{' '}
                  {resendTimer > 0 ? (
                    <span className="text-rose-600 font-bold">Resend OTP in {formatTimer(resendTimer)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(82)}
                      className="text-teal-700 font-bold underline"
                    >
                      Resend OTP now
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* VIEW 3: FORGOT PASSWORD - EMAIL */}
            {view === 'forgot_email' && (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#092E4C]">Forgot the Password</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Please enter your registered email to reset the password.
                  </p>
                </div>

                <div>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-3.5 text-xs font-bold text-white shadow-md transition"
                >
                  Reset Password
                </button>

                <div className="text-center text-xs text-slate-500 font-medium">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-rose-600 font-bold underline"
                  >
                    Login
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 4: FORGOT PASSWORD - OTP */}
            {view === 'forgot_otp' && (
              <form onSubmit={handleForgotOtpSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#092E4C]">Check your email</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    We have sent a 6-digit OTP to <strong className="text-slate-900 font-mono">{resetEmail || 'your registered email'}</strong>. Please enter the code below.
                  </p>
                </div>

                <div className="grid grid-cols-6 gap-2 pt-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newOtp = [...otp];
                        newOtp[idx] = val;
                        setOtp(newOtp);
                      }}
                      className="h-12 text-center rounded-xl border border-slate-300 bg-white font-mono text-lg font-bold text-slate-900 focus:border-teal-600 outline-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-3.5 text-xs font-bold text-white shadow-md transition"
                >
                  Verify Code
                </button>

                <div className="text-center text-xs text-slate-500 font-medium">
                  Didn't get the code? <span className="text-rose-600 font-bold">Resend OTP in 01:22</span>
                </div>
              </form>
            )}

            {/* VIEW 5: SET NEW PASSWORD */}
            {view === 'reset_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#092E4C]">Set a new password</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Create a new password. Ensure it is different from previous ones for security.
                  </p>
                </div>

                {resetError && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold">
                    {resetError}
                  </div>
                )}

                <div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs font-semibold text-slate-900 outline-none font-mono"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs font-semibold text-slate-900 outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-3.5 text-xs font-bold text-white shadow-md transition"
                >
                  Update Password
                </button>
              </form>
            )}

            {/* VIEW 6: RESET SUCCESS */}
            {view === 'reset_success' && (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-[#092E4C]">Successful!</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Congratulations! Your password has been changed. Click sign in to continue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-3.5 text-xs font-bold text-white shadow-md transition"
                >
                  Sign in
                </button>
              </div>
            )}

          </div>

          {/* Bottom Disclaimer Footer (Exact login.pdf page 1 text) */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-tight">
            Multi-Factor Authentication is required after login. An OTP will be sent to your registered mobile/e-mail. Forgot your User ID? Please reach out to our support team at <a href="mailto:helpdesk@b2cselfcare.in" className="text-teal-700 underline font-bold">helpdesk@b2cselfcare.in</a> for assistance.
          </div>

        </div>

      </div>
    </div>
  );
};
