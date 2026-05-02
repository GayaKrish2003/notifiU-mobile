import React, { useState } from 'react';
import { X, Clock, Activity, Monitor, Globe, Calendar } from 'lucide-react';

interface LoginEntry {
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ActivityEntry {
  timestamp: string;
  action?: string;
  details?: string;
}

interface ActivityData {
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  loginHistory?: LoginEntry[];
  activityLog?: ActivityEntry[];
}

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityData: ActivityData | null;
}

type ActiveTab = 'logins' | 'activity';

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, activityData }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('logins');

  if (!isOpen || !activityData) return null;

  const { name, email, role, lastLogin, loginHistory = [], activityLog = [] } = activityData;

  const getInitials = (n: string): string => {
    if (!n) return 'NA';
    const parts = n.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : n.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getTimeBadge = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  return (
    <div
      className="fixed inset-0 bg-[#1A1C2C]/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 animate-in slide-in-from-bottom-8 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1A1C2C] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FBB017]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FBB017] rounded-xl flex items-center justify-center text-[#2D3A5D]">
                <Activity size={20} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">User Activity</h3>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FBB017] to-[#e9a215] rounded-full flex items-center justify-center text-[#2D3A5D] text-xl font-black shadow-lg border-2 border-white/20">
              {getInitials(name)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-black tracking-tight uppercase truncate">{name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-[#FBB017] px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-[#2D3A5D]">
                  {role}
                </span>
                <span className="text-white/40 text-[11px] font-bold">{email}</span>
              </div>
              {lastLogin && (
                <p className="text-white/30 text-[10px] font-bold mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  Last login: {formatDate(lastLogin)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('logins')}
            className={`flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'logins'
                ? 'text-[#FBB017] border-b-2 border-[#FBB017] bg-[#FFF9EE]'
                : 'text-[#2D3A5D]/40 hover:text-[#2D3A5D]/60'
            }`}
          >
            Login History ({loginHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'activity'
                ? 'text-[#FBB017] border-b-2 border-[#FBB017] bg-[#FFF9EE]'
                : 'text-[#2D3A5D]/40 hover:text-[#2D3A5D]/60'
            }`}
          >
            Activity Log ({activityLog.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {activeTab === 'logins' && (
            <div className="space-y-3">
              {loginHistory.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={40} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-300 font-bold text-sm uppercase tracking-widest">No login history</p>
                  <p className="text-gray-200 text-xs mt-1">This user has no recorded logins yet</p>
                </div>
              ) : (
                [...loginHistory].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300"
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${idx === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Globe size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[#2D3A5D] font-bold text-xs">Login Session</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                          idx === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {getTimeBadge(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-[#2D3A5D]/40 text-[10px] font-bold flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(entry.timestamp)}
                      </p>
                      {entry.ipAddress && (
                        <p className="text-[#2D3A5D]/30 text-[9px] font-bold mt-1 flex items-center gap-1">
                          <Globe size={9} />
                          IP: {entry.ipAddress}
                        </p>
                      )}
                      {entry.userAgent && (
                        <p className="text-[#2D3A5D]/20 text-[9px] font-bold mt-0.5 truncate flex items-center gap-1">
                          <Monitor size={9} />
                          {entry.userAgent.substring(0, 80)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activityLog.length === 0 ? (
                <div className="text-center py-16">
                  <Activity size={40} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-300 font-bold text-sm uppercase tracking-widest">No activity recorded</p>
                  <p className="text-gray-200 text-xs mt-1">This user has no recorded activity yet</p>
                </div>
              ) : (
                [...activityLog].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300"
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      entry.action?.includes('login') ? 'bg-blue-100 text-blue-600' :
                      entry.action?.includes('update') ? 'bg-amber-100 text-amber-600' :
                      entry.action?.includes('delete') ? 'bg-rose-100 text-rose-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[#2D3A5D] font-bold text-xs uppercase">{entry.action || 'Action'}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-gray-100 text-gray-400">
                          {getTimeBadge(entry.timestamp)}
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-[#2D3A5D]/50 text-[10px] font-bold">{entry.details}</p>
                      )}
                      <p className="text-[#2D3A5D]/30 text-[9px] font-bold mt-1 flex items-center gap-1">
                        <Calendar size={9} />
                        {formatDate(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
