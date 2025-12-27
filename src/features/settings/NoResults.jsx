import React from 'react';
import { Search } from 'lucide-react';
import styles from './Settings.module.css';

/**
 * NoResults - Empty state component for when no search results are found
 * Provides user guidance and visual feedback for empty states
 */
const NoResults = ({
  title = "No results found",
  description = "Try adjusting your search terms or filters to find what you're looking for.",
  icon = Search,
  action,
  className = ""
}) => (
  <div className={`${styles.noResults} ${className}`} role="status" aria-live="polite">
    {React.createElement(icon, {
      size: 48,
      className: styles.noResultsIcon,
      'aria-hidden': true
    })}

    <h3 className={styles.noResultsTitle}>
      {title}
    </h3>

    <p className={styles.noResultsText}>
      {description}
    </p>

    {action && (
      <div className={styles.noResultsAction}>
        {action}
      </div>
    )}
  </div>
);

export default NoResults;