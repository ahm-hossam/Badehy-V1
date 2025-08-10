"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import { storeUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Client-side validation
    if (!form.email.trim()) {
      setMessageType("error");
      setMessage("Email is required.");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!form.password) {
      setMessageType("error");
      setMessage("Password is required.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setMessageType("error");
      setMessage("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      console.log('Login attempt for:', form.email);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          rememberMe: form.rememberMe
        }),
      });
      
      console.log('Login response status:', res.status);
      
      const data = await res.json();
      console.log('Response:', data);
      
      if (res.ok) {
        setMessageType("success");
        setMessage("Login successful! Redirecting to dashboard...");
        
        // Store user data and auto-login
        if (data.user) {
          storeUser(data.user, form.rememberMe);
          console.log('User logged in, redirecting to home page');
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            router.push('/');
          }, 1500);
        }
      } else if (res.status === 403) {
        // Blocked due to subscription status, redirect to blocked page with message
        const reason = encodeURIComponent(data.error || 'Your subscription has ended.');
        router.push(`/auth/blocked?reason=${reason}&email=${encodeURIComponent(form.email)}`);
      } else {
        setMessageType("error");
        setMessage(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessageType("error");
      setMessage(`Network error: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-zinc-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Welcome back! Please enter your details
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg border ${
              messageType === "success" 
                ? "bg-green-50 border-green-200 text-green-800" 
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {messageType === "success" ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {messageType === "success" ? "Success" : "Error"}
                  </p>
                  <p className="text-sm mt-1">{message}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                Email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={(checked) => setForm({ ...form, rememberMe: checked })}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-zinc-700">
                  Remember me
                </label>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-zinc-600">
            Don't have an account?{" "}
            <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 