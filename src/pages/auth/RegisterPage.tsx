// src/pages/auth/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (formData.password !== formData.confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }
    if (formData.password.length < 6) {
      setFeedback({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);

    try {
      const { fullName, email, phone, password } = formData;
      await axios.post(
        "http://localhost:5003/auth/register-patient",
        { fullName, email, phone, password },
        { headers: { "Content-Type": "application/json" } }
      );

      setFeedback({
        type: "success",
        message:
          "Registration successful! Please check your email to verify your account and complete the setup.",
      });
      // Optionally, disable the form or redirect after a delay
      setTimeout(() => {
         navigate("/login");
      }, 5000);

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setFeedback({
          type: "error",
          message:
            error.response.data.message ||
            "Registration failed. Please try again.",
        });
      } else {
        setFeedback({
          type: "error",
          message: "An unexpected network error occurred.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const FeedbackIcon = () => {
    if (!feedback) return null;
    switch (feedback.type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border border-gray-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create a Patient Account
          </CardTitle>
          <CardDescription>
            Join our platform to manage your health with ease.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {feedback && (
              <Alert
                variant={feedback.type === "error" ? "destructive" : "default"}
                className={feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
              >
                <FeedbackIcon />
                <AlertTitle>
                  {feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}
                </AlertTitle>
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                onChange={handleChange}
                required
                placeholder="078..."
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                onChange={handleChange}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || feedback?.type === "success"}
            >
              {loading ? "Registering..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;