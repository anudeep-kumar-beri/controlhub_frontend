import React from 'react';
import './KeyboardShortcutsHelp.css';

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl/Cmd', 'Z'], description: 'Undo last action' },
    { keys: ['Ctrl/Cmd', 'Shift', 'Z'], description: 'Redo action' },
    { keys: ['Ctrl/Cmd', 'Y'], description: 'Redo action (alternative)' },
    { keys: ['Delete'], description: 'Delete selected nodes' },
    { keys: ['Backspace'], description: 'Delete selected nodes' },
    { keys: ['Ctrl/Cmd', 'C'], description: 'Copy selected nodes' },
    { keys: ['Ctrl/Cmd', 'X'], description: 'Cut selected nodes' },
    { keys: ['Ctrl/Cmd', 'V'], description: 'Paste copied nodes' },
    { keys: ['Ctrl/Cmd', 'A'], description: 'Select all nodes' },
    { keys: ['Ctrl/Cmd', 'D'], description: 'Duplicate selected nodes' },
    { keys: ['Shift', 'Click'], description: 'Multi-select nodes' },
    { keys: ['Shift', 'Drag'], description: 'Box selection' },
    { keys: ['Right Click'], description: 'Context menu on node' },
    { keys: ['?'], description: 'Show this help' },
  ];

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="shortcuts-list">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="shortcut-item">
              <div className="shortcut-keys">
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    <kbd className="key">{key}</kbd>
                    {i < shortcut.keys.length - 1 && <span className="plus">+</span>}
                  </React.Fragment>
                ))}
              </div>
              <div className="shortcut-desc">{shortcut.description}</div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <p>Press <kbd className="key">?</kbd> anytime to toggle this help</p>
        </div>
      </div>
    </div>
  );
}
