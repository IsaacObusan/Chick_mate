import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const SignUpPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("suffix", suffix);
    formData.append("email", email);
    formData.append("phoneNumber", phoneNumber);
    formData.append("password", password);
    formData.append("role", role);
    if (profileFile) formData.append("profilePic", profileFile);

    // Validate inputs
    const newErrors: { [key: string]: string } = {};
    if (!username) {
      newErrors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain alphanumeric characters and underscores.";
    }
    if (!firstName) {
      newErrors.firstName = "First Name is required.";
    } else if (!/^[a-zA-Z]+$/.test(firstName)) {
      newErrors.firstName = "First Name can only contain alphabetical characters.";
    }
    if (!lastName) {
      newErrors.lastName = "Last Name is required.";
    } else if (!/^[a-zA-Z]+$/.test(lastName)) {
      newErrors.lastName = "Last Name can only contain alphabetical characters.";
    }
    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
      newErrors.email = "Invalid email format.";
    }
    if (!phoneNumber) {
      newErrors.phoneNumber = "Phone Number is required.";
    } else if (!/^(09|\+639)\d{9}$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Phone Number must be 11 digits and start with 09 or +639.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    } else if (password.length > 255) {
      newErrors.password = "Password must be at most 255 characters.";
    } else if (!/(?=.*[a-z])/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter.";
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter.";
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain at least one number.";
    } else if (!/(?=.*[!@#$%^&*])/.test(password)) {
      newErrors.password = "Password must contain at least one special character (!@#$%^&*).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/adduser", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("✅ User registered successfully!");
        resetForm();
      } else {
        const error = await response.text();
        alert("Error: " + error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to register user. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setFirstName("");
    setLastName("");
    setSuffix("");
    setEmail("");
    setPhoneNumber("");
    setPassword("");
    setRole("user");
    setProfileFile(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));

    switch (name) {
      case "username":
        setUsername(value);
        break;
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "suffix":
        setSuffix(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "phoneNumber":
        setPhoneNumber(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "role":
        setRole(value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg p-8 bg-white border border-gray-200 shadow-lg rounded-xl"
      >
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Sign Up
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">Username</span>
            <input
              type="text"
              placeholder="e.g., john_isaac"
              value={username}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="username"
            />
            {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">First Name</span>
            <input
              type="text"
              placeholder="e.g., John"
              value={firstName}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="firstName"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">Last Name</span>
            <input
              type="text"
              placeholder="e.g., Obusan"
              value={lastName}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="lastName"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">Suffix</span>
            <input
              type="text"
              placeholder="e.g., Jr. or Sr."
              value={suffix}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="suffix"
            />
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">Email</span>
            <input
              type="email"
              placeholder="e.g., john.isaac@example.com"
              value={email}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">Phone Number</span>
            <input
              type="tel"
              placeholder="e.g., 09123456789 or +639123456789"
              value={phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="phoneNumber"
            />
            {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">Password</span>
            <input
              type="password"
              placeholder="e.g., P@ssw0rd!"
              value={password}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-gray-700">Role</span>
            <select
              value={role}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              name="role"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <label className="block mt-4">
          <span className="block mb-1 font-medium text-gray-700">Profile Picture</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`mt-6 w-full p-3 text-white rounded-lg font-semibold transition-colors ${
            loading ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;
