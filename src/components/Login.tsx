import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Github, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Auth Started");
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        if (!userCred.user.emailVerified) {
          setError('Please verify your email before logging in. Check your inbox.');
          await auth.signOut();
        }
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCred.user);
        setVerificationSent(true);
        await auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("Auth Started");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-zinc-50/50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-zinc-100"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-display font-black text-zinc-900">
            {isLogin ? 'Welcome Back' : 'Join PreExamWale'}
          </h2>
          <p className="text-zinc-500 font-medium">
            {isLogin ? 'Access your practice history and analytics' : 'Start your journey to exam success'}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-500 rounded-2xl text-sm font-medium border border-red-100 animate-pulse">
            {error}
          </div>
        )}

        {verificationSent && (
          <div className="p-4 mb-6 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-medium border border-emerald-100">
            Check your email to verify account. Please check your inbox and log in once verified.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Mail size={14} /> Email Address
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl transition-all outline-none text-zinc-900 font-medium"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Lock size={14} /> Password
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl transition-all outline-none text-zinc-900 font-medium"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-zinc-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
          <div className="relative flex justify-center text-[10px] font-black font-black text-zinc-400 uppercase bg-white px-4">Continue with</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 py-4 border-2 border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.32-1.92 4.36-1.02 1.04-2.52 1.84-5.92 1.84-5.4 0-9.84-4.36-9.84-9.8s4.44-9.8 9.84-9.8c2.44 0 4.48.88 5.48 1.88l2.32-2.32C18.48 1.24 15.68 0 12.48 0 5.56 0 0 5.56 0 12.5s5.56 12.5 12.48 12.5c3.76 0 6.6-1.24 8.84-3.56 2.32-2.32 3.12-5.56 3.12-8.24 0-.84-.08-1.64-.24-2.44H12.48z" />
            </svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-3 py-4 border-2 border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-sm">
            <Github size={20} />
            GitHub
          </button>
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-black text-brand-primary uppercase tracking-widest hover:underline"
          >
            {isLogin ? "Don't have an account? Join Now" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
