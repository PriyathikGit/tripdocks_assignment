import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Mention } from '@tiptap/extension-mention'
import { Color } from "@tiptap/extension-color"
import { SuggestionProps } from '@tiptap/suggestion'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { VARIABLES } from './variables'
import "./index.css"
import TextStyle from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import ExportButton from './Export_method'
import CodeBlock from '@tiptap/extension-code-block'

interface VariableItemProps {
    variable: typeof VARIABLES[0]
    isSelected: boolean
    onClick: () => void
}

const VariableItem = ({ variable, isSelected, onClick }: VariableItemProps) => {
    return (
        <li
            className={`variable-item ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <span className="variable-label">{variable.label}</span>
            <span className="variable-value">{variable.value}</span>
        </li>
    )
}

const VariableEditor = () => {

    const [suggestionQuery, setSuggestionQuery] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    const editorRef = useRef<HTMLDivElement>(null);

    const filteredVariables = useMemo(() =>
        VARIABLES.filter(variable =>
            variable.label.toLowerCase().includes(suggestionQuery?.toLowerCase() || '')
        ),
        [suggestionQuery]
    );

    // Use a ref to track the latest filtered variables and selected index
    const suggestionStateRef = useRef({
        filteredVariables: [] as typeof VARIABLES,
        selectedIndex: 0
    });

    // Update the ref whenever filteredVariables or selectedIndex changes
    useEffect(() => {
        suggestionStateRef.current = {
            filteredVariables,
            selectedIndex,

        };
    }, [filteredVariables, selectedIndex]);

    const Variable = Mention.extend({
        name: 'variable',
        renderHTML({ node }) {
            return [
                'span',
                {
                    class: 'variable',
                    'data-variable-id': node.attrs.id,
                    'data-variable-value': node.attrs.label,
                },
                ['span', { class: 'braces-icon' }, '❴•❵'], // Using fancy braces
                node.attrs.label,
            ];
        },
    }).configure({
        suggestion: {
            char: '{{',
            render: () => {
                return {
                    onStart: (props: SuggestionProps) => {
                        setSuggestionQuery(props.query);
                        setSelectedIndex(0);
                        updatePopoverPosition();
                    },
                    onUpdate: (props: SuggestionProps) => {
                        setSuggestionQuery(props.query);
                        updatePopoverPosition();
                    },
                    onKeyDown: ({ event }) => {
                        if (event.key === 'Escape') {
                            setSuggestionQuery(null);
                            return true;
                        }

                        if (event.key === 'ArrowUp') {
                            setSelectedIndex(prev =>
                                prev <= 0 ? suggestionStateRef.current.filteredVariables.length - 1 : prev - 1
                            );
                            return true;
                        }

                        if (event.key === 'ArrowDown') {
                            setSelectedIndex(prev =>
                                prev >= suggestionStateRef.current.filteredVariables.length - 1 ? 0 : prev + 1
                            );
                            return true;
                        }

                        if (event.key === 'Enter') {
                            const variable = suggestionStateRef.current.filteredVariables[suggestionStateRef.current.selectedIndex];
                            if (variable) {
                                insertVariable(variable);
                            }
                            return true;
                        }

                        return false;
                    },
                    onExit: () => {
                        setSuggestionQuery(null);
                    },
                };
            },
        },
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Variable,
            TextStyle, // Required for color extension
            Color.configure({ types: ['textStyle'] }), // Proper configuration
            Placeholder.configure({
                placeholder: 'Start typing here...',
                emptyEditorClass: 'is-editor-empty',
                emptyNodeClass: 'is-empty',
                showOnlyWhenEditable: true,
            }),
            CodeBlock.configure({
                // Optional configuration
                languageClassPrefix: 'language-',
            }),
        ],

        editorProps: {
            attributes: {
                class: 'prose focus:outline-none',
            },
        },
    })


    const updatePopoverPosition = useCallback(() => {
        if (!editorRef.current || !editor) return;

        // Get the current selection position from Prosemirror
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        // Get editor's scroll position and offset
        const editorRect = editorRef.current.getBoundingClientRect();

        setPopoverPosition({
            top: coords.top - editorRect.top - 20,
            left: coords.left - editorRect.left + 20
        });
    }, [editor]);

    const insertVariable = useCallback(
        (variable: typeof VARIABLES[0]) => {
            if (!editor) return;
            // Get the current selection
            const { from, to } = editor.state.selection;

            // Find the position where the suggestion started (looking back for '{{')
            const textContent = editor.state.doc.textBetween(from - 20, from, '', '');
            const lastOpenBraces = textContent.lastIndexOf('{{');

            if (lastOpenBraces === -1) {
                // Fallback if we can't find the opening braces
                editor.chain()
                    .focus()
                    .insertContent({
                        type: 'variable',
                        attrs: {
                            id: variable.id,
                            label: variable.label,
                        },
                    })
                    .run();
            } else {
                // Calculate the exact positions to delete
                const suggestionStart = from - (textContent.length - lastOpenBraces);

                editor.chain()
                    .focus()
                    .deleteRange({ from: suggestionStart, to })
                    .insertContent({
                        type: 'variable',
                        attrs: {
                            id: variable.id,
                            label: variable.label,
                        },
                    })
                    .run();
            }

            setSuggestionQuery(null);
            setSelectedIndex(0);
        },
        [editor]
    );


    if (!editor) {
        return null
    }
    return (
        <div className="editor-container shadow-xl" ref={editorRef}>
            <div className="menu-bar">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                >
                    Bold
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                >
                    Italic
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                >
                    H1
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                >
                    H2
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                >
                    Bullet List
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                >
                    Ordered List
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                >
                    Strike
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={editor.isActive('codeBlock') ? 'is-active' : ''}
                >
                    Code Block
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                >
                    Blockquote
                </button>
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    Undo
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    Redo
                </button>
                <button
                    onClick={() => editor.chain().focus().setColor('#958DF1').run()}
                    className={editor.isActive('textStyle', { color: '#958DF1' }) ? 'is-active' : ''}
                >
                    Purple
                </button>
                <ExportButton editor={editor} type='raw' />
                <ExportButton editor={editor} type='rendered' />
            </div>

            <div className="editor-wrapper ">
                <EditorContent editor={editor} />

                {editor && (
                    <BubbleMenu editor={editor} className='flex gap-2 absolute top-10'>
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`dark:bg-slate-600 border px-2 py-1 bg-gray-100 rounded ${editor.isActive('bold') ? 'is-active' : ''}`}
                        >
                            Bold
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`dark:bg-slate-600 border px-2 py-1 bg-gray-100 rounded ${editor.isActive('italic') ? 'is-active' : ''}`}
                        >
                            Italic
                        </button>
                    </BubbleMenu>
                )}

                {suggestionQuery !== null && (
                    <div className="variables-popover"
                        style={{
                            position: 'absolute',
                            top: `${popoverPosition.top}px`,
                            left: `${popoverPosition.left}px`,
                            zIndex: 9999,
                        }}
                    >
                        <ul className="variables-list">
                            {filteredVariables.length > 0 ? (
                                filteredVariables.map((variable, index) => (
                                    <VariableItem
                                        key={variable.id}
                                        variable={variable}
                                        isSelected={index === selectedIndex}
                                        onClick={() => insertVariable(variable)}
                                    />
                                ))
                            ) : (
                                <li className="no-results">No variables found</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div >
    )
}

export default VariableEditor