import React, { useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Heading1, Type, Search as SearchIcon, Upload, Trash2, LayoutDashboard, Check, X } from 'lucide-react';
import { SettingsContext } from '@/contexts/SettingsContext';
import SettingsListItem from './SettingsListItem';
import ToggleSwitch from '@/components/ToggleSwitch/ToggleSwitch';
import CustomSelect from '@/components/CustomSelect/CustomSelect';
import SettingsGroup from './SettingsGroup';
import { searchEngines } from '@/constants/appConstants'; // DÜZELTME
import styles from '../Settings.module.css';

const extraContentVariants = {
    hidden: { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        paddingTop: '16px',
        paddingBottom: '16px',
        transition: { type: 'spring', duration: 0.5, bounce: 0.1 }
    },
};

const HeaderSettings = ({ isDropdownOpen, setDropdownOpen }) => {
    const { appSettings, setAppSettings } = useContext(SettingsContext); // DÜZELTME: setAppSettings
    const logoInputRef = useRef(null);

    // Add null checks and default values
    const headerSettings = appSettings?.header || {};
    const showLogo = headerSettings.showLogo ?? true; // Default to true if undefined
    const customLogo = headerSettings.customLogo || '';
    const showTitle = headerSettings.showTitle ?? true;
    const titleText = headerSettings.titleText || 'My Homelab';
    const showSubtitle = headerSettings.showSubtitle ?? true;
    const subtitleText = headerSettings.subtitleText || 'Dashboard';
    const searchEngine = headerSettings.searchEngine || 'google';
    const customSearchUrl = headerSettings.customSearchUrl || '';

    const handleHeaderChange = (key, value) => {
        // DÜZELTME: Artık setAppSettings kullanılıyor
        setAppSettings(prev => ({ ...prev, header: { ...prev.header, [key]: value } }));
    };

    const handleLogoUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleHeaderChange('customLogo', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        handleHeaderChange('customLogo', '');
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
    };

    const searchEngineOptions = Object.keys(searchEngines).map(engine => ({
        id: engine,
        name: engine.charAt(0).toUpperCase() + engine.slice(1)
    }));

    return (
        <SettingsGroup title="Header" icon={LayoutDashboard}>
            <div className={`${styles.settingsList} ${isDropdownOpen ? styles.dropdownIsOpen : ''}`}>
                <div className={styles.settingsListItem}>
                    <SettingsListItem
                        icon={ImageIcon}
                        title="Logoyu Göster"
                        subtitle={showLogo ? 'Görünür' : 'Gizli'}
                    >
                        <ToggleSwitch
                            checked={showLogo}
                            onChange={() => handleHeaderChange('showLogo', !showLogo)}
                            icons={{ checked: <Check size={14} />, unchecked: <X size={14} /> }}
                        />
                    </SettingsListItem>
                    <AnimatePresence>
                        {showLogo && (
                            <motion.div className={styles.settingsItemExtra} variants={extraContentVariants} initial="hidden" animate="visible" exit="hidden">
                                <div className={styles.logoUploadContainer}>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className={styles.fileInput}
                                        id="logo-upload"
                                    />
                                    <div className={styles.logoButtonsContainer}>
                                        <label htmlFor="logo-upload" className={styles.uploadButton}>
                                            <Upload size={16} />
                                            <span>Logo Yükle</span>
                                        </label>
                                        {customLogo && (
                                            <button
                                                onClick={handleRemoveLogo}
                                                className={styles.removeButton}
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                                <span>Kaldır</span>
                                            </button>
                                        )}
                                    </div>
                                    {customLogo && (
                                        <div className={styles.logoPreview}>
                                            <img src={customLogo} alt="Logo Preview" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={styles.settingsListItem}>
                    <SettingsListItem
                        icon={Heading1}
                        title="Başlığı Göster"
                        subtitle={showTitle ? 'Görünür' : 'Gizli'}
                    >
                        <ToggleSwitch
                            checked={showTitle}
                            onChange={() => handleHeaderChange('showTitle', !showTitle)}
                            icons={{ checked: <Check size={14} />, unchecked: <X size={14} /> }}
                        />
                    </SettingsListItem>
                    <AnimatePresence>
                        {showTitle && (
                            <motion.div className={styles.settingsItemExtra} variants={extraContentVariants} initial="hidden" animate="visible" exit="hidden">
                                <input
                                    type="text"
                                    className={styles.textInput}
                                    value={titleText}
                                    onChange={(e) => handleHeaderChange('titleText', e.target.value)}
                                    placeholder="Görünen Başlık"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={styles.settingsListItem}>
                    <SettingsListItem
                        icon={Type}
                        title="Alt Başlığı Göster"
                        subtitle={showSubtitle ? 'Görünür' : 'Gizli'}
                    >
                        <ToggleSwitch
                            checked={showSubtitle}
                            onChange={() => handleHeaderChange('showSubtitle', !showSubtitle)}
                            icons={{ checked: <Check size={14} />, unchecked: <X size={14} /> }}
                        />
                    </SettingsListItem>
                    <AnimatePresence>
                        {showSubtitle && (
                            <motion.div className={styles.settingsItemExtra} variants={extraContentVariants} initial="hidden" animate="visible" exit="hidden">
                                <input
                                    type="text"
                                    className={styles.textInput}
                                    value={subtitleText}
                                    onChange={(e) => handleHeaderChange('subtitleText', e.target.value)}
                                    placeholder="Görünen Alt Başlık"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={styles.settingsListItem}>
                    <SettingsListItem
                        icon={SearchIcon}
                        title="Arama Motoru"
                        subtitle={searchEngineOptions.find(o => o.id === searchEngine)?.name || 'Google'}
                    >
                        <CustomSelect
                            options={searchEngineOptions}
                            value={searchEngine}
                            onChange={(e) => handleHeaderChange('searchEngine', e.target.value)}
                            onToggle={setDropdownOpen}
                        />
                    </SettingsListItem>
                    <AnimatePresence>
                        {searchEngine === 'custom' && (
                            <motion.div className={styles.settingsItemExtra} variants={extraContentVariants} initial="hidden" animate="visible" exit="hidden">
                                <input
                                    type="text"
                                    className={styles.textInput}
                                    value={customSearchUrl}
                                    onChange={(e) => handleHeaderChange('customSearchUrl', e.target.value)}
                                    placeholder="https://example.com/search?q="
                                />
                                <p style={{
                                    fontSize: 'var(--typography-bodySmall-fontSize)',
                                    color: 'var(--color-on-surface-variant)',
                                    margin: 'var(--spacing-2) 0 0'
                                }}>
                                    Arama URL'nizi girin. Arama terimi URL'nin sonuna eklenecektir.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </SettingsGroup>
    );
};

export default React.memo(HeaderSettings);