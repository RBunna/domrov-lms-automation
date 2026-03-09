"use client";

import { useState, useRef, useEffect } from "react";
import { 
  SearchIcon, 
  FilterIcon, 
  ClipboardIcon,
  MessageIcon,
  UsersIcon,
  FolderIcon
} from "./icons";

type TabId = "general" | "assignment" | "posts" | "students" | "files" | "grades";

interface ClassTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

/**
 * ClassTabs - Top navigation bar with tab title, search, and actions.
 * Displays the current tab and provides quick actions.
 */
export default function ClassTabs({ activeTab }: ClassTabsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  const getTabIcon = () => {
    switch (activeTab) {
      case "general":
        return ClipboardIcon;
      case "assignment":
        return ClipboardIcon;
      case "posts":
        return MessageIcon;
      case "students":
        return UsersIcon;
      case "files":
        return FolderIcon;
      case "grades":
        return ClipboardIcon;
      default:
        return ClipboardIcon;
    }
  };

  const getTabTitle = () => {
    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  const TabIconComponent = getTabIcon();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Tab Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            {TabIconComponent({ className: "w-4 h-4 text-white" })}
          </div>
          <h1 className="text-xl font-semibold text-slate-900">{getTabTitle()}</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-150"
            />
          </div>

          {/* Action Icons */}
          <button 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150" 
            title="Filter"
          >
            <FilterIcon className="w-5 h-5 text-slate-600" />
          </button>

          {/* User Profile */}
          <div className="relative ml-2" ref={menuRef}>
            {/* Profile Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                {/* User Info Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-linear-to-br from-blue-500 to-purple-600 shrink-0 flex items-center justify-center">
                      <span className="text-white font-semibold text-base">CC</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-sm">Cheng ChanPanha</p>
                      <p className="text-xs text-slate-500 truncate">student@example.com</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors duration-150 text-sm">
                    Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors duration-150 text-sm">
                    Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors duration-150 text-sm">
                    Themes
                  </button>
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors duration-150 text-sm">
                    Status
                  </button>
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors duration-150 text-sm">
                    Token
                  </button>
                </div>

                {/* Log Out */}
                <div className="border-t border-slate-100 py-1">
                  <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors duration-150 text-sm font-medium">
                    Log out
                  </button>
                </div>
              </div>
            )}

            {/* Profile Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg transition-colors duration-150"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 shrink-0 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">CC</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
