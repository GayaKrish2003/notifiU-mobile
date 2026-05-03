import React, { useEffect, useState, ChangeEvent } from 'react';
import {
  X, Mail, Phone, MapPin, University, GraduationCap,
  Award, CalendarDays, IdCard, Save, BookOpen, Briefcase, Plus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { updateUserByAdmin } from '../services/api';

type ApiError = {
  response?: { data?: { message?: string } };
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

interface AdminUserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData | null;
  onUpdate?: () => void;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, label, value, isEditing, onChange, name, type = "text" }) => (
  <div className={`bg-gray-50/80 border ${isEditing ? 'border-[#FBB017] ring-1 ring-[#FBB017]/10' : 'border-gray-100'} p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300`}>
    <div className="flex items-center gap-3">
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-50">
        <Icon size={14} className="text-[#FBB017]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight mb-0.5">{label}</p>
        <input
          type={type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          className="w-full text-xs text-[#2D3A5D] font-bold bg-transparent border-none outline-none p-0 focus:ring-0 placeholder:text-gray-300"
          placeholder={`Enter ${label}...`}
        />
      </div>
    </div>
  </div>
);

const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({ isOpen, onClose, userData, onUpdate }) => {
  const [editData, setEditData] = useState<UserData>({ name: '' });
  const [saving, setSaving] = useState<boolean>(false);
  const [displayData, setDisplayData] = useState<DisplayData>({
    name: '',
    id: '',
    initials: '',
    role: ''
  });

  useEffect(() => {
    if (userData) {
      setEditData(userData);
      const names = userData.name.trim().split(' ');
      const initials = names.length >= 2
        ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
        : userData.name.substring(0, 2).toUpperCase();
      const displayId = userData.studentId || userData.lecturerId || userData._id?.substring(0, 8).toUpperCase() || 'ID';

      setDisplayData({
        name: userData.name,
        id: displayId,
        initials: initials,
        role: userData.role || 'User'
      });
    }
  }, [userData]);

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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!userData?._id) return;
    try {
      setSaving(true);
      const response = await updateUserByAdmin(userData._id, editData);
      if (response.data.success) {
        alert('User profile updated successfully');
        if (onUpdate) onUpdate();
        onClose();
      }
    } catch (err: unknown) {
      alert((err as ApiError).response?.data?.message || 'Failed to update user profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !userData) return null;

  return (
    <div
      className="fixed inset-0 bg-[#1A1C2C]/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20 animate-in slide-in-from-bottom-8 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1A1C2C] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FBB017]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

          <div className="flex items-center justify-between relative z-10 mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Edit User Profile</h3>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FBB017] to-[#e9a215] rounded-full flex items-center justify-center text-[#2D3A5D] text-2xl font-black shadow-lg border-2 border-white/20 overflow-hidden">
                {editData.profileImage ? (
                  <img src={editData.profileImage as string} alt="User Profile" className="w-full h-full object-cover" />
                ) : (
                  displayData.initials
                )}
              </div>

              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                <Plus className="text-white" size={24} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                name="name"
                value={editData.name ?? ''}
                onChange={handleChange}
                className="bg-white/5 border-b border-[#FBB017] text-xl font-black tracking-tight mb-2 uppercase w-full outline-none focus:bg-white/10 px-2 py-1 rounded transition-all"
              />
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
        <div className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard icon={Mail} label="Email Address" value={editData.email as string} isEditing={true} onChange={handleChange} name="email" />
            <InfoCard icon={Phone} label="Phone Number" value={editData.phonenumber as string} isEditing={true} onChange={handleChange} name="phonenumber" />
            <InfoCard icon={IdCard} label="NIC Number" value={editData.nic as string} isEditing={true} onChange={handleChange} name="nic" />
            <InfoCard icon={CalendarDays} label="Age" value={editData.age as string} isEditing={true} onChange={handleChange} name="age" type="number" />
            <InfoCard icon={MapPin} label="Address" value={editData.address as string} isEditing={true} onChange={handleChange} name="address" />

            {userData.role === 'student' && (
              <>
                <InfoCard icon={University} label="University" value={editData.university as string} isEditing={true} onChange={handleChange} name="university" />
                <InfoCard icon={GraduationCap} label="Faculty" value={editData.faculty as string} isEditing={true} onChange={handleChange} name="faculty" />
                <InfoCard icon={Award} label="Academic Year" value={editData.academicYear as string} isEditing={true} onChange={handleChange} name="academicYear" />
                <InfoCard icon={IdCard} label="Student ID" value={editData.studentId as string} isEditing={true} onChange={handleChange} name="studentId" />
              </>
            )}

            {userData.role === 'lecturer' && (
              <>
                <InfoCard icon={University} label="University" value={editData.university as string} isEditing={true} onChange={handleChange} name="university" />
                <InfoCard icon={BookOpen} label="Department" value={editData.department as string} isEditing={true} onChange={handleChange} name="department" />
                <InfoCard icon={IdCard} label="Lecturer ID" value={editData.lecturerId as string} isEditing={true} onChange={handleChange} name="lecturerId" />
              </>
            )}

            {userData.role === 'jobprovider' && (
              <>
                <InfoCard icon={Briefcase} label="Company Name" value={editData.companyName as string} isEditing={true} onChange={handleChange} name="companyName" />
                <InfoCard icon={IdCard} label="Designation" value={editData.designation as string} isEditing={true} onChange={handleChange} name="designation" />
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 bg-[#1A1C2C] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-[#2D3A5D] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 group"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={18} className="text-[#FBB017] group-hover:scale-110 transition-transform" />
            )}
            <span className="text-xs uppercase tracking-[0.2em]">{saving ? 'Updating Database...' : 'Save User Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserEditModal;
