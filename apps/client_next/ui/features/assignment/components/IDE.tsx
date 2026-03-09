"use client";

import { useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
      Loading editor...
    </div>
  ),
});

/**
 * IDE Component with Monaco Editor and per-line feedback support
 * Feedback displayed as floating popup boxes on the right side
 * 
 * Props:
 * - file: { type: string, name: string, path: string, content: string[] | string }
 * - initialFeedback: { 
 *     [id: string]: { 
 *       startLine: number, 
 *       endLine?: number, // optional, defaults to startLine for single line
 *       message: string, 
 *       type: 'error' | 'warning' | 'info' | 'success' | 'suggestion' 
 *     } 
 *   }
 * - onContentChange: (content: string) => void
 * - onFeedbackChange: (feedback: object) => void
 * - readOnly: boolean
 */

interface FeedbackData {
  startLine: number;
  endLine?: number;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success' | 'suggestion';
}

interface FileData {
  type: string;
  name: string;
  path: string;
  content: string[] | string;
}

interface IDEProps {
  file?: FileData;
  initialFeedback?: Record<string, FeedbackData>;
  onContentChange?: (content: string) => void;
  onFeedbackChange?: (feedback: Record<string, FeedbackData>) => void;
  readOnly?: boolean;
}

export default function IDE({
  file = { type: 'file', name: 'untitled.txt', path: 'untitled.txt', content: '' },
  initialFeedback = {},
  onContentChange: _onContentChange,
  onFeedbackChange: _onFeedbackChange,
  readOnly = false
}: IDEProps) {
  // Convert content array to string if needed
  const getInitialContent = () => {
    if (Array.isArray(file.content)) {
      return file.content.join('\n');
    }
    return file.content || '';
  };

  const [content, _setContent] = useState(getInitialContent);
  const [feedback] = useState<Record<string, FeedbackData>>(initialFeedback);
  const _editorRef = useRef<unknown>(null);
  const _monacoRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize all popups as open
  const initialOpenPopups = useMemo(() => {
    const initialOpen: Record<string, boolean> = {};
    Object.keys(feedback).forEach(lineNum => {
      initialOpen[lineNum] = true;
    });
    return initialOpen;
  }, [feedback]);

  const [_openPopups, setOpenPopups] = useState<Record<string, boolean>>(initialOpenPopups);

  // Toggle popup open/close
  const _togglePopup = useCallback((lineNum: string) => {
    setOpenPopups(prev => ({
      ...prev,
      [lineNum]: !prev[lineNum]
    }));
  }, []);

  // Get language from file extension
  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'bat': 'bat',
      'cmd': 'bat',
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'powershell',
      'yaml': 'yaml',
      'yml': 'yaml'
    };
    return languageMap[ext] || 'plaintext';
  };

  // Feedback type to color/style mapping
  const _feedbackStyles = {
    error: {
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      className: 'feedback-error',
      glyphMarginClassName: 'glyph-error',
      label: 'ERROR',
      icon: '❌'
    },
    warning: {
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      className: 'feedback-warning',
      glyphMarginClassName: 'glyph-warning',
      label: 'WARNING',
      icon: '⚠️'
    },
    info: {
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.15)',
      className: 'feedback-info',
      glyphMarginClassName: 'glyph-info',
      label: 'INFO',
      icon: 'ℹ️'
    },
    success: {
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      className: 'feedback-success',
      glyphMarginClassName: 'glyph-success',
      label: 'SUCCESS',
      icon: '✅'
    },
    suggestion: {
      color: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.15)',
      className: 'feedback-suggestion',
      glyphMarginClassName: 'glyph-suggestion',
      label: 'SUGGESTION',
      icon: '💡'
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">📄</span>
          <span className="text-gray-200 text-sm font-medium">{file.name}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 relative overflow-hidden" ref={containerRef}>
        <Editor
          height="100%"
          language={getLanguage(file.name)}
          value={content}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'off',
            padding: { top: 10 },
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            }
          }}
        />
      </div>
    </div>
  );
}
