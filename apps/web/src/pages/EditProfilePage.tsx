import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, User, Mail, Camera, Loader2 } from "lucide-react";
import Logo from "../components/Logo";
import {
  getEditProfileRequest,
  updateEditProfileRequest,
} from "../services/api";

interface FormData {
  name: string;
  email: string;
  profileImage: string;
  [key: string]: unknown;
}

interface UserProfile {
  name: string;
  email: string;
  profileImage?: string;
}

interface CurrentUser {
  _id: string;
  name: string;
  profileImage?: string;
  [key: string]: unknown;
}

const EditProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    profileImage: "",
  });
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getEditProfileRequest(id);
        if (response.data.success) {
          const { name, email, profileImage } = response.data
            .user as UserProfile;
          setFormData({ name, email, profileImage: profileImage || "" });
          setPreview(profileImage || "");
        }
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to load profile data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        setFormData((prev) => ({ ...prev, profileImage: base64String }));
      };
      reader.onerror = () => {
        setError("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await updateEditProfileRequest(id, formData);
      if (response.data.success) {
        setSuccess("Profile updated successfully!");
        const currentUser: CurrentUser | null = JSON.parse(
          localStorage.getItem("user") || "null",
        );
        if (currentUser && currentUser._id === id) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...currentUser,
              name: response.data.user.name,
              profileImage: response.data.user.profileImage,
            }),
          );
        }
        setTimeout(() => navigate(-1), 1500);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update profile";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 animate-spin text-[#FBB017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <Logo className="mb-2" />
            <h2 className="text-gray-400 font-medium text-lg">
              Edit Your Profile
            </h2>
          </div>

          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-gray-500 hover:text-[#FBB017] transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" /> Back
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm mb-6 text-center animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-sm mb-6 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FBB017]/20 shadow-lg bg-gray-50 flex items-center justify-center">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="text-gray-200" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#FBB017] p-3 rounded-full text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-lg border-2 border-white">
                  <Camera size={20} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Click the camera icon to upload a photo
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-[#FBB017] outline-none transition-all placeholder:text-gray-400"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2 pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-[#F0F2F5] border-none rounded-2xl p-4 pl-12 opacity-70 cursor-not-allowed"
                    placeholder="Email cannot be changed"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#FBB017] hover:bg-[#e9a215] text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
