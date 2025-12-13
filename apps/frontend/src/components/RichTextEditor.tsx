'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

/**
 * Rich text editor component using TipTap (ProseMirror)
 * Provides WYSIWYG editing with formatting toolbar and keyboard shortcuts
 * 
 * Features:
 * - Text formatting: Bold, Italic, Strikethrough, Inline code
 * - Headings: H1, H2, H3
 * - Lists: Bullet, Numbered, Task lists with checkboxes
 * - Blockquotes and Code blocks with syntax highlighting
 * - Links with URL input
 * - Undo/Redo support
 * - Clear formatting
 * - Read-only mode support
 * - Dark mode compatible
 * 
 * @component
 * @param {RichTextEditorProps} props - Component props
 * @param {string} props.content - HTML content to display/edit
 * @param {Function} props.onChange - Callback when content changes, receives HTML string
 * @param {string} [props.placeholder='Start writing...'] - Placeholder text
 * @param {boolean} [props.editable=true] - Whether editor is editable
 * @returns {JSX.Element} Rich text editor with toolbar
 * 
 * @example
 * const [content, setContent] = useState('<p>Initial content</p>');
 * 
 * <RichTextEditor
 *   content={content}
 *   onChange={setContent}
 *   placeholder="Write your note..."
 *   editable={true}
 * />
 * 
 * @example
 * // Read-only mode:
 * <RichTextEditor
 *   content={note.content}
 *   onChange={() => {}} // No-op
 *   editable={false}
 * />
 */
export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-600 underline',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] max-w-none dark:prose-invert p-4',
      },
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

interface MenuBarProps {
  editor: any;
}

/**
 * Formatting toolbar for RichTextEditor
 * Provides buttons for all text formatting options with visual feedback
 * 
 * Features:
 * - Active state highlighting for current formatting
 * - Disabled state for unavailable actions
 * - Keyboard shortcut hints in tooltips
 * - Grouped controls with visual separators
 * - Dark mode support
 * 
 * @component
 * @param {MenuBarProps} props - Component props
 * @param {Editor} props.editor - TipTap editor instance
 * @returns {JSX.Element} Toolbar with formatting buttons
 * 
 * Button Groups:
 * 1. Text formatting: Bold, Italic, Strikethrough, Code
 * 2. Headings: H1, H2, H3
 * 3. Lists: Bullet, Numbered, Task
 * 4. Blocks: Blockquote, Code block
 * 5. Links: Insert/edit link
 * 6. History: Undo, Redo
 * 7. Utilities: Clear formatting
 */
function MenuBar({ editor }: MenuBarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-300 dark:border-gray-700 p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-900">
      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('strike') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 font-mono ${
          editor.isActive('code') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Inline Code"
      >
        {'<>'}
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Heading 3"
      >
        H3
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Bullet List"
      >
        •&nbsp;List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Numbered List"
      >
        1.&nbsp;List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('taskList') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Task List"
      >
        ☑ Tasks
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />

      {/* Blockquote & Code Block */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('blockquote') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Blockquote"
      >
        "
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 font-mono ${
          editor.isActive('codeBlock') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Code Block"
      >
        {'{ }'}
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />

      {/* Link */}
      <button
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('link') ? 'bg-gray-300 dark:bg-gray-600' : ''
        }`}
        title="Add Link"
      >
        🔗
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />

      {/* Clear Formatting */}
      <button
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Clear Formatting"
      >
        ✗
      </button>
    </div>
  );
}
