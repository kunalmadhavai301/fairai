import React from 'react';
import {
  LayoutDashboard,
  Scan,
  TrendingUp,
  MessageSquareText,
  History,
  Settings as SettingsIcon,
  MapPin,
  ShieldCheck,
  Compass,
  Car,
  UserCheck,
  Building2,
  Backpack,
  Map,
  Database,
  User,
} from 'lucide-react';
import { LocationInfo } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  location: LocationInfo;
  onOpenLocationModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  location,
  onOpenLocationModal,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Product', icon: Scan },
    { id: 'price-intelligence', label: 'Price Intelligence', icon: TrendingUp },
    { id: 'ask-fairbuy', label: 'Ask FairBuy', icon: MessageSquareText },
    { id: 'kumbh-guide', label: 'Kumbh Guide', icon: Compass },
    { id: 'travel', label: 'Travel', icon: Map },
    { id: 'pujari', label: 'Pujari', icon: UserCheck },
    { id: 'transport', label: 'Transport', icon: Car },
    { id: 'hotels', label: 'Hotels', icon: Building2 },
    { id: 'kumbh-kit', label: 'Kumbh KIT', icon: Backpack },
    { id: 'my-trips', label: 'My Trips', icon: Map },
    { id: 'history', label: 'History', icon: History },
    { id: 'admin', label: 'Admin Data Center', icon: Database },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 h-screen z-30 shadow-sm">
      {/* Brand Logo & Tagline Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-xl shrink-0">
            F
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base text-slate-900 tracking-tight">FairBuy</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">AI</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight truncate">Know. Compare. Explore. Travel Smart.</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Trust & Location Card at Bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Current Location</span>
            <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-extrabold text-slate-800 truncate">{location.formatted}</p>
              </div>
            </div>

            <button
              onClick={onOpenLocationModal}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors shrink-0 ml-1"
            >
              Change
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-xs font-semibold"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
