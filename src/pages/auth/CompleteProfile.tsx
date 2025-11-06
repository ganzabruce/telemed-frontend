// src/pages/auth/CompleteProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface DecodedToken {
  email: string;
  role: "DOCTOR" | "PATIENT" | "RECEPTIONIST" | "HOSPITAL_ADMIN";
  hospitalId?: string;
  exp: number;
}

const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Doctor specific
    specialization: "",
    licenseNumber: "",
    consultationFee: "",
    // Patient specific
    dateOfBirth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(urlToken);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          setError("This invitation link has expired. Please request a new one.");
        } else {
          setToken(urlToken);
          setDecodedToken(decoded);
        }
      } catch (e) {
        setError("Invalid or malformed invitation link.");
      }
    } else {
      setError("No invitation token found. Please use the link from your email.");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        token,
        fullName: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        ...(decodedToken?.role === "DOCTOR" && {
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          consultationFee: parseFloat(formData.consultationFee),
        }),
        ...(decodedToken?.role === "PATIENT" && {
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        }),
      };

      await axios.post(
        "http://localhost:5002/auth/complete-invitation",
        payload
      );

      setSuccess(
        "Your account has been created successfully! You will be redirected to the login page shortly."
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.message || "An error occurred during setup."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (error && !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome! Please fill in the details below to activate your account.
            Your email is <strong>{decodedToken?.email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                onChange={handleChange}
                required
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

            {/* Role-Specific Fields */}
            {decodedToken?.role === "DOCTOR" && (
              <>
                <hr className="my-4" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Doctor Information
                </h3>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    type="text"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="consultationFee">
                    Consultation Fee (RWF)
                  </Label>
                  <Input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {decodedToken?.role === "PATIENT" && (
              <>
                <hr className="my-4" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Patient Information
                </h3>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-100 border-green-300">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfilePage;