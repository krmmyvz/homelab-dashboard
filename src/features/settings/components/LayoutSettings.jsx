import React, { useContext } from 'react';
import { Layout, Grid3x3, Maximize2, Eye, Tag, Activity, ExternalLink } from 'lucide-react';
import { SettingsContext } from '@/contexts/SettingsContext';
import SettingsListItem from './SettingsListItem';
import ToggleSwitch from '@/components/ToggleSwitch/ToggleSwitch';
import SliderItem from './SliderItem';
import SettingsGroup from './SettingsGroup';
import iconSizes from '@/theme/tokens/icons';
import styles from '../Settings.module.css';

const LayoutSettings = () => {
    const { appSettings, setAppSettings } = useContext(SettingsContext);

    const handleSettingChange = (key, value) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    // Kart boyutu seçenekleri
    const cardSizes = [
        { id: 'small', label: 'Küçük', height: '140px' },
        { id: 'medium', label: 'Orta', height: '180px' },
        { id: 'large', label: 'Büyük', height: '220px' }
    ];

    const selectedCardSize = cardSizes.find(s => s.id === (appSettings.cardSize || 'medium'));

    // Kolon sayısı değişikliğini handle et
    const handleColumnChange = (columns) => {
        handleSettingChange('gridColumns', columns);
        // gridColumns ayarlandığında gridDensity'yi null yap
        handleSettingChange('gridDensity', 'custom');
    };

    // Mevcut kolon sayısı (custom ise gridColumns, yoksa gridDensity'den)
    const getCurrentColumns = () => {
        if (appSettings.gridColumns) {
            return appSettings.gridColumns;
        }
        // gridDensity'den varsayılan kolon sayısını hesapla
        const densityMap = { compact: 4, medium: 3, spacious: 2 };
        return densityMap[appSettings.gridDensity] || 3;
    };

    return (
        <SettingsGroup title="Düzen ve Görünüm" icon={Layout}>
            {/* Grid Kolon Kontrolü */}
            <div className={styles.settingsList}>
                <SliderItem
                    icon={Grid3x3}
                    title="Kolon Sayısı"
                    subtitle={`${getCurrentColumns()} kolon`}
                    value={getCurrentColumns()}
                    min="2"
                    max="6"
                    step="1"
                    onChange={(value) => handleColumnChange(parseInt(value, 10))}
                />
            </div>

            {/* Kart Boyutu */}
            <div className={styles.settingsCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderContent}>
                        <Maximize2 size={iconSizes['icon-sm']} />
                        <div className={styles.cardHeaderText}>
                            <span className={styles.cardTitle}>Kart Boyutu</span>
                            <span className={styles.cardSubtitle}>Sunucu kartlarının görsel boyutunu ayarla</span>
                        </div>
                    </div>
                </div>
                <div className={styles.cardContent}>
                    <div className={styles.segmentedControl}>
                        {cardSizes.map((size) => (
                            <button
                                key={size.id}
                                onClick={() => handleSettingChange('cardSize', size.id)}
                                className={`${styles.segmentedButton} ${
                                    (appSettings.cardSize || 'medium') === size.id ? styles.active : ''
                                }`}
                            >
                                {size.label}
                            </button>
                        ))}
                    </div>
                    <div className={styles.cardSizePreview}>
                        <div className={styles.cardSizeLabel}>Önizleme Yüksekliği:</div>
                        <div className={styles.cardSizeValue}>{selectedCardSize?.height}</div>
                    </div>
                </div>
            </div>

            {/* Kart İçerik Gösterimi */}
            <div className={styles.settingsCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderContent}>
                        <Eye size={iconSizes['icon-sm']} />
                        <div className={styles.cardHeaderText}>
                            <span className={styles.cardTitle}>Kart İçeriği</span>
                            <span className={styles.cardSubtitle}>Hangi bilgilerin gösterileceğini seç</span>
                        </div>
                    </div>
                </div>
                <div className={styles.cardContent}>
                    <div className={styles.settingsList}>
                        <SettingsListItem 
                            icon={Activity} 
                            title="Durum Rozeti" 
                            subtitle="Online/Offline göstergesi"
                        >
                            <ToggleSwitch
                                checked={appSettings.showCardStatus !== false}
                                onChange={() => handleSettingChange('showCardStatus', !appSettings.showCardStatus)}
                            />
                        </SettingsListItem>

                        <SettingsListItem 
                            icon={Layout} 
                            title="Açıklama" 
                            subtitle="Sunucu açıklama metni"
                        >
                            <ToggleSwitch
                                checked={appSettings.showCardDescriptions}
                                onChange={() => handleSettingChange('showCardDescriptions', !appSettings.showCardDescriptions)}
                            />
                        </SettingsListItem>

                        <SettingsListItem 
                            icon={ExternalLink} 
                            title="URL Adresi" 
                            subtitle="Sunucu erişim adresi"
                        >
                            <ToggleSwitch
                                checked={appSettings.showCardUrls}
                                onChange={() => handleSettingChange('showCardUrls', !appSettings.showCardUrls)}
                            />
                        </SettingsListItem>

                        <SettingsListItem 
                            icon={Tag} 
                            title="Etiketler" 
                            subtitle="Sunucu tag'leri"
                        >
                            <ToggleSwitch
                                checked={appSettings.showCardTags !== false}
                                onChange={() => handleSettingChange('showCardTags', !appSettings.showCardTags)}
                            />
                        </SettingsListItem>

                        <SettingsListItem 
                            icon={Activity} 
                            title="Metrikler" 
                            subtitle="Yanıt süresi ve performans"
                        >
                            <ToggleSwitch
                                checked={appSettings.showCardMetrics !== false}
                                onChange={() => handleSettingChange('showCardMetrics', !appSettings.showCardMetrics)}
                            />
                        </SettingsListItem>
                    </div>
                </div>
            </div>
        </SettingsGroup>
    );
};

export default React.memo(LayoutSettings);
