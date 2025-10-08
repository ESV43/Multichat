
import React, { useState, useEffect, useRef, FormEvent, FC, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Content, Part, Modality } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
// FIX: The CDN module for 'react-katex' does not seem to provide top-level named exports.
// Using a namespace import to access the components.
import * as ReactKatex from 'react-katex';

// ICONS (SVGs)
const LogoIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5C12 2.5 6.25 5.75 3.5 7.5L12 12.5L20.5 7.5C17.75 5.75 12 2.5 12 2.5Z" fill="#00A86B"/><path d="M3.5 16.5C3.5 16.5 3.5 11.25 3.5 7.5L12 12.5L12 21.5C12 21.5 6.25 18.25 3.5 16.5Z" fill="#00A86B"/><path d="M20.5 16.5C20.5 18.25 12 21.5 12 21.5V12.5L20.5 7.5C20.5 11.25 20.5 16.5 20.5 16.5Z" fill="#008060"/></svg>;
const NewChatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>;
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const ChatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zM6 12h12v2H6v-2zm0-3h12v2H6V9zm0-3h12v2H6V6z"/></svg>;
const LibraryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2-H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zM9 15h10V5H9v10z"/></svg>;
const IntegrationsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>;
const ExportIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const UpArrowIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>;
const AttachIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>;
const WebSearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19-.15-.24-.42-.12-.64l2 3.46c.12-.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18-.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22-.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>;
const PencilIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const MicrophoneIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/></svg>;
const StopIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>;
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>;

const DefaultPersonaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;
const CreativePersonaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const TechnicalPersonaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19-.15-.24-.42-.12-.64l2 3.46c.12-.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18-.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22-.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>;
const SocraticPersonaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM11.57 14.5c-2.05 0-3.44-1.2-3.44-2.83h1.83c0 .81.67 1.33 1.61 1.33.92 0 1.55-.45 1.55-1.24 0-1.13-1.4-1.3-2.03-1.85-1.11-.94-1.28-2.13-1.28-3.08 0-1.42 1.1-2.61 2.96-2.61 1.61 0 2.87.95 3.15 2.11l-1.7.41c-.22-.64-.73-1.03-1.45-1.03-.81 0-1.28.48-1.28 1.15 0 .97 1.18 1.23 2.33 2.24 1.14 1 1.48 2.08 1.48 3.18 0 1.79-1.39 2.92-3.48 2.92z"/></svg>;
const SummarizerPersonaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18h12v-2H4v2zm0-5h16v-2H4v2zm0-7v2h16V6H4z"/></svg>;
const CustomPersonaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;

const MODEL_OPTIONS = [
    "4x Gemini 2.5 Pro",
    "4x Gemini 2.5 Flash",
    "4x Gemini 2.5 Flash Lite",
    "Nano Banana",
];

const MODEL_MAP: { [key: string]: string } = {
    "4x Gemini 2.5 Pro": "gemini-2.5-pro",
    "4x Gemini 2.5 Flash": "gemini-2.5-flash",
    "4x Gemini 2.5 Flash Lite": "gemini-2.5-flash", // Mapped to flash as lite is not available
    "Nano Banana": "gemini-2.5-flash-image-preview",
};

const INITIAL_SYSTEM_INSTRUCTION = "You are an expert-level AI assistant. Your task is to provide a comprehensive, accurate, and well-reasoned initial response to the user's query. Aim for clarity and depth. Note: Your response is an intermediate step for other AI agents and will not be shown to the user. Be concise and focus on core information without unnecessary verbosity.";
const REFINEMENT_SYSTEM_INSTRUCTION = "You are a reflective AI agent. Your primary task is to find flaws. Critically analyze your previous response and the responses from other AI agents. Focus specifically on identifying factual inaccuracies, logical fallacies, omissions, or any other weaknesses. Your goal is to generate a new, revised response that corrects these specific errors and is free from the flaws you have identified. Note: This refined response is for a final synthesizer agent, not the user, so be direct and prioritize accuracy over conversational style.";
const SYNTHESIZER_SYSTEM_INSTRUCTION = "You are a master synthesizer AI. Your PRIMARY GOAL is to write the final, complete response to the user's query. You will be given the user's query and four refined responses from other AI agents. Your task is to analyze these responses—identifying their strengths to incorporate and their flaws to discard. Use this analysis to construct the single best possible answer for the user. Do not just critique the other agents; your output should BE the final, polished response.";

interface Persona {
    id: string;
    name: string;
    description: string;
    icon: FC;
    systemInstruction: string;
}

