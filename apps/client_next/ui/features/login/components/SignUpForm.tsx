"use client";
import React, { useState } from 'react';

interface SignUpFormProps {
  onSuccess?: () => void;
}

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '',
};

import { useRouter } from 'next/navigation';
import GoogleOAuthButton from './GoogleOAuthButton';

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!form.firstName || !form.lastName) {
      setError('Please enter your name');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        gender: form.gender,
      };
      const res = await fetch('https://api.domrov.app/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Signup failed');
      }
      if (onSuccess) onSuccess();
      // Redirect to sign-in page after successful registration
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row shadow-xl rounded-lg overflow-hidden w-full max-w-3xl">
        {/* Left Panel */}
        <aside className="text-white flex items-center justify-center md:w-80 w-full h-96 md:h-auto" style={{backgroundColor: '#0b0b3a'}}>
          <div className="text-3xl font-extrabold tracking-wider">DOMROV</div>
        </aside>

        {/* Form Card */}
        <main className="flex-1 flex items-center justify-center bg-white">
          <div className="w-full max-w-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Last Name</label>
                  <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required className="rounded-lg border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" style={{color:'#222'}} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">First Name</label>
                  <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required className="rounded-lg border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" style={{color:'#222'}} />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Gender</label>
                <input name="gender" placeholder="Male / Female" value={form.gender} onChange={handleChange} className="rounded-lg border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" style={{color:'#222'}} />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Email</label>
                <input name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required type="email" className="rounded-lg border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" style={{color:'#222'}} />
              </div>

              {/* Profile picture input removed as requested */}

              <div className="flex flex-col mt-2">
                <label className="text-xs text-gray-600 mb-1">Password</label>
                <input name="password" placeholder="Password" value={form.password} onChange={handleChange} required type="password" className="rounded-lg border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" style={{color:'#222'}} />
              </div>

              <div className="flex flex-col mt-2">
                <label className="text-xs text-gray-600 mb-1">Confirm Password</label>
                <input name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required type="password" className="rounded-lg border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" style={{color:'#222'}} />
              </div>

              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

              {/* Google Sign Up Button - moved above submit */}
              <div className="mt-6 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-2">or sign up with</span>
                <GoogleOAuthButton redirectUrl="https://api.domrov.app/auth/google/login/" />
              </div>

              <div className="flex items-center justify-between mt-2">
                <a href="/login" className="text-gray-500 hover:text-indigo-700 text-sm">← Back to login</a>
                <button type="submit" disabled={loading} className="text-white px-6 py-2 rounded-full font-semibold shadow-md transition-all duration-150 disabled:opacity-50" style={{backgroundColor: '#0b0b3a', border: 'none'}}>
                  {loading ? 'Saving...' : 'Next'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

/* Styles */
const pageStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  background: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
};

const leftPanelStyle: React.CSSProperties = {
  width: 280,
  height: 560,
  background: '#0b0b3a',
  color: '#fff',
  borderTopLeftRadius: 8,
  borderBottomLeftRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const sideLogoStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: 2,
};

const mainStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  width: 500,
};

const cardStyle: React.CSSProperties = {
  width: 500,
  height: 560,
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  boxShadow: '0 6px 24px rgba(10,10,10,0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  overflowY: 'auto',
};

const brandStyle: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 800,
  color: '#0b0b3a',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#666',
  marginTop: 4,
  marginBottom: 8,
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginTop: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#666',
  marginBottom: 6,
};

const labelStyleSmall: React.CSSProperties = {
  fontSize: 11,
  color: '#9aa0a6',
  marginBottom: 6,
};

const fieldWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const inputStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid #e6e6e6',
  fontSize: 14,
  color: '#222',
  outline: 'none',
  boxShadow: 'none',
};

const smallInputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #e6e6e6',
  width: '100%',
  fontSize: 13,
  color: '#222',
};

const primaryButtonStyle: React.CSSProperties = {
  background: '#012b2b',
  color: '#fff',
  padding: '10px 22px',
  borderRadius: 20,
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
};