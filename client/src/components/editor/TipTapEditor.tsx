import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Typography from '@tiptap/extension-typography'
import { common, createLowlight } from 'lowlight'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CheckSquare,
  Undo,
  Redo,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

interface TipTapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const toolbarItems = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold'), title: '粗体 (Ctrl+B)' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic'), title: '斜体 (Ctrl+I)' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike'), title: '删除线' },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), isActive: () => editor.isActive('code'), title: '行内代码' },
    { icon: LinkIcon, action: setLink, isActive: () => editor.isActive('link'), title: '链接' },
    null,
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }), title: '标题1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }), title: '标题2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor.isActive('heading', { level: 3 }), title: '标题3' },
    null,
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList'), title: '无序列表' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList'), title: '有序列表' },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), isActive: () => editor.isActive('taskList'), title: '任务列表' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive('blockquote'), title: '引用' },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: () => editor.isActive('codeBlock'), title: '代码块' },
    null,
    { icon: Undo, action: () => editor.chain().focus().undo().run(), isActive: () => false, title: '撤销 (Ctrl+Z)' },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), isActive: () => false, title: '重做 (Ctrl+Shift+Z)' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
      {toolbarItems.map((item, index) => {
        if (item === null) {
          return <div key={index} className="mx-1 h-5 w-px bg-border" />
        }

        const Icon = item.icon
        return (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={item.action}
            className={cn(
              'h-8 w-8 p-0 text-muted-foreground hover:text-foreground',
              item.isActive() && 'bg-primary/10 text-primary'
            )}
            title={item.title}
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = '开始写作...支持从 Obsidian/Typora 粘贴 Markdown',
  onImageUpload,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full cursor-pointer',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
        HTMLAttributes: {
          class: 'rounded-lg p-4 font-mono text-sm bg-[#0d1117] text-[#c9d1d9] border border-[#30363d]',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[350px] px-4 py-3',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && onImageUpload) {
          const files = Array.from(event.dataTransfer.files).filter((file) =>
            file.type.startsWith('image/')
          )

          if (files.length > 0) {
            event.preventDefault()

            const { schema } = view.state
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })

            if (coordinates) {
              files.forEach(async (file) => {
                try {
                  const url = await onImageUpload(file)
                  const node = schema.nodes.image.create({ src: url })
                  const transaction = view.state.tr.insert(coordinates.pos, node)
                  view.dispatch(transaction)
                } catch (error) {
                  console.error('Failed to upload image:', error)
                }
              })
            }
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        if (!onImageUpload) return false

        const items = Array.from(event.clipboardData?.items || [])
        const imageItems = items.filter((item) => item.type.startsWith('image/'))

        if (imageItems.length > 0) {
          event.preventDefault()

          imageItems.forEach(async (item) => {
            const file = item.getAsFile()
            if (file) {
              try {
                const url = await onImageUpload(file)
                const { schema } = view.state
                const node = schema.nodes.image.create({ src: url })
                const transaction = view.state.tr.insert(view.state.selection.from, node)
                view.dispatch(transaction)
              } catch (error) {
                console.error('Failed to upload image:', error)
              }
            }
          })
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
  })

  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getHTML()
      if (content !== currentContent) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  return (
    <div className="rounded-lg border bg-card">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