const PERSONAS: Persona[] = [
    {
        id: 'default',
        name: 'Default Assistant',
        description: 'Helpful, balanced, and expert responses.',
        icon: DefaultPersonaIcon,
        systemInstruction: SYNTHESIZER_SYSTEM_INSTRUCTION,
    },
    {
        id: 'creative',
        name: 'Creative Writer',
        description: 'Imaginative, narrative, and stylistic answers.',
        icon: CreativePersonaIcon,
        systemInstruction: "You are a master creative writer. Your PRIMARY GOAL is to write the final response to the user's query in a vivid, narrative, and imaginative style. You will be given the user's query and four refined responses from other AI agents. Your task is to analyze these responses and construct the single most engaging and creative answer for the user. Use literary devices and storytelling techniques where appropriate.",
    },
    {
        id: 'technical',
        name: 'Technical Expert',
        description: 'Precise, factual, and detailed explanations.',
        icon: TechnicalPersonaIcon,
        systemInstruction: "You are a master technical expert. Your PRIMARY GOAL is to write the final, technically accurate response to the user's query. You will be given the user's query and four refined responses from other AI agents. Analyze these responses to construct the single most precise and detailed answer. Prioritize accuracy, use technical terminology where appropriate, and structure your response for maximum clarity.",
    },
    {
        id: 'socratic',
        name: 'Socratic Tutor',
        description: 'Guides you to answers with questions.',
        icon: SocraticPersonaIcon,
        systemInstruction: "You are a Socratic tutor. Your PRIMARY GOAL is to guide the user to their own understanding, not to give them the answer directly. You will be given the user's query and four refined responses. Use this information to formulate insightful, probing questions that help the user think critically and explore the topic. Lead them towards the answer without stating it outright.",
    },
    {
        id: 'summarizer',
        name: 'Concise Summarizer',
        description: 'Direct, to-the-point, and brief answers.',
        icon: SummarizerPersonaIcon,
        systemInstruction: "You are an expert summarizer. Your PRIMARY GOAL is to provide the most concise and direct answer possible. You will be given the user's query and four refined responses. Synthesize these into a brief, to-the-point response for the user. Eliminate any unnecessary fluff, conversational filler, or tangential information. Get straight to the core of the answer.",
    }
];


interface GroundingSource {
    uri: string;
    title: string;
}

interface Message {
  role: 'user' | 'model';
  parts: Part[];
  groundingSources?: GroundingSource[];
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
}

interface AttachedFile {
  file: File;
  progress: number;
  base64Data: string | null;
}

const CodeBlock: FC<{ children?: ReactNode }> = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const textToCopy = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="code-block-wrapper">
      <pre><code>{children}</code></pre>
      <button onClick={handleCopy} className="copy-button" aria-label="Copy code">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          {copied ? (
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          ) : (
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-5zm0 16H8V7h11v14z"/>
          )}
        </svg>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

const LoadingIndicator: FC<{ status: string; time: number }> = ({ status, time }) => (
  <div className="loading-animation">
    <div className="loading-header">
      <span className="loading-status">{status}</span>
      <span className="timer-display">{(time / 1000).toFixed(1)}s</span>
    </div>
    <div className={`progress-bars-container ${status.startsWith('Initializing') ? 'initial' : 'refining'}`}>
      <div className="progress-bar"></div>
      <div className="progress-bar"></div>
      <div className="progress-bar"></div>
      <div className="progress-bar"></div>
    </div>
  </div>
);

const groupChatsByDate = (chats: ChatSession[]): Record<string, ChatSession[]> => {
    const groups: Record<string, ChatSession[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const chat of chats) {
        const chatDate = new Date(chat.createdAt);
        let key: string;
        if (chatDate >= today) {
            key = 'Today';
        } else if (chatDate >= yesterday) {
            key = 'Yesterday';
        } else if (chatDate >= sevenDaysAgo) {
            key = 'Previous 7 Days';
        } else {
            key = chatDate.toLocaleString('default', { month: 'long' });
        }
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(chat);
    }
    return groups;
};

