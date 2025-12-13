import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/UserType"; // Adjust the path based on where your User type is defined

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student"
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await apiPost("/auth/signup", form) as { token: string; user: User };
      login(data.token, data.user);
      navigate("/dashboard/student");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-8 rounded-xl w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold mb-4">Sign Up</h1>

        <input name="name" onChange={handleChange} value={form.name}
          className="w-full border p-2 rounded mb-2" placeholder="Name" />

        <input name="email" onChange={handleChange} value={form.email}
          className="w-full border p-2 rounded mb-2" placeholder="Email" />

        <input name="password" type="password"
          onChange={handleChange} value={form.password}
          className="w-full border p-2 rounded mb-2" placeholder="Password" />

        <select name="role" value={form.role} onChange={handleChange}
          className="w-full border p-2 rounded mb-4">
          <option value="student">Student</option>
          <option value="employer">Employer</option>
        </select>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button type="submit" className="w-full bg-black text-white py-2 rounded-full">
          Create Account
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
