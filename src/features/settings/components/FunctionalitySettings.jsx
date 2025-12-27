import React, { useContext } from 'react';
import { RefreshCw, Timer, Link, Zap, Settings } from 'lucide-react';
import { SettingsContext } from '../../../contexts/SettingsContext';
import SettingsListItem from './SettingsListItem';
import ToggleSwitch from '../../../components/ToggleSwitch/ToggleSwitch';
import SliderItem from './SliderItem';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import SettingsGroup from './SettingsGroup';
import styles from '../Settings.module.css';

const FunctionalitySettings = () => {
    const { appSettings, setAppSettings } = useContext(SettingsContext);

    const handleSettingChange = (key, value) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    const refreshOptions = [
        { id: 15000, name: '15 Saniye' }, { id: 30000, name: '30 Saniye' },
        { id: 60000, name: '1 Dakika' }, { id: 300000, name: '5 Dakika' }, { id: 0, name: 'Manuel' },
    ];

    return (
        <SettingsGroup title="İşlevsellik ve Performans" icon={Settings}>
            <div className={styles.settingsList}>
                <SettingsListItem icon={RefreshCw} title="Yenileme Sıklığı" subtitle={refreshOptions.find(o => o.id === appSettings.pingInterval)?.name || 'Özel'}>
                    <CustomSelect
                        options={refreshOptions}
                        value={appSettings.pingInterval}
                        onChange={(e) => handleSettingChange('pingInterval', parseInt(e.target.value))}
                    />
                </SettingsListItem>

                <SliderItem icon={Timer} title="Ping Zaman Aşımı" subtitle={`${appSettings.pingTimeout / 1000} saniye`} value={appSettings.pingTimeout} min="2000" max="10000" step="1000" onChange={(value) => handleSettingChange('pingTimeout', parseInt(value))} />

                <SettingsListItem icon={Link} title="Linkleri Yeni Sekmede Aç" subtitle={appSettings.linkBehavior === 'newTab' ? 'Aktif' : 'Devre dışı'}>
                    <ToggleSwitch checked={appSettings.linkBehavior === 'newTab'} onChange={() => handleSettingChange('linkBehavior', appSettings.linkBehavior === 'newTab' ? 'sameTab' : 'newTab')} />
                </SettingsListItem>

                <SettingsListItem icon={Zap} title="Animasyonlar" subtitle={appSettings.animations ? 'Aktif' : 'Devre dışı'}>
                    <ToggleSwitch checked={appSettings.animations} onChange={() => handleSettingChange('animations', !appSettings.animations)} />
                </SettingsListItem>
            </div>
        </SettingsGroup>
    );
};

export default React.memo(FunctionalitySettings);
