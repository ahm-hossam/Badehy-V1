"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import { detectUserCountry } from "@/lib/country";
import { storeUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    countryCode: "1", // Default to US
    countryName: "United States", // Default to US
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);
  const [countryLoading, setCountryLoading] = useState(true);

  // Detect user's country on component mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const detectedCountry = await detectUserCountry();
        setForm(prev => ({
          ...prev,
          countryCode: detectedCountry.dialCode,
          countryName: detectedCountry.name,
        }));
        console.log('Country detected and set:', detectedCountry);
      } catch (error) {
        console.error('Error detecting country:', error);
      } finally {
        setCountryLoading(false);
      }
    };

    detectCountry();
  }, []);

  // Log form changes for debugging
  useEffect(() => {
    console.log('Form state changed:', form);
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (value: string, country: any) => {
    console.log('Phone change:', { value, country });
    setForm({
      ...form,
      phoneNumber: value,
      countryCode: country.dialCode,
      countryName: country.name,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Client-side validation
    if (!form.fullName.trim()) {
      setMessageType("error");
      setMessage("Full name is required.");
      setLoading(false);
      return;
    }

    if (!form.email.trim()) {
      setMessageType("error");
      setMessage("Email is required.");
      setLoading(false);
      return;
    }

    if (!form.phoneNumber.trim()) {
      setMessageType("error");
      setMessage("Phone number is required.");
      setLoading(false);
      return;
    }

    if (!form.countryCode || !form.countryName) {
      setMessageType("error");
      setMessage("Please select a valid country.");
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

    if (!form.confirmPassword) {
      setMessageType("error");
      setMessage("Please confirm your password.");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      console.log('Form data being sent:', form);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      console.log('Registration response status:', res.status);
      
      const data = await res.json();
      console.log('Response:', data);
      
      if (res.ok) {
        setMessageType("success");
        setMessage("Registration successful! Redirecting to dashboard...");
        
        // Store user data and auto-login
        if (data.user) {
          storeUser(data.user);
          console.log('User stored, redirecting to home page');
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            router.push('/');
          }, 1500);
        }
      } else {
        setMessageType("error");
        setMessage(data.error || "Registration failed.");
      }
    } catch (err) {
      console.error('Registration error:', err);
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Join us and get started with your account
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
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 mb-1">
                Full Name *
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

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

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                {countryLoading ? (
                  <div className="flex items-center justify-center h-12 px-3 border border-zinc-300 rounded-lg bg-zinc-50">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-600"></div>
                    <span className="ml-2 text-sm text-zinc-500">Detecting your country...</span>
                  </div>
                ) : (
                  <PhoneInput
                    country={form.countryCode === "1" ? "us" : form.countryCode === "44" ? "gb" : "us"}
                    value={form.phoneNumber}
                    onChange={handlePhoneChange}
                    inputClass="!w-full !h-12 !px-3 !border !border-zinc-300 !rounded-lg !text-zinc-900 !bg-white focus:!ring-2 focus:!ring-blue-500 focus:!border-blue-500"
                    buttonClass="!border !border-zinc-300 !rounded-l-lg !bg-white"
                    dropdownClass="!border !border-zinc-300 !rounded-lg !shadow-lg"
                    enableSearch={true}
                    searchPlaceholder="Search country..."
                    searchNotFound="No country found"
                    preferredCountries={['us', 'gb', 'ca', 'au']}
                    autoFormat={true}
                    disableSearchIcon={false}
                    countryCodeEditable={false}
                  />
                )}
              </div>
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
                  placeholder="Enter your password (min 8 characters)"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || countryLoading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
    </form>

        <div className="text-center">
          <p className="text-sm text-zinc-600">
            Already have an account?{" "}
            <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 