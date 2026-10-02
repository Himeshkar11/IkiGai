import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  HomeIcon,
  FoodIcon,
  RoomIcon,
  MoneyIcon,
  SunIcon,
  MoonIcon,
  PanelLeftIcon,
  SearchIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  FileTextIcon,
} from './Icons';
import nutritionService from '../services/nutritionService';

const CommandPalette = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleSidebar,
    sidebarState,
  } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cacheMessage, setCacheMessage] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setCacheMessage(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const commands = [
    {
      id: 'nav-overview',
      title: 'Go to Overview',
      subtitle: 'Daily focus, task list & active habits',
      icon: HomeIcon,
      shortcut: 'G O',
      action: () => navigate('/'),
    },
    {
      id: 'nav-food',
      title: 'Go to Food & Nutrition',
      subtitle: 'Meal logs, macros & AI food estimates',
      icon: FoodIcon,
      shortcut: 'G F',
      action: () => navigate('/food'),
    },
    {
      id: 'nav-room',
      title: 'Go to Room & Habits',
      subtitle: 'Living space routines and task tracker',
      icon: RoomIcon,
      shortcut: 'G R',
      action: () => navigate('/room'),
    },
    {
      id: 'nav-money',
      title: 'Go to Finances',
      subtitle: 'Expense logs and monthly totals',
      icon: MoneyIcon,
      shortcut: 'G M',
      action: () => navigate('/money'),
    },
    {
      id: 'toggle-theme',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle interface color scheme',
      icon: theme === 'dark' ? SunIcon : MoonIcon,
      shortcut: 'T',
      action: () => toggleTheme(),
    },
    {
      id: 'toggle-sidebar',
      title:
        sidebarState === 'expanded'
          ? 'Collapse Sidebar to Rail'
          : sidebarState === 'rail'
          ? 'Hide Sidebar (Off-canvas)'
          : 'Expand Sidebar',
      subtitle: 'Cycle desktop sidebar: Expanded -> Rail -> Hidden',
      icon: PanelLeftIcon,
      shortcut: '[',
      action: () => toggleSidebar(),
    },
    {
      id: 'clear-nutrition-cache',
      title: 'Clear Nutrition AI Cache',
      subtitle: 'Reset cached food macros and local Indian food store',
      icon: DatabaseIcon,
      shortcut: '',
      action: async () => {
        await nutritionService.clearCache();
        setCacheMessage('Nutrition cache cleared!');
        setTimeout(() => setCacheMessage(null), 2500);
      },
    },
    {
      id: 'nav-privacy',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy commitments',
      icon: ShieldCheckIcon,
      shortcut: '',
      action: () => navigate('/privacy'),
    },
    {
      id: 'nav-terms',
      title: 'Terms of Service',
      subtitle: 'View user agreement and guidelines',
      icon: FileTextIcon,
      shortcut: '',
      action: () => navigate('/terms'),
    },
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        if (filtered[selectedIndex].id !== 'clear-nutrition-cache') {
          setCommandPaletteOpen(false);
        }
      }
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="cmd-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-row">
          <SearchIcon size={16} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or jump to page…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="cmd-esc-hint" onClick={() => setCommandPaletteOpen(false)}>
            ESC
          </kbd>
        </div>

        {cacheMessage && (
          <div className="cmd-notice">
            <DatabaseIcon size={14} />
            <span>{cacheMessage}</span>
          </div>
        )}

        <div className="cmd-list" ref={listRef} role="listbox">
          {filtered.length === 0 ? (
            <div className="cmd-empty">No commands match &ldquo;{query}&rdquo;</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    item.action();
                    if (item.id !== 'clear-nutrition-cache') {
                      setCommandPaletteOpen(false);
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="cmd-item-icon">
                    <Icon size={16} />
                  </span>
                  <div className="cmd-item-text">
                    <span className="cmd-item-title">{item.title}</span>
                    <span className="cmd-item-sub">{item.subtitle}</span>
                  </div>
                  {item.shortcut && (
                    <kbd className="cmd-item-shortcut">{item.shortcut}</kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-footer-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>[</kbd> Toggle sidebar</span>
            <span><kbd>N</kbd> New task</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