const Sidebar: FC<{
    selectedModel: string;
    onModelChange: (model: string) => void;
    allChats: ChatSession[];
    activeChatId: string | null;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onOpenSettings: () => void;
    onRenameChat: (id: string, newTitle: string) => void;
    onDeleteChat: (id: string) => void;
    renamingChatId: string | null;
    onSetRenamingChatId: (id: string | null) => void;
}> = ({ selectedModel, onModelChange, allChats, activeChatId, onSelectChat, onNewChat, searchQuery, onSearchChange, onOpenSettings, onRenameChat, onDeleteChat, renamingChatId, onSetRenamingChatId }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [renameInput, setRenameInput] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (renamingChatId && renameInputRef.current) {
            renameInputRef.current.focus();
            const chat = allChats.find(c => c.id === renamingChatId);
            if(chat) setRenameInput(chat.title);
        }
    }, [renamingChatId, allChats]);

    const handleModelSelect = (model: string) => {
        onModelChange(model);
        setIsDropdownOpen(false);
    };

    const handleRenameSubmit = (id: string) => {
        if (renameInput.trim()) {
            onRenameChat(id, renameInput.trim());
        }
        onSetRenamingChatId(null);
    };
    
    const modelDisplayName = selectedModel.match(/^4x\s(.+)/)?.[1] || selectedModel;
    const modelDescription = selectedModel === "Nano Banana" ? "Image generation" : "Fast and reliable";
    const filteredChats = allChats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const groupedChats = groupChatsByDate(filteredChats);
    const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', ...Object.keys(groupedChats).filter(k => !['Today', 'Yesterday', 'Previous 7 Days'].includes(k))];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="top-header-row">
                    <div className="model-selector-container" ref={dropdownRef}>
                        <div className="model-selector" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <LogoIcon />
                            <div>
                                <span className="model-name">{modelDisplayName}</span>
                                <span className="model-desc">{modelDescription}</span>
                            </div>
                            <span className={`chevron-icon ${isDropdownOpen ? 'rotated' : ''}`}><ChevronDownIcon /></span>
                        </div>
                        {isDropdownOpen && (
                            <div className="model-dropdown">
                                {MODEL_OPTIONS.map((model) => (
                                    <div key={model} className="dropdown-item" onClick={() => handleModelSelect(model)}>{model}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="new-chat-button" onClick={onNewChat} aria-label="New Chat"><NewChatIcon /></button>
                </div>
                <div className="search-bar">
                    <SearchIcon />
                    <input type="text" placeholder="Search" value={searchQuery} onChange={e => onSearchChange(e.target.value)} />
                </div>
            </div>
            
            <nav className="sidebar-nav">
                <a href="#" className="nav-item active"><ChatIcon />Chat</a>
            </nav>

            <div className="sidebar-history">
                {Object.keys(groupedChats).length === 0 && searchQuery ? (
                     <span className="history-group-title">No results found</span>
                ) : (
                    groupOrder.map(groupName => (
                        groupedChats[groupName] && (
                            <div className="history-group" key={groupName}>
                                <span className="history-group-title">{groupName}</span>
                                {groupedChats[groupName].map(chat => (
                                    <div key={chat.id} className="history-item-wrapper">
                                        {renamingChatId === chat.id ? (
                                            <input
                                                ref={renameInputRef}
                                                type="text"
                                                className="rename-input"
                                                value={renameInput}
                                                onChange={(e) => setRenameInput(e.target.value)}
                                                onBlur={() => handleRenameSubmit(chat.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(chat.id)}
                                            />
                                        ) : (
                                            <a href="#" className={`history-item ${chat.id === activeChatId ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onSelectChat(chat.id); }}>
                                                <ChatIcon /> {chat.title}
                                            </a>
                                        )}
                                        <div className="history-item-actions">
                                            <button onClick={() => onSetRenamingChatId(chat.id)}><PencilIcon /></button>
                                            <button onClick={() => onDeleteChat(chat.id)}><TrashIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ))
                )}
            </div>
             <div className="sidebar-footer">
                <button className="settings-button" onClick={onOpenSettings}><SettingsIcon /> Settings</button>
            </div>
        </aside>
    );
};


const WelcomeScreen: FC<{ onPromptClick: (prompt: string) => void }> = ({ onPromptClick }) => (
  <div className="welcome-screen">
    <div>
      <h1>Welcome to Multi-Agent AI.</h1>
      <p>Uses multiple sources and tools to answer questions with citations.</p>
    </div>
    <div className="feature-cards">
      <div className="feature-card card-1"><div className="icon"><IntegrationsIcon /></div><h3>Task Automation</h3><span>Automates tasks like scheduling and reminders.</span></div>
      <div className="feature-card card-2"><div className="icon"><ChatIcon /></div><h3>Multi-language Support</h3><span>Communicates fluently in various languages.</span></div>
      <div className="feature-card card-3"><div className="icon"><LibraryIcon /></div><h3>Image Generation</h3><span>Creates custom images based on user prompts.</span></div>
      <div className="feature-card card-4"><div className="icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l1.4-1.4 3.2 3.2 7.2-7.2 1.4 1.4-8.6 8.6z"/></svg></div><h3>Code snippets</h3><span>Provides quick, functional code examples on demand.</span></div>
    </div>
    <div className="prompt-suggestions">
      <button className="prompt-suggestion" onClick={() => onPromptClick('Tell me a fun fact!')}>Tell me a fun fact!</button>
      <button className="prompt-suggestion" onClick={() => onPromptClick('Recommend a movie to watch.')}>Recommend a movie to watch.</button>
      <button className="prompt-suggestion" onClick={() => onPromptClick('How do I make pancakes?')}>How do I make pancakes?</button>
      <button className="prompt-suggestion" onClick={() => onPromptClick("What's the latest news?")}>What's the latest news?</button>
    </div>
  </div>
);

const SettingsModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    currentApiKey: string | null;
}> = ({ isOpen, onClose, onSave, currentApiKey }) => {
    const [keyInput, setKeyInput] = useState('');

    useEffect(() => {
        setKeyInput(currentApiKey || '');
    }, [currentApiKey, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(keyInput);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <label htmlFor="apiKeyInput">Gemini API Key</label>
                    <p>Your API key is stored only in your browser's local storage and is never sent to our servers.</p>
                    <input 
                        id="apiKeyInput"
                        type="password" 
                        value={keyInput} 
                        onChange={(e) => setKeyInput(e.target.value)} 
                        placeholder="Enter your API Key"
                    />
                </div>
                <div className="modal-footer">
                    <button className="button-secondary" onClick={onClose}>Cancel</button>
                    <button className="button-primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

const PersonaModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (personaData: Omit<Persona, 'id' | 'icon'>) => void;
    personaToEdit: Persona | null;
}> = ({ isOpen, onClose, onSave, personaToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [systemInstruction, setSystemInstruction] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (personaToEdit) {
                setName(personaToEdit.name);
                setDescription(personaToEdit.description);
                setSystemInstruction(personaToEdit.systemInstruction);
            } else {
                setName('');
                setDescription('');
                setSystemInstruction('');
            }
        }
    }, [isOpen, personaToEdit]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (name.trim() && systemInstruction.trim()) {
            onSave({ name, description, systemInstruction });
            onClose();
        } else {
            alert("Persona Name and System Instruction cannot be empty.");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content persona-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{personaToEdit ? 'Edit Persona' : 'Create Custom Persona'}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <label htmlFor="personaName">Persona Name</label>
                    <input
                        id="personaName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Pirate Captain"
                    />
                    <label htmlFor="personaDescription">Description (Optional)</label>
                    <input
                        id="personaDescription"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Answers with a swashbuckling flair."
                    />
                    <label htmlFor="personaInstruction">System Instruction</label>
                    <p>Provide detailed instructions for how the AI should behave.</p>
                    <textarea
                        id="personaInstruction"
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        placeholder="You are a pirate captain from the golden age of sail..."
                        rows={8}
                    />
                </div>
                <div className="modal-footer">
                    <button className="button-secondary" onClick={onClose}>Cancel</button>
                    <button className="button-primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};


const PersonaSelector: FC<{
    personas: Persona[];
    selectedPersonaId: string;
    onSelectPersona: (id: string) => void;
    onAddNew: () => void;
    onEdit: (persona: Persona) => void;
    onDelete: (id: string) => void;
}> = ({ personas, selectedPersonaId, onSelectPersona, onAddNew, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedPersona = personas.find(p => p.id === selectedPersonaId) || personas[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        onSelectPersona(id);
        setIsOpen(false);
    };

    return (
        <div className="persona-selector-container" ref={dropdownRef}>
            <button className="header-button persona-selector" onClick={() => setIsOpen(!isOpen)}>
                <selectedPersona.icon />
                {selectedPersona.name}
                <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="persona-dropdown">
                    {personas.map(persona => {
                        const isCustom = persona.id.startsWith('custom-');
                        return (
                            <div key={persona.id} className="persona-item" onClick={() => handleSelect(persona.id)}>
                                <div className="persona-item-icon"><persona.icon /></div>
                                <div className="persona-item-text">
                                    <span className="persona-item-name">{persona.name}</span>
                                    <span className="persona-item-desc">{persona.description}</span>
                                </div>
                                {isCustom && (
                                    <div className="persona-item-actions">
                                        <button onClick={(e) => { e.stopPropagation(); onEdit(persona); setIsOpen(false); }}><PencilIcon /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(persona.id); setIsOpen(false); }}><TrashIcon /></button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    <div className="persona-dropdown-divider"></div>
                    <div className="persona-add-new" onClick={() => { onAddNew(); setIsOpen(false); }}>
                        <NewChatIcon />
                        <span>Create New Persona</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const App: FC = () => {
  const [allChats, setAllChats] = useState<Record<string, ChatSession>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [timer, setTimer] = useState<number>(0);
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[1]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(PERSONAS[0].id);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const isUploading = attachedFiles.some(f => f.progress < 100);
  const activeChatMessages = activeChatId ? allChats[activeChatId]?.messages : [];

  useEffect(() => {
      try {
        const savedKey = localStorage.getItem('geminiUserApiKey');
        if (savedKey) {
            setUserApiKey(savedKey);
        }
        const savedChats = localStorage.getItem('multiAgentChats');
        if (savedChats) {
            // FIX: Explicitly type parsedChats to ensure correct type inference for Object.values
            const parsedChats: Record<string, ChatSession> = JSON.parse(savedChats);
            setAllChats(parsedChats);
            const chatIds = Object.keys(parsedChats);
            if(chatIds.length > 0) {
                 // FIX: Type inference for sort is corrected by ensuring parsedChats is properly typed.
                 // FIX: Explicitly type sort callback arguments to fix type inference.
                 const sortedChats = Object.values(parsedChats).sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt);
                 setActiveChatId(sortedChats[0].id);
            }
        }
        const savedPersonaId = localStorage.getItem('multiAgentPersonaId');
        if (savedPersonaId) {
            setSelectedPersonaId(savedPersonaId);
        }
        const savedCustomPersonas = localStorage.getItem('multiAgentCustomPersonas');
        if (savedCustomPersonas) {
            const parsedPersonas = JSON.parse(savedCustomPersonas) as Omit<Persona, 'icon'>[];
            const personasWithIcons = parsedPersonas.map(p => ({
                ...p,
                icon: CustomPersonaIcon
            }));
            setCustomPersonas(personasWithIcons);
        }
      } catch (error) {
          console.error("Failed to load from localStorage:", error);
      }
  }, []);

  useEffect(() => {
      try {
        if (Object.keys(allChats).length > 0) {
            localStorage.setItem('multiAgentChats', JSON.stringify(allChats));
        } else {
            localStorage.removeItem('multiAgentChats');
        }
      } catch (error) {
          console.error("Failed to save chats to localStorage:", error);
      }
  }, [allChats]);
  
  useEffect(() => {
    localStorage.setItem('multiAgentPersonaId', selectedPersonaId);
  }, [selectedPersonaId]);

  useEffect(() => {
    try {
        if (customPersonas.length > 0) {
            // Before saving, we must remove non-serializable parts like function components.
            const personasToSave = customPersonas.map(({ icon, ...rest }) => rest);
            localStorage.setItem('multiAgentCustomPersonas', JSON.stringify(personasToSave));
        } else {
            localStorage.removeItem('multiAgentCustomPersonas');
        }
    } catch (error) {
        console.error("Failed to save custom personas to localStorage:", error);
    }
  }, [customPersonas]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [activeChatMessages, isLoading]);
  
  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setTimer(prevTime => prevTime + 100);
      }, 100);
    } else {
      setTimer(0);
    }
    return () => window.clearInterval(interval);
  }, [isLoading]);
  
  const handleSaveApiKey = (key: string) => {
    const trimmedKey = key.trim();
    setUserApiKey(trimmedKey);
    localStorage.setItem('geminiUserApiKey', trimmedKey);
    setIsSettingsOpen(false);
  };

  const handleOpenPersonaModal = (persona: Persona | null = null) => {
    setPersonaToEdit(persona);
    setIsPersonaModalOpen(true);
  };

  const handleSavePersona = (personaData: Omit<Persona, 'id' | 'icon'>) => {
      if (personaToEdit) {
          setCustomPersonas(prev => prev.map(p => p.id === personaToEdit.id ? { ...p, ...personaData } : p));
      } else {
          const newPersona: Persona = {
              ...personaData,
              id: `custom-${Date.now()}`,
              icon: CustomPersonaIcon,
          };
          setCustomPersonas(prev => [...prev, newPersona]);
          setSelectedPersonaId(newPersona.id);
      }
  };

  const handleDeletePersona = (id: string) => {
      if (window.confirm("Are you sure you want to delete this custom persona?")) {
          if (selectedPersonaId === id) {
              setSelectedPersonaId(PERSONAS[0].id);
          }
          setCustomPersonas(prev => prev.filter(p => p.id !== id));
      }
  };


  const fileToGenerativePart = async (file: AttachedFile): Promise<Part | null> => {
      if (!file.base64Data) return null;
      return {
          inlineData: { data: file.base64Data, mimeType: file.file.type },
      };
  };

  const callGemini = async (userInput: string, files: AttachedFile[], model: string, currentChatId: string, webSearchEnabled: boolean, personaId: string) => {
    setIsLoading(true);
    const modelApiName = MODEL_MAP[model];
    const currentChatHistory = allChats[currentChatId]?.messages.slice(0, -1) || [];
    const combinedPersonas = [...PERSONAS, ...customPersonas];
    
    const apiKey = userApiKey || process.env.API_KEY;

    if (!apiKey) {
        const errorMessage: Message = { role: 'model', parts: [{ text: 'API Key not configured. Please add your Gemini API key in the Settings menu to continue.' }] };
        setAllChats(prev => ({ ...prev, [currentChatId]: { ...prev[currentChatId], messages: [...prev[currentChatId].messages, errorMessage] }}));
        setIsLoading(false);
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey as string });
        const mainChatHistory: Content[] = currentChatHistory.map(msg => ({ role: msg.role, parts: msg.parts }));
        const fileParts = (await Promise.all(files.map(fileToGenerativePart))).filter(p => p !== null) as Part[];
        
        let finalMessage: Message;

        if (webSearchEnabled) {
            setLoadingStatus('Searching the web...');
            const userContentParts: Part[] = [{ text: userInput }, ...fileParts];
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: userContentParts },
                config: { tools: [{ googleSearch: {} }] },
            });
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const sources: GroundingSource[] = groundingChunks
                .map((chunk: any) => chunk.web)
                .filter((web: any) => web && web.uri && web.title)
                .reduce((acc: GroundingSource[], current: GroundingSource) => {
                    if (!acc.find(item => item.uri === current.uri)) {
                        acc.push(current);
                    }
                    return acc;
                }, []);

            finalMessage = { role: 'model', parts: [{ text: response.text }], groundingSources: sources };

        } else if (model === "Nano Banana") {
            setLoadingStatus('Generating image...');
            const userContentParts: Part[] = [{ text: userInput }, ...fileParts];
            const response = await ai.models.generateContent({
                model: modelApiName,
                contents: { parts: userContentParts },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            finalMessage = { role: 'model', parts: response.candidates?.[0]?.content.parts || [{ text: "Sorry, I couldn't generate an image." }] };
        } else {
            const userPrompt = files.length > 0 ? `Please analyze the attached document(s) and then answer the following question: ${userInput}` : userInput;
            const userContentParts: Part[] = [{ text: userPrompt }, ...fileParts];
            const currentUserTurn: Content = { role: 'user', parts: userContentParts };

            setLoadingStatus('Initializing agents...');
            const initialAgentPromises = Array(4).fill(0).map(() => 
              ai.models.generateContent({ model: modelApiName, contents: [...mainChatHistory, currentUserTurn], config: { systemInstruction: INITIAL_SYSTEM_INSTRUCTION } })
            );
            const initialResponses = await Promise.all(initialAgentPromises);
            const initialAnswers = initialResponses.map(res => res.text);

            setLoadingStatus('Refining answers...');
            const refinementAgentPromises = initialAnswers.map((initialAnswer, index) => {
              const otherAnswers = initialAnswers.filter((_, i) => i !== index);
              const refinementContext = `My initial response was: "${initialAnswer}". The other agents responded with: 1. "${otherAnswers[0]}" 2. "${otherAnswers[1]}" 3. "${otherAnswers[2]}". Based on this context, critically re-evaluate and provide a new, improved response to the original query.`;
              const refinementTurn: Content = { role: 'user', parts: [{ text: `${userInput}\n\n---INTERNAL CONTEXT---\n${refinementContext}` }] };
              return ai.models.generateContent({ model: modelApiName, contents: [...mainChatHistory, refinementTurn], config: { systemInstruction: REFINEMENT_SYSTEM_INSTRUCTION } });
            });
            const refinedResponses = await Promise.all(refinementAgentPromises);
            const refinedAnswers = refinedResponses.map(res => res.text);

            setLoadingStatus('Synthesizing final response...');
            const synthesizerContext = `Here are the four refined responses to the user's query. Your task is to synthesize them into the best single, final answer.\n\nRefined Response 1:\n"${refinedAnswers[0]}"\n\nRefined Response 2:\n"${refinedAnswers[1]}"\n\nRefined Response 3:\n"${refinedAnswers[2]}"\n\nRefined Response 4:\n"${refinedAnswers[3]}"`;
            const synthesizerTurn: Content = { role: 'user', parts: [{ text: `${userInput}\n\n---INTERNAL CONTEXT---\n${synthesizerContext}` }] };
            const synthesizerInstruction = combinedPersonas.find(p => p.id === personaId)?.systemInstruction || SYNTHESIZER_SYSTEM_INSTRUCTION;
            const finalResult = await ai.models.generateContent({ model: modelApiName, contents: [...mainChatHistory, synthesizerTurn], config: { systemInstruction: synthesizerInstruction } });
            
            finalMessage = { role: 'model', parts: [{ text: finalResult.text }] };
        }
        
        setAllChats(prev => ({ ...prev, [currentChatId]: { ...prev[currentChatId], messages: [...prev[currentChatId].messages, finalMessage] }}));
    } catch (error) {
        console.error('Error calling Gemini:', error);
        const errorMessage: Message = { role: 'model', parts: [{ text: 'Sorry, I encountered an error. Please try again.' }] };
        setAllChats(prev => ({ ...prev, [currentChatId]: { ...prev[currentChatId], messages: [...prev[currentChatId].messages, errorMessage] }}));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isUploading || (!inputValue.trim() && attachedFiles.length === 0)) return;

    const filePartsForDisplay: Part[] = (await Promise.all(attachedFiles.map(fileToGenerativePart))).filter(p => p !== null) as Part[];

    const userMessage: Message = { role: 'user', parts: [{ text: inputValue }, ...filePartsForDisplay] };
    
    let currentChatId = activeChatId;
    
    if (!currentChatId) {
        const newChatId = `chat-${Date.now()}`;
        const newChatTitle = inputValue.substring(0, 30) || "New Chat";
        const newChat = { id: newChatId, title: newChatTitle, messages: [userMessage], createdAt: Date.now() };
        setAllChats(prev => ({ ...prev, [newChatId]: newChat }));
        setActiveChatId(newChatId);
        currentChatId = newChatId;
    } else {
        setAllChats(prev => ({ ...prev, [currentChatId!]: { ...prev[currentChatId!], messages: [...prev[currentChatId!].messages, userMessage] }}));
    }
    
    const originalFiles = [...attachedFiles];
    const webSearchEnabled = isWebSearchEnabled;
    
    setInputValue('');
    setAttachedFiles([]);
    setIsWebSearchEnabled(false);
    
    callGemini(inputValue, originalFiles, selectedModel, currentChatId, webSearchEnabled, selectedPersonaId);
  };
  
  const handleExportChat = () => {
      if (!activeChatId || !allChats[activeChatId]) {
          alert("No active chat to export.");
          return;
      }
      
      const chat = allChats[activeChatId];
      let markdownContent = `# Chat: ${chat.title}\n\n`;
      
      chat.messages.forEach(msg => {
          markdownContent += `## ${msg.role === 'user' ? 'You' : 'AI'}\n\n`;
          msg.parts.forEach(part => {
              if ('text' in part) {
                  markdownContent += `${part.text}\n\n`;
              }
              if ('inlineData' in part && part.inlineData.mimeType.startsWith('image/')) {
                  markdownContent += `![Image Attached]\n\n`;
              }
          });
          if (msg.groundingSources && msg.groundingSources.length > 0) {
              markdownContent += `### Sources\n`;
              msg.groundingSources.forEach(source => {
                  markdownContent += `- [${source.title}](${source.uri})\n`;
              });
              markdownContent += `\n`;
          }
      });
      
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chat.title.replace(/ /g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

    const handleNewChat = () => {
        setActiveChatId(null);
        setInputValue('');
        setAttachedFiles([]);
        setIsMobileSidebarOpen(false);
    }

    const handleRenameChat = (id: string, newTitle: string) => {
        setAllChats(prev => ({ ...prev, [id]: { ...prev[id], title: newTitle }}));
    };

    const handleDeleteChat = (id: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            // If active chat is being deleted, determine the next active chat
            if (activeChatId === id) {
                const newChats = { ...allChats };
                delete newChats[id];
                const remainingChats = Object.values(newChats);

                if (remainingChats.length > 0) {
                    const sortedChats = remainingChats.sort((a, b) => b.createdAt - a.createdAt);
                    setActiveChatId(sortedChats[0].id);
                } else {
                    setActiveChatId(null);
                }
            }
            
            // Update the main chat list state
            setAllChats(prev => {
                const newChats = { ...prev };
                delete newChats[id];
                return newChats;
            });
        }
    };


  const handlePromptSuggestionClick = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
          const files = Array.from(event.target.files);
          const newAttachedFiles: AttachedFile[] = files.map((file: File) => ({
              file,
              progress: 0,
              base64Data: null,
          }));

          setAttachedFiles(prev => [...prev, ...newAttachedFiles]);

          newAttachedFiles.forEach((attachedFile, index) => {
              const reader = new FileReader();
              reader.onprogress = (e) => {
                  if (e.lengthComputable) {
                      const progress = Math.round((e.loaded / e.total) * 100);
                      setAttachedFiles(prev => {
                          const newFiles = [...prev];
                          const fileIndex = prev.findIndex(f => f.file === attachedFile.file && f.base64Data === null);
                          if(newFiles[fileIndex]) newFiles[fileIndex].progress = progress;
                          return newFiles;
                      });
                  }
              };
              reader.onloadend = () => {
                  setAttachedFiles(prev => {
                      const newFiles = [...prev];
                      const fileIndex = prev.findIndex(f => f.file === attachedFile.file && f.base64Data === null);
                      if(newFiles[fileIndex]) {
                          newFiles[fileIndex].progress = 100;
                          newFiles[fileIndex].base64Data = (reader.result as string).split(',')[1];
                      }
                      return newFiles;
                  });
              };
              reader.readAsDataURL(attachedFile.file);
          });
      }
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };
  
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
        setIsRecording(false);
        setRecordingTime(0);
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });

                const newAttachedFile: AttachedFile = {
                    file: audioFile,
                    progress: 0,
                    base64Data: null,
                };

                setAttachedFiles(prev => [...prev, newAttachedFile]);

                const reader = new FileReader();
                reader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setAttachedFiles(prev => {
                            const newFiles = [...prev];
                            const fileIndex = prev.findIndex(f => f.file === audioFile);
                            if (fileIndex !== -1) {
                                newFiles[fileIndex].progress = progress;
                            }
                            return newFiles;
                        });
                    }
                };
                reader.onloadend = () => {
                    setAttachedFiles(prev => {
                        const newFiles = [...prev];
                        const fileIndex = prev.findIndex(f => f.file === audioFile);
                        if (fileIndex !== -1) {
                            newFiles[fileIndex].progress = 100;
                            newFiles[fileIndex].base64Data = (reader.result as string).split(',')[1];
                        }
                        return newFiles;
                    });
                };
                reader.readAsDataURL(audioFile);

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    };

  const removeFile = (fileIndex: number) => {
      setAttachedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };
  
  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const MathComponent: FC<{ inline?: boolean; children: ReactNode }> = ({ inline = false, children }) => {
    const Katex = (ReactKatex as any)?.default || ReactKatex;
    const Block = Katex?.BlockMath;
    const Inline = Katex?.InlineMath;

    const math = String(children).replace(/\n$/, '');

    if (inline && !Inline) return <code className="katex-error">{`$${math}$`}</code>;
    if (!inline && !Block) return <pre className="katex-error">{`\\[${math}\\]`}</pre>;

    const Component = inline ? Inline : Block;
    
    return <Component math={math} renderError={(err: Error) => (
        <span className="katex-error" title={err.message}>
            {inline ? `$${math}$` : `\\[${math}\\]`}
        </span>
    )} />;
  };

  const combinedPersonas = [...PERSONAS, ...customPersonas];

  return (
    <div className={`app-container ${isMobileSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar 
        selectedModel={selectedModel} 
        onModelChange={setSelectedModel}
        // FIX: Explicitly type 'a' and 'b' in the sort callback to resolve a type inference issue.
        allChats={Object.values(allChats).sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt)}
        activeChatId={activeChatId}
        onSelectChat={(id) => { setActiveChatId(id); setIsMobileSidebarOpen(false); }}
        onNewChat={handleNewChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        renamingChatId={renamingChatId}
        onSetRenamingChatId={setRenamingChatId}
      />
      {isMobileSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>}
      <main className="main-content">
        <header className="main-header">
            <button className="menu-button" onClick={() => setIsMobileSidebarOpen(true)} aria-label="Open menu">
                <MenuIcon />
            </button>
            <PersonaSelector
                personas={combinedPersonas}
                selectedPersonaId={selectedPersonaId}
                onSelectPersona={setSelectedPersonaId}
                onAddNew={() => handleOpenPersonaModal(null)}
                onEdit={handleOpenPersonaModal}
                onDelete={handleDeletePersona}
            />
          <button className="header-button" onClick={handleExportChat}><ExportIcon /> Export Chat</button>
        </header>
        <div className="chat-area">
          <div className="chat-view">
            {(!activeChatId || activeChatMessages.length === 0) && !isLoading ? (
              <WelcomeScreen onPromptClick={handlePromptSuggestionClick} />
            ) : (
              <div className="message-list" ref={messageListRef}>
                {(activeChatMessages || []).map((msg, index) => (
                      <div key={index} className={`message ${msg.role}`}>
                        <div className="message-content">
                            {msg.role === 'model' && !msg.parts.some(p => 'inlineData' in p) && !msg.groundingSources && <span className="agent-label">Synthesizer Agent</span>}
                             {msg.role === 'model' && msg.groundingSources && <span className="agent-label">Web Search Result</span>}
                            {msg.parts.map((part, partIndex) => {
                                if ('text' in part && part.text) {
                                    return (
                                        <ReactMarkdown
                                            key={partIndex}
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            components={{
                                                code({ node, inline, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    if (!inline) {
                                                        if (match && (match[1] === 'math' || match[1] === 'latex')) {
                                                            return <MathComponent>{String(children)}</MathComponent>;
                                                        }
                                                        return <CodeBlock>{String(children)}</CodeBlock>;
                                                    }
                                                    return <code className={className} {...props}>{children}</code>;
                                                },
                                                math: ({ value }: { value: string }) => <MathComponent>{value}</MathComponent>,
                                                inlineMath: ({ value }: { value:string }) => <MathComponent inline>{value}</MathComponent>
                                            } as any}
                                        >
                                            {part.text}
                                        </ReactMarkdown>
                                    );
                                }
                                if ('inlineData' in part && part.inlineData.mimeType.startsWith('image/')) {
                                    return <img key={partIndex} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="Content" className="attached-image"/>;
                                }
                                return null;
                            })}
                             {msg.groundingSources && msg.groundingSources.length > 0 && (
                                <div className="grounding-sources">
                                    <h4 className="sources-title">Sources</h4>
                                    <ul>
                                        {msg.groundingSources.map((source, i) => (
                                            <li key={i}>
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer">{source.title}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                      </div>
                ))}
                {isLoading && <LoadingIndicator status={loadingStatus} time={timer} />}
              </div>
            )}
            
            <div className="input-form-container">
                {attachedFiles.length > 0 && (
                    <div className="file-preview-container">
                        {attachedFiles.map((item, index) => (
                            <div className="file-chip" key={index}>
                                <div className="progress-bar-inner" style={{ width: `${item.progress}%` }}></div>
                                <span>{item.file.name}</span>
                                <button onClick={() => removeFile(index)} aria-label={`Remove ${item.file.name}`}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}
                <form className="input-area" onSubmit={handleSubmit}>
                    <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileChange} multiple accept="application/pdf,image/*,text/*,video/*,audio/*,application/zip" />
                    <button type="button" className={`web-search-button ${isWebSearchEnabled ? 'active' : ''}`} onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)} aria-label="Toggle web search"><WebSearchIcon/></button>
                    <button type="button" className="attach-button" onClick={() => fileInputRef.current?.click()} aria-label="Attach document"><AttachIcon/></button>
                    <textarea
                      ref={inputRef}
                      name="userInput"
                      placeholder={
                          isRecording 
                            ? `Recording... ${new Date(recordingTime * 1000).toISOString().substr(14, 5)}`
                            : selectedModel === 'Nano Banana' ? "Describe an image to generate or edit..." : "Ask me anything..."
                      }
                      aria-label="User input"
                      disabled={isLoading || isUploading || isRecording}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                        }
                      }}
                      rows={1}
                    />
                    <button type="button" className={`mic-button ${isRecording ? 'active' : ''}`} onClick={handleToggleRecording} disabled={isLoading || isUploading} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                        {isRecording ? <StopIcon /> : <MicrophoneIcon />}
                    </button>
                    <button type="submit" disabled={isLoading || isUploading || (!inputValue.trim() && attachedFiles.length === 0)} aria-label="Send message"><UpArrowIcon /></button>
                </form>
            </div>
          </div>
        </div>
      </main>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveApiKey} 
        currentApiKey={userApiKey} 
      />
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSave={handleSavePersona}
        personaToEdit={personaToEdit}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
