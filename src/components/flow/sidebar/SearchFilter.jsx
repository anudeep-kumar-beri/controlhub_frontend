import React, { useState } from 'react';
import './SearchFilter.css';

export default function SearchFilter({ nodes, onNodeSelect, currentWorkspace }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredNodes = nodes.filter(node => {
    const label = node.data.label?.toLowerCase() || '';
    const description = node.data.description?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return label.includes(search) || description.includes(search);
  });

  const handleNodeClick = (node) => {
    onNodeSelect(node);
  };

  return (
    <div className="search-filter glass-card">
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span>🔍 Search Nodes</span>
        <span className={`arrow ${isExpanded ? 'open' : ''}`}>▾</span>
      </div>

      {isExpanded && (
        <div className="search-content">
          <input
            type="text"
            placeholder="Search by label or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          {searchTerm && (
            <div className="search-results">
              {filteredNodes.length > 0 ? (
                <>
                  <p className="result-count">{filteredNodes.length} node(s) found</p>
                  {filteredNodes.map(node => (
                    <div
                      key={node.id}
                      className="search-result-item"
                      onClick={() => handleNodeClick(node)}
                    >
                      <strong>{node.data.label}</strong>
                      {node.data.description && (
                        <p className="result-desc">{node.data.description}</p>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p className="no-results">No matching nodes found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
