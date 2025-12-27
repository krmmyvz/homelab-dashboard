import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Type, MousePointer, SunMoon, ImageIcon, Trash2, Image as ImageIconFeather, Monitor, Droplets, Palette, Sparkles, Grid3x3, Plus } from 'lucide-react';
import { SettingsContext } from '@/contexts/SettingsContext';
import SettingsListItem from './SettingsListItem';
import ToggleSwitch from '@/components/ToggleSwitch/ToggleSwitch';
import SliderItem from './SliderItem';
import CustomSelect from '@/components/CustomSelect/CustomSelect';
import SettingsGroup from './SettingsGroup';
import ColorPicker from '@/components/ColorPicker/ColorPicker';
import BackgroundPatternSelector from '@/components/BackgroundPatternSelector/BackgroundPatternSelector';
import { fonts, basicColors } from '@/theme/constants';
import iconSizes from '@/theme/tokens/icons';
import { expandVariants } from '@/theme/tokens/variants';
import styles from '../Settings.module.css';

const MultiColorSwatch = ({ colors, isSelected, onClick }) => {
    const gradient = `conic-gradient(from 90deg, ${colors.join(', ')})`;
    return (
        <motion.div className={styles.colorSwatchWrapper} whileHover={{ scale: 1.1 }} onTap={onClick}>
            <div className={`${styles.colorSwatch} ${isSelected ? styles.selected : ''}`}>
                <div className={styles.colorSwatchInner} style={{ background: gradient }} />
            </div>
            <AnimatePresence>
            {isSelected && (
                <motion.div className={styles.colorSwatchCheck} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

const AppearanceSettings = () => {
    const { appSettings, setAppSettings, wallpaperInputRef, wallpaperColors, handleSeedColorChange, removeFile } = useContext(SettingsContext);
    const [activeColorTab, setActiveColorTab] = useState(appSettings.customWallpaper ? 'wallpaper' : 'basic');
    const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

    const handleSettingChange = (key, value) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };
    
    const handleWallpaperSettingChange = (key, value) => {
        setAppSettings(prev => ({ ...prev, wallpaperSettings: { ...prev.wallpaperSettings, [key]: value } }));
    };

    const themeOptions = [ { id: 'light', icon: Sun, label: 'Açık' }, { id: 'dark', icon: Moon, label: 'Koyu' }, { id: 'system', icon: Monitor, label: 'Sistem' } ];
    const colorSourceOptions = [ { id: 'wallpaper', label: 'Duvar Kağıdı' }, { id: 'basic', label: 'Temel Renkler' } ];
    const selectedThemeName = { light: 'Açık', dark: 'Koyu', system: 'Sistem' }[appSettings.theme] || 'Sistem';

    React.useEffect(() => {
        if (!appSettings.customWallpaper && activeColorTab === 'wallpaper') {
            setActiveColorTab('basic');
        }
    }, [appSettings.customWallpaper, activeColorTab]);

    return (
        <SettingsGroup title="Görünüm" icon={Palette}>
            {/* Duvar Kağıdı ve Renk Paleti */}
            <div className={styles.settingsCard}>
                 <div className={`${styles.wallpaperPreviewContainer} ${!appSettings.customWallpaper ? styles.placeholder : ''}`}
                         style={appSettings.customWallpaper ? {backgroundImage: `url(${appSettings.customWallpaper})`} : {}}>
                        {!appSettings.customWallpaper && (<> <ImageIcon size={iconSizes['icon-xl']} /> <span>Dinamik renkler için bir duvar kağıdı seçin</span> </>)}
                        <div className={styles.wallpaperActions}>
                            <motion.button 
                                className={styles.wallpaperActionButton} 
                                onClick={() => wallpaperInputRef.current?.click()} 
                                whileTap={{scale: 0.95}}
                            >
                                <ImageIcon size={iconSizes['icon-sm']}/> {appSettings.customWallpaper ? 'Duvar Kağıdını Değiştir' : 'Duvar Kağıdı Seç'}
                            </motion.button>
                            {appSettings.customWallpaper && (
                                 <motion.button 
                                    className={`${styles.wallpaperActionButton} ${styles.delete}`} 
                                    onClick={() => removeFile('wallpaper')} 
                                    whileTap={{scale: 0.95}}
                                >
                                    <Trash2 size={iconSizes['icon-sm']}/> Kaldır
                                </motion.button>
                            )}
                        </div>
                    </div>
                <AnimatePresence>
                    {appSettings.customWallpaper && (
                        <motion.div className={styles.wallpaperSliders} variants={expandVariants} initial="collapsed" animate="open" exit="collapsed">
                            <SliderItem icon={ImageIconFeather} title="Bulanıklık" subtitle={`${appSettings.wallpaperSettings?.blur ?? 0}px`} value={appSettings.wallpaperSettings?.blur ?? 0} min="0" max="20" onChange={(value) => handleWallpaperSettingChange('blur', parseInt(value))} />
                            <SliderItem icon={SunMoon} title="Parlaklık" subtitle={`${appSettings.wallpaperSettings?.brightness ?? 100}%`} value={appSettings.wallpaperSettings?.brightness ?? 100} min="50" max="150" onChange={(value) => handleWallpaperSettingChange('brightness', parseInt(value))} />
                        </motion.div>
                    )}
                </AnimatePresence>
                 <div className={styles.colorSelectionSection}>
                        <div className={styles.segmentedControl}>
                            {colorSourceOptions.map((option) => (
                                <button key={option.id} onClick={() => setActiveColorTab(option.id)}
                                    className={`${styles.segmentedButton} ${activeColorTab === option.id ? styles.active : ''}`}
                                    disabled={option.id === 'wallpaper' && !appSettings.customWallpaper}>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.colorPaletteContainer}>
                            <AnimatePresence mode="wait">
                            {activeColorTab === 'wallpaper' && appSettings.customWallpaper && (
                                <motion.div key="wallpaper-colors" className={styles.colorSwatchContainer} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                                {wallpaperColors.length > 0 ? ( wallpaperColors.map((color, index) => <MultiColorSwatch key={index} colors={[color, wallpaperColors[(index + 1) % wallpaperColors.length], wallpaperColors[(index + 2) % wallpaperColors.length]]} isSelected={appSettings.seedColor === color} onClick={() => handleSeedColorChange(color)} />)) : <span className={styles.subtitle}>Renk paleti oluşturulamadı.</span>}
                                </motion.div>
                            )}
                            {activeColorTab === 'basic' && (
                                <motion.div key="basic-colors" className={styles.colorSwatchContainer} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                                {basicColors.map((color, index) => <MultiColorSwatch key={index} colors={[color.hex, basicColors[(index + 2) % basicColors.length].hex, basicColors[(index + 4) % basicColors.length].hex]} isSelected={appSettings.seedColor === color.hex} onClick={() => handleSeedColorChange(color.hex)} />)}
                                <motion.div 
                                    className={styles.colorSwatchWrapper} 
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => setShowCustomColorPicker(true)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Özel renk seçici"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setShowCustomColorPicker(true);
                                        }
                                    }}
                                >
                                    <div className={styles.colorSwatch}>
                                        <div className={`${styles.colorSwatchInner} ${styles.customColorPicker}`}>
                                            <Plus size={iconSizes['icon-sm']} aria-hidden="true" />
                                        </div>
                                    </div>
                                </motion.div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </div>
            </div>

            {/* Custom Color Picker Modal */}
            <AnimatePresence>
                {showCustomColorPicker && (
                    <>
                        <motion.div 
                            className={styles.colorPickerOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCustomColorPicker(false)}
                        />
                        <motion.div 
                            className={styles.colorPickerModal}
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        >
                            <div className={styles.colorPickerHeader}>
                                <Palette size={iconSizes['icon-sm']} />
                                <h3>Özel Accent Rengi</h3>
                            </div>
                            <div className={styles.colorPickerContent}>
                                <ColorPicker
                                    label="Tema rengini özelleştir"
                                    value={appSettings.customAccentColor || appSettings.seedColor || '#3b82f6'}
                                    onChange={(color) => {
                                        handleSettingChange('customAccentColor', color);
                                        handleSeedColorChange(color);
                                    }}
                                />
                            </div>
                            <div className={styles.colorPickerActions}>
                                <button 
                                    className={styles.colorPickerButton}
                                    onClick={() => setShowCustomColorPicker(false)}
                                >
                                    Tamam
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Temel Görünüm Ayarları */}
            <div className={styles.settingsList}>
                <SettingsListItem icon={SunMoon} title="Uygulama Teması" subtitle={selectedThemeName}>
                     <div className={styles.segmentedControl}>
                        {themeOptions.map((option) => (
                            <motion.button key={option.id} onClick={() => handleSettingChange('theme', option.id)}
                                className={`${styles.segmentedButton} ${styles.iconOnly} ${appSettings.theme === option.id ? styles.active : ''}`} whileTap={{ scale: 0.95 }} title={option.label}>
                                <option.icon size={20}/>
                            </motion.button>
                        ))}
                    </div>
                </SettingsListItem>

                <SettingsListItem icon={Type} title="Yazı Tipi" subtitle={fonts.find(f => f.id === appSettings.font)?.name || 'Default'}>
                    <CustomSelect options={fonts} value={appSettings.font} onChange={(e) => handleSettingChange('font', e.target.value)} />
                </SettingsListItem>
                
                <SliderItem
                    icon={Droplets}
                    title="Header Opaklığı"
                    subtitle={`${appSettings.headerOpacity ?? 100}%`}
                    value={appSettings.headerOpacity ?? 100}
                    min="0" max="100" step="5"
                    onChange={(value) => handleSettingChange('headerOpacity', parseInt(value, 10))}
                />
            </div>

            {/* Arka Plan Deseni - Compact Card */}
            <div className={styles.settingsCard}>
                 <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderContent}>
                        <Grid3x3 size={iconSizes['icon-sm']} />
                        <div className={`${styles.cardHeaderText} ${styles.spacingSm}`}>
                            <span className={`${styles.cardTitle} ${styles.settingsTitle}`}>Arka Plan Deseni</span>
                            <span className={`${styles.cardSubtitle} ${styles.settingsCaption}`}>Arka plana dekoratif desen ekle</span>
                        </div>
                    </div>
                </div>
                <div className={`${styles.cardContent} ${styles.spacingMd}`}>
                    <BackgroundPatternSelector
                        value={appSettings.backgroundPattern || 'none'}
                        onChange={(pattern) => handleSettingChange('backgroundPattern', pattern)}
                    />
                </div>
            </div>

            {/* Glass Morphism - Compact Card */}
            <div className={styles.settingsCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderContent}>
                        <Sparkles size={iconSizes['icon-sm']} />
                        <div className={`${styles.cardHeaderText} ${styles.spacingSm}`}>
                            <span className={`${styles.cardTitle} ${styles.settingsTitle}`}>Glass Morphism Efekti</span>
                            <span className={`${styles.cardSubtitle} ${styles.settingsCaption}`}>Kartlara modern cam efekti uygula</span>
                        </div>
                    </div>
                </div>
                <div className={`${styles.cardContent} ${styles.spacingMd}`}>
                    <SliderItem
                        icon={Droplets}
                        title="Kart Opaklığı"
                        subtitle={`${appSettings.cardOpacity ?? 100}%`}
                        value={appSettings.cardOpacity ?? 100}
                        min="60"
                        max="100"
                        step="5"
                        onChange={(value) => handleSettingChange('cardOpacity', parseInt(value, 10))}
                    />
                    <SliderItem
                        icon={ImageIconFeather}
                        title="Arka Plan Bulanıklığı"
                        subtitle={`${appSettings.cardBlur ?? 0}px`}
                        value={appSettings.cardBlur ?? 0}
                        min="0"
                        max="20"
                        step="2"
                        onChange={(value) => handleSettingChange('cardBlur', parseInt(value, 10))}
                    />
                </div>
            </div>
        </SettingsGroup>
    );
};

export default React.memo(AppearanceSettings);