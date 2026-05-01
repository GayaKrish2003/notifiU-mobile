import React, { useEffect, useState, ChangeEvent } from 'react';
import {
  X, Mail, Phone, MapPin, University, GraduationCap,
  Award, CalendarDays, IdCard, Edit3, LogOut,
  Briefcase, Save, BookOpen, Plus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getUserProfile, updateUserProfile, getLecturerProfile, updateLecturerProfile } from '../services/api';

type ApiError = {
  response?: { data?: { message?: string }; status?: number };
};

interface UserData {
  _id?: string;
  name: string;
  email?: string;
  role?: string;
  profileImage?: string;
  phonenumber?: string;
  nic?: string;
  address?: string;
  age?: string | number;
  studentId?: string;
  lecturerId?: string;
  university?: string;
  faculty?: string;
  academicYear?: string;
  department?: string;
  companyName?: string;
  designation?: string;
  accessToken?: string;
  [key: string]: unknown;
}

interface DisplayData {
  name: string;
  id: string;
  initials: string;
  role: string;
}

interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  value?: string | number;
  isEditing: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  type?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpdate: (data: UserData) => void;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, label, value, isEditing, onChange, name, type = "text" }) => (
  <div className={`bg-gray-50/80 border ${isEditing ? 'border-[#FBB017] ring-1 ring-[#FBB017]/10' : 'border-gray-100'} p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300`}>
    <div className="flex items-center gap-3">
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-50">
        <Icon size={14} className="text-[#FBB017]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight mb-0.5">{label}</p>
        {isEditing ? (
          <input
            type={type}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            className="w-full text-xs text-[#2D3A5D] font-bold bg-transparent border-none outline-none p-0 focus:ring-0 placeholder:text-gray-300"
            placeholder={`Enter ${label}...`}
          />
        ) : (
          <p className="text-xs text-[#2D3A5D] font-bold truncate">{value || 'N/A'}</p>
        )}
      </div>
    </div>
  </div>
);

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onLogout, onUpdate }) => {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editData, setEditData] = useState<UserData>({ name: '' });
  const [displayData, setDisplayData] = useState<DisplayData>({
    name: '',
    id: '',
    initials: '',
    role: ''
  });

  const formatHeader = (data: UserData): void => {
    if (!data) return;
    const names = data.name.trim().split(' ');
    const initials = names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : data.name.substring(0, 2).toUpperCase();
    const displayId = data.studentId || data.lecturerId || data._id?.substring(0, 8).toUpperCase() || 'ID12345678';

    setDisplayData({
      name: data.name,
      id: displayId,
      initials: initials,
      role: data.role || 'User'
    });
  };

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('user');
      if (saved) {
        const parsed = JSON.parse(saved) as UserData;
        setProfile(parsed);
        setEditData(parsed);
        formatHeader(parsed);
      }
      fetchFreshProfile();
    } else {
      setIsEditing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenEdit = (): void => {
      setTimeout(() => setIsEditing(true), 50);
    };
    window.addEventListener('open-profile-edit', handleOpenEdit);
    return () => window.removeEventListener('open-profile-edit', handleOpenEdit);
  }, []);

  const fetchFreshProfile = async (): Promise<void> => {
    try {
      setLoading(true);

      const saved = localStorage.getItem('user');
      const parsedSaved: UserData = saved ? JSON.parse(saved) : { name: '' };
      const role = parsedSaved.role;

      const response = role === 'lecturer'
        ? await getLecturerProfile()
        : await getUserProfile();

      if (response.data.success) {
        const fresh = response.data.user as UserData;
        setProfile(fresh);
        setEditData(fresh);
        formatHeader(fresh);

        const updated = { ...parsedSaved, ...fresh };
        localStorage.setItem('user', JSON.stringify(updated));

        if (onUpdate) onUpdate(updated);
      }
    } catch (err: unknown) {
      console.warn('Could not fetch fresh profile, using cached data:', (err as ApiError).response?.status);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditData(prev => ({ ...prev, profileImage: base64String }));
        setProfile(prev => prev ? { ...prev, profileImage: base64String } : prev);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);

      const role = profile?.role;
      const response = role === 'lecturer'
        ? await updateLecturerProfile(editData)
        : await updateUserProfile(editData);

      if (response.data.success) {
        const updatedUser = response.data.user as UserData;
        setProfile(updatedUser);
        formatHeader(updatedUser);

        const saved = localStorage.getItem('user');
        const parsedSaved: UserData = saved ? JSON.parse(saved) : { name: '' };
        const fullyUpdated = { ...parsedSaved, ...updatedUser };

        localStorage.setItem('user', JSON.stringify(fullyUpdated));
        setIsEditing(false);
        if (onUpdate) onUpdate(fullyUpdated);
      }
    } catch (err: unknown) {
      alert((err as ApiError).response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#1A1C2C]/50 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(26,28,44,0.3)] border border-white/20 animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1A1C2C] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FBB017]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 border-2 border-[#FBB017]/10 rounded-full blur-[2px]"></div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FBB017] to-[#e9a215] rounded-full flex items-center justify-center text-[#2D3A5D] text-2xl font-black shadow-lg border-2 border-white/20 overflow-hidden">
                {profile?.profileImage ? (
                  <img src={profile.profileImage as string} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  displayData.initials
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-4 h-4 rounded-full border-2 border-[#1A1C2C]"></div>

              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer hover:bg-black/50 transition-all">
                  <Plus className="text-white" size={24} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editData.name ?? ''}
                  onChange={handleChange}
                  className="bg-white/5 border-b border-[#FBB017] text-xl font-black tracking-tight mb-1 uppercase w-full outline-none focus:bg-white/10 px-2 py-1 rounded"
                />
              ) : (
                <h3 className="text-xl font-black tracking-tight mb-1 uppercase truncate px-2">
                  {displayData.name || 'FULL USER NAME'}
                </h3>
              )}
              <div className="flex items-center gap-2 px-2">
                <span className="bg-[#FBB017] px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-[#2D3A5D]">
                  {displayData.id}
                </span>
                <span className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase text-white/60">
                  {displayData.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8">
          {loading && !profile ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#FBB017]/30 border-t-[#FBB017] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={Mail} label="Email" value={editData.email as string} isEditing={false} onChange={handleChange} name="email" />
              <InfoCard icon={Phone} label="Phone" value={editData.phonenumber as string} isEditing={isEditing} onChange={handleChange} name="phonenumber" />
              <InfoCard icon={IdCard} label="NIC" value={editData.nic as string} isEditing={isEditing} onChange={handleChange} name="nic" />
              <InfoCard icon={MapPin} label="Address" value={editData.address as string} isEditing={isEditing} onChange={handleChange} name="address" />
              <InfoCard icon={CalendarDays} label="Age" value={editData.age as string} isEditing={isEditing} onChange={handleChange} name="age" type="number" />

              {profile?.role === 'student' && (
                <>
                  <InfoCard icon={University} label="Institute" value={editData.university as string} isEditing={isEditing} onChange={handleChange} name="university" />
                  <InfoCard icon={GraduationCap} label="Faculty" value={editData.faculty as string} isEditing={isEditing} onChange={handleChange} name="faculty" />
                  <InfoCard icon={Award} label="Academic Year" value={editData.academicYear as string} isEditing={isEditing} onChange={handleChange} name="academicYear" />
                </>
              )}

              {profile?.role === 'lecturer' && (
                <>
                  <InfoCard icon={University} label="University" value={editData.university as string} isEditing={isEditing} onChange={handleChange} name="university" />
                  <InfoCard icon={BookOpen} label="Department" value={editData.department as string} isEditing={isEditing} onChange={handleChange} name="department" />
                </>
              )}

              {profile?.role === 'jobprovider' && (
                <>
                  <InfoCard icon={Briefcase} label="Company" value={editData.companyName as string} isEditing={isEditing} onChange={handleChange} name="companyName" />
                  <InfoCard icon={IdCard} label="Designation" value={editData.designation as string} isEditing={isEditing} onChange={handleChange} name="designation" />
                </>
              )}
            </div>
          )}

          {/* Action Section */}
          <div className="flex gap-4 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FBB017] text-[#2D3A5D] font-black py-4 rounded-2xl shadow-lg hover:bg-[#e9a215] transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-[#2D3A5D]/30 border-t-[#2D3A5D] rounded-full animate-spin"></div> : <Save size={16} />}
                  <span className="text-xs uppercase tracking-widest">{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) setEditData(profile);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-[#2D3A5D] font-black py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  <X size={16} />
                  <span className="text-xs uppercase tracking-widest">Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1A1C2C] text-white font-black py-4 rounded-2xl shadow-lg hover:bg-[#2D3A5D] transition-all active:scale-[0.98]"
                >
                  <Edit3 size={16} className="text-[#FBB017]" />
                  <span className="text-xs uppercase tracking-widest">Edit</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-red-500 font-black py-4 rounded-2xl border border-red-50 hover:bg-red-100 transition-all active:scale-[0.98]"
                >
                  <LogOut size={16} />
                  <span className="text-xs uppercase tracking-widest">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
