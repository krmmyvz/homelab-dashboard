// --- src/features/settings/components/SettingsGroup.jsx (TAB VERSION) ---
import React from 'react';
import { motion } from 'framer-motion';
import styles from './SettingsGroup.module.css';

const SettingsGroup = ({ title, icon: Icon, children }) => {
    return (
        <motion.section 
            className={styles.settingsGroup}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <header className={styles.groupHeader}>
                <div className={styles.headerLeft}>
                    {Icon && <Icon size={24} className={styles.headerIcon} />}
                    <h2 className={styles.headerTitle}>{title}</h2>
                </div>
            </header>
            
            <div className={styles.groupContent}>
                {children}
            </div>
        </motion.section>
    );
};

export default React.memo(SettingsGroup);