import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Mention } from '@tiptap/extension-mention'
import { Color } from "@tiptap/extension-color"
import { SuggestionProps } from '@tiptap/suggestion'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { VARIABLES } from '../variables'
import "./index.css"
import TextStyle from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'

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
                    },
                    onUpdate: (props: SuggestionProps) => {
                        setSuggestionQuery(props.query);
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
        ],

        editorProps: {
            attributes: {
                class: 'prose focus:outline-none',
            },
        },
    })

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
        <div className="editor-container shadow-xl">
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
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'is-active' : ''}
                >
                    Code
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
            </div>

            <div className="editor-wrapper">
                <EditorContent editor={editor} />

                {editor && (
                    <BubbleMenu editor={editor} className='flex gap-2'>
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`border px-2 py-1 bg-gray-100 rounded ${editor.isActive('bold') ? 'is-active' : ''}`}
                        >
                            Bold
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`border px-2 py-1 bg-gray-100 rounded ${editor.isActive('italic') ? 'is-active' : ''}`}
                        >
                            Italic
                        </button>
                    </BubbleMenu>
                )}

                {suggestionQuery !== null && (
                    <div className="variables-popover">
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
        </div>
    )
}

export default VariableEditor