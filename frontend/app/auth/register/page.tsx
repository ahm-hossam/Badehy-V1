"use client";
import { useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/button";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    countryCode: "",
    countryName: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful! Please login.");
        setForm({
          fullName: "",
          email: "",
          phone: "",
          countryCode: "",
          countryName: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setMessage(data.error || "Registration failed.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <Input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required />
      <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
      <Input name="countryCode" placeholder="Country Code" value={form.countryCode} onChange={handleChange} required />
      <Input name="countryName" placeholder="Country Name" value={form.countryName} onChange={handleChange} required />
      <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
      <Input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
      <Button type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</Button>
      {message && <div className="mt-2 text-center text-sm text-red-600">{message}</div>}
    </form>
  );
} 