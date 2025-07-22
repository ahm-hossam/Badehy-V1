"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import { getStoredUser, storeUser } from "@/lib/auth";
import { getAllCountries } from "@/lib/country";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    countryCode: "1",
    countryName: "United States",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load user data on component mount
  useEffect(() => {
    const storedUser = getStoredUser();
    
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }
    
    setUser(storedUser);
    
    // Load user's full profile data from API
    loadUserProfile(storedUser.id);
  }, [router]);

  const loadUserProfile = async (userId: number) => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/profile/${userId}`);
      
      if (response.ok) {
        const userData = await response.json();
        setForm({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          countryCode: userData.countryCode || "1",
          countryName: userData.countryName || "United States",
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        console.error('Failed to load profile:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handlePhoneChange = (value: string, country: any) => {
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!form.phoneNumber.trim()) {
      setMessageType("error");
      setMessage("Phone number is required.");
      setLoading(false);
      return;
    }

    // If changing password, validate password fields
    if (form.newPassword || form.confirmNewPassword) {
      if (!form.currentPassword) {
        setMessageType("error");
        setMessage("Current password is required to change password.");
        setLoading(false);
        return;
      }

      if (form.newPassword.length < 8) {
        setMessageType("error");
        setMessage("New password must be at least 8 characters long.");
        setLoading(false);
        return;
      }

      if (form.newPassword !== form.confirmNewPassword) {
        setMessageType("error");
        setMessage("New passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/profile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          countryCode: form.countryCode,
          countryName: form.countryName,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessageType("success");
        setMessage("Profile updated successfully!");
        
        // Update stored user data
        if (data.user) {
          storeUser(data.user, true); // Keep remember me setting
          setUser(data.user);
        }
        
        // Clear password fields
        setForm(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        }));
        
        // Keep isEditing true so password section stays visible
      } else {
        setMessageType("error");
        setMessage(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setMessageType("error");
      setMessage(`Network error: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your account information and settings
            </p>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
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

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={false}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={false}
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <PhoneInput
                  country={form.countryCode === "1" ? "us" : form.countryCode === "44" ? "gb" : "us"}
                  value={form.phoneNumber}
                  onChange={handlePhoneChange}
                  inputClass="!w-full !h-12 !px-3 !border !border-gray-300 !rounded-lg !text-gray-900 !bg-white focus:!ring-2 focus:!ring-blue-500 focus:!border-blue-500 disabled:!bg-gray-100 disabled:!text-gray-500"
                  buttonClass="!border !border-gray-300 !rounded-l-lg !bg-white disabled:!bg-gray-100"
                  dropdownClass="!border !border-gray-300 !rounded-lg !shadow-lg"
                  enableSearch={true}
                  searchPlaceholder="Search country..."
                  searchNotFound="No country found"
                  preferredCountries={['us', 'gb', 'ca', 'au']}
                  autoFormat={true}
                  disableSearchIcon={false}
                  countryCodeEditable={false}
                  disabled={false}
                />
              </div>
            </div>

            {/* Password Change Section */}
            {isEditing && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-600">Leave blank if you don't want to change your password</p>
                
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={form.currentPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password (min 8 characters)"
                      value={form.newPassword}
                      onChange={handleChange}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={form.confirmNewPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="px-6"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 