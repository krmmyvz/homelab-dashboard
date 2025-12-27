import React from 'react';
import { motion } from 'framer-motion';
import styles from '../Settings.module.css';

// YENİ: `status` prop'u eklendi, accessibility improvements
const SettingsListItem = ({
  icon,
  title,
  subtitle,
  children,
  isClickable = false,
  onClick = () => {},
  status,
  ariaLabel,
  ariaDescribedBy,
  disabled = false
}) => {
  const IconComponent = icon;

  const handleKeyDown = (event) => {
    if (isClickable && !disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const clickableProps = isClickable ? {
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  } : {};

  const itemProps = {
    className: `${styles.settingsItemRow} ${isClickable ? styles.clickable : ''} ${disabled ? styles.disabled : ''}`,
    onClick: isClickable && !disabled ? onClick : undefined,
    onKeyDown: isClickable && !disabled ? handleKeyDown : undefined,
    role: isClickable ? 'button' : 'group',
    tabIndex: isClickable && !disabled ? 0 : undefined,
    'aria-label': ariaLabel || title,
    'aria-describedby': ariaDescribedBy || (subtitle ? `${title}-subtitle` : undefined),
    'aria-disabled': disabled || undefined,
  };

  return (
    <motion.div
        {...itemProps}
        {...clickableProps}
    >
        {IconComponent && (
        <div className={styles.iconWrapper} aria-hidden="true">
            <IconComponent size={20} />
        </div>
        )}
        <div className={styles.textContent}>
            <span className={styles.title} id={`${title}-title`}>{title}</span>
            {subtitle && <span className={styles.subtitle} id={`${title}-subtitle`}>{subtitle}</span>}
        </div>
        {/* YENİ: Eğer bir `status` varsa, `children` yerine onu göster */}
        <div className={styles.control} role="group" aria-label={`${title} kontrol`}>
            {status ? status : children}
        </div>
    </motion.div>
  );
};

export default React.memo(SettingsListItem);
