import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import styles from './Settings.module.css';

/**
 * SettingsSearch - Search and filter component for settings
 * Provides search functionality with filter tags and group navigation
 */
const SettingsSearch = ({
  searchValue,
  onSearchChange,
  filterTags = [],
  onFilterTagRemove,
  groupNavItems = [],
  activeGroup,
  onGroupChange,
  placeholder = "Search settings...",
  className = ""
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || '');

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleSearchClear = useCallback(() => {
    setLocalSearchValue('');
    onSearchChange?.('');
  }, [onSearchChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleSearchClear();
      e.target.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Trigger search action if needed
    }
  }, [handleSearchClear]);

  return (
    <div className={`${styles.settingsSearchContainer} ${className}`}>
      {/* Search Input */}
      <div className={styles.settingsSearchWrapper}>
        <Search
          size={20}
          className={styles.settingsSearchIcon}
          aria-hidden="true"
        />
        <input
          type="text"
          value={localSearchValue}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.settingsSearchInput}
          aria-label="Search settings"
          role="searchbox"
        />
        {localSearchValue && (
          <button
            type="button"
            onClick={handleSearchClear}
            className={styles.settingsSearchIcon}
            style={{ right: 'var(--spacing-3)', left: 'auto' }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Group Navigation */}
      {groupNavItems.length > 0 && (
        <nav className={styles.settingsGroupNav} role="tablist" aria-label="Settings groups">
          {groupNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onGroupChange?.(item.id)}
              className={`${styles.groupNavItem} ${activeGroup === item.id ? styles.active : ''}`}
              role="tab"
              aria-selected={activeGroup === item.id}
              aria-controls={`settings-group-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {/* Filter Tags */}
      {filterTags.length > 0 && (
        <div className={styles.settingsFilterTags} role="group" aria-label="Active filters">
          {filterTags.map((tag) => (
            <span
              key={tag.id}
              className={`${styles.filterTag} ${tag.active ? styles.active : ''}`}
            >
              {tag.label}
              {tag.removable && (
                <button
                  type="button"
                  onClick={() => onFilterTagRemove?.(tag.id)}
                  className={styles.filterTagRemove}
                  aria-label={`Remove ${tag.label} filter`}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SettingsSearch;