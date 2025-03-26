// import { useCallback } from 'react';
// import { Editor } from '@tiptap/core';
// import { VARIABLES } from '../variables';

// interface ExportButtonProps {
//     editor: Editor | null; // The Tiptap editor instance
//     type: 'raw' | 'rendered'; // Type of export: raw (with variables) or rendered (with variable values)
// }

// // Converts the editor's JSON content to HTML
// const jsonToHtml = (node: any, keepVariables: boolean): string => {
//     console.log('node', node.type)
//     // Handles plain text nodes
//     if (node.type === 'text') {
//         return node.text || '';
//     }

//     // Handles variable nodes when exporting raw content (keeps variables as placeholders)
//     if (node.type === 'variable' && keepVariables) {
//         return `{{${node.attrs.label}}}`;
//     }

//     // Handles variable nodes when exporting rendered content (replaces variables with their values)
//     if (node.type === 'variable' && !keepVariables) {
//         const variable = VARIABLES.find(v => v.id === node.attrs.id);
//         return variable ? variable.value : '';
//     }

//     // Recursively processes child nodes
//     let html = '';
//     if (node.content) {
//         for (const child of node.content) {
//             html += jsonToHtml(child, keepVariables);
//         }
//     }

//     // Converts specific node types to their corresponding HTML tags
//     switch (node.type) {
//         case 'paragraph':
//             return `<p>${html}</p>`;
//         case 'heading':
//             return `<h${node.attrs.level}>${html}</h${node.attrs.level}>`;
//         case 'bulletList':
//             return `<ul>${html}</ul>`;
//         case 'orderedList':
//             return `<ol>${html}</ol>`;
//         case 'listItem':
//             return `<li>${html}</li>`;
//         case 'bold':
//             return `<strong>${html}</strong>`;
//         case 'italic':
//             return `<em>${html}</em>`;
//         case 'strike':
//             return `<s>${html}</s>`;
//         case 'code':
//         case 'codeBlock':
//             return `<div class="terminal"><code>${html}</code></div>`;
//         case 'blockquote':
//             return `<blockquote>${html}</blockquote>`;
//         case 'textStyle':
//             return `<span style="color: ${node.attrs.color}">${html}</span>`;
//         case 'doc':
//             return html; // Root document node, just returns the content
//         default:
//             return html; // Default case for unsupported node types
//     }
// };

// const getHtmlTemplate = (content: string) => `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Exported Content</title>
//   <style>

//     .terminal {
//       background-color: #252525;
//       border-radius: 4px;
//       padding:1rem;
//       overflow-x: auto;
//       border-left: 3px solid #569cd6;
//     }
//     .terminal code {
//       font-family: 'Courier New', monospace;
//       color: #d4d4d4;
//       white-space: pre;
//     }
//     pre {
//       margin: 0;
//     }
//     /* Syntax highlighting colors */
//     .token.comment { color: #6a9955; }
//     .token.keyword { color: #569cd6; }
//     .token.string { color: #ce9178; }
//     .token.number { color: #b5cea8; }
//     .token.function { color: #dcdcaa; }
//   </style>
// </head>
// <body>
//   ${content}
// </body>
// </html>
// `;

// // Button component for exporting editor content
// const ExportButton = ({ editor, type }: ExportButtonProps) => {
//     // Handles the export functionality
//     const handleExport = useCallback(() => {
//         if (!editor) return;

//         // Gets the editor's content as JSON
//         const json = editor.getJSON();

//         // Converts the JSON content to HTML based on the export type
//         const content = jsonToHtml(json, type === 'raw');
//         const fullHtml = getHtmlTemplate(content);
//         // Creates a downloadable HTML file
//         const blob = new Blob([fullHtml], { type: 'text/html' });
//         const url = URL.createObjectURL(blob);

//         // Creates a temporary anchor element to trigger the download
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `exported_content_${type}.html`; // Sets the file name
//         document.body.appendChild(a);
//         a.click(); // Triggers the download
//         document.body.removeChild(a); // Cleans up the DOM
//         URL.revokeObjectURL(url); // Releases the object URL
//     }, [editor, type]);

//     // Renders the export button
//     return (
//         <button
//             onClick={handleExport} // Calls the export handler when clicked
//             className="export-button"
//             disabled={!editor} // Disables the button if the editor is not initialized
//         >
//             Export {type.charAt(0).toUpperCase() + type.slice(1)} {/* Capitalizes the export type */}
//         </button>
//     );
// };

// export default ExportButton;


import { useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { VARIABLES } from './variables';

interface ExportButtonProps {
    editor: Editor | null;
    type: 'raw' | 'rendered';
}

const jsonToHtml = (node: any, keepVariables: boolean): string => {
    // Handle text nodes
    if (node.type === 'text') {
        // Preserve line breaks in code blocks
        if (node.text && node.parent?.type === 'codeBlock') {
            return node.text.replace(/\n/g, '<br>');
        }
        return node.text || '';
    }

    // Handle variables differently based on export type
    if (node.type === 'variable') {
        if (keepVariables) {
            return `<span class="variable">❴•❵${node.attrs.label}</span>`;
        } else {
            const variable = VARIABLES.find(v => v.id === node.attrs.id);
            return variable ? variable.value : '';
        }
    }

    // Process child nodes
    let html = '';
    if (node.content) {
        html = node.content.map((child: any) =>
            jsonToHtml(child, keepVariables)
        ).join('');
    }

    // Add HTML wrappers based on node type
    switch (node.type) {
        case 'paragraph':
            return `<p>${html}</p>`;
        case 'heading':
            return `<h${node.attrs.level}>${html}</h${node.attrs.level}>`;
        case 'bulletList':
            return `<ul>${html}</ul>`;
        case 'orderedList':
            return `<ol>${html}</ol>`;
        case 'listItem':
            return `<li>${html}</li>`;
        case 'bold':
            return `<strong>${html}</strong>`;
        case 'italic':
            return `<em>${html}</em>`;
        case 'strike':
            return `<s>${html}</s>`;
        case 'code':
            return `<code>${html}</code>`;
        case 'codeBlock':
            return `<div class="terminal"><pre><code>${html}</code></pre></div>`;
        case 'blockquote':
            return `<blockquote>${html}</blockquote>`;
        case 'textStyle':
            return `<span style="color: ${node.attrs.color}">${html}</span>`;
        case 'doc':
            return html;
        default:
            return html;
    }
};

const getHtmlTemplate = (content: string, isRaw: boolean) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported ${isRaw ? 'Raw' : 'Rendered'} Content</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    ${isRaw ? `
    .variable {
      background-color: #e0f2fe;
      color: #0369a1;
      padding: 0.2em 0.4em;
      border-radius: 0.25em;
      font-family: monospace;
    }
    ` : ''}
    .terminal {
      background-color: #252525;
      border-radius: 4px;
      padding: 1rem;
      overflow-x: auto;
      border-left: 3px solid #569cd6;
    }
    .terminal code {
      font-family: 'Courier New', monospace;
      color: #d4d4d4;
      white-space: pre;
    }
    pre {
      margin: 0;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.17em; }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;

const ExportButton = ({ editor, type }: ExportButtonProps) => {
    const handleExport = useCallback(() => {
        if (!editor) return;

        const json = editor.getJSON();
        const isRaw = type === 'raw';
        const content = jsonToHtml(json, isRaw);
        const fullHtml = getHtmlTemplate(content, isRaw);

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `exported_${type}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [editor, type]);

    return (
        <button
            onClick={handleExport}
            className="export-button"
            disabled={!editor}
        >
            Export {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
    );
};

export default ExportButton;