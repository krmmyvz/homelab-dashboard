import React, { useContext } from 'react';
import { SettingsContext } from '@/contexts/SettingsContext';
import SettingsGroup from './SettingsGroup';
import SettingsListItem from './SettingsListItem';
import SliderItem from './SliderItem';
import ToggleSwitch from '@/components/ToggleSwitch/ToggleSwitch';
import CustomSelect from '@/components/CustomSelect/CustomSelect';
import { Bell, Volume2, Clock, MapPin, Filter, Layers } from 'lucide-react';
import styles from '../Settings.module.css';

const NotificationSettings = () => {
  const { appSettings, setAppSettings } = useContext(SettingsContext);

  // Varsayılan bildirim ayarları
  const notifications = appSettings.notifications || {
    enabled: true,
    position: 'top-right',
    duration: 5000,
    soundEnabled: false,
    soundVolume: 50,
    soundType: 'default',
    showProgress: true,
    minLevel: 'all',
    categoryFilters: {
      status: true,
      performance: true,
      network: true,
      system: true,
    },
  };

  const updateNotificationSetting = (key, value) => {
    setAppSettings(prev => ({
      ...prev,
      notifications: {
        ...(prev.notifications || {}),
        [key]: value,
      },
    }));
  };

  const updateCategoryFilter = (category, value) => {
    setAppSettings(prev => ({
      ...prev,
      notifications: {
        ...(prev.notifications || {}),
        categoryFilters: {
          ...(prev.notifications?.categoryFilters || {}),
          [category]: value,
        },
      },
    }));
  };

  const positionOptions = [
    { id: 'top-right', label: 'Sağ Üst' },
    { id: 'top-left', label: 'Sol Üst' },
    { id: 'bottom-right', label: 'Sağ Alt' },
    { id: 'bottom-left', label: 'Sol Alt' },
  ];

  const durationOptions = [
    { id: 3000, label: '3 saniye' },
    { id: 5000, label: '5 saniye' },
    { id: 10000, label: '10 saniye' },
    { id: 0, label: 'Manuel kapat' },
  ];

  const soundTypeOptions = [
    { id: 'default', label: 'Varsayılan' },
    { id: 'chime', label: 'Zil Sesi' },
    { id: 'ping', label: 'Ping' },
    { id: 'bell', label: 'Çan' },
  ];

  const levelOptions = [
    { id: 'all', label: 'Tümü' },
    { id: 'info', label: 'Bilgi ve Üzeri' },
    { id: 'warning', label: 'Uyarı ve Üzeri' },
    { id: 'error', label: 'Sadece Hatalar' },
  ];

  return (
    <SettingsGroup title="Bildirimler" icon={Bell}>
      {/* Genel Ayarlar */}
      <SettingsListItem
        icon={Bell}
        title="Bildirimleri Etkinleştir"
        subtitle="Tüm sistem bildirimlerini aç/kapat"
      >
        <ToggleSwitch
          checked={notifications.enabled !== false}
          onChange={(e) => updateNotificationSetting('enabled', e.target.checked)}
        />
      </SettingsListItem>

      {notifications.enabled !== false && (
        <>
          {/* Pozisyon Ayarı */}
          <SettingsListItem
            icon={MapPin}
            title="Bildirim Konumu"
            subtitle="Bildirimlerin ekranda görüneceği konum"
          >
            <CustomSelect
              options={positionOptions}
              value={notifications.position || 'top-right'}
              onChange={(e) => updateNotificationSetting('position', e.target.value)}
              placeholder="Konum seçin"
            />
          </SettingsListItem>

          {/* Süre Ayarı */}
          <SettingsListItem
            icon={Clock}
            title="Bildirim Süresi"
            subtitle="Bildirimlerin ekranda kalma süresi"
          >
            <CustomSelect
              options={durationOptions}
              value={notifications.duration ?? 5000}
              onChange={(e) => updateNotificationSetting('duration', Number(e.target.value))}
              placeholder="Süre seçin"
            />
          </SettingsListItem>

          {/* Progress Bar */}
          <SettingsListItem
            icon={Layers}
            title="İlerleme Çubuğu"
            subtitle="Bildirim süresini göster"
          >
            <ToggleSwitch
              checked={notifications.showProgress !== false}
              onChange={(e) => updateNotificationSetting('showProgress', e.target.checked)}
            />
          </SettingsListItem>

          {/* Minimum Seviye */}
          <SettingsListItem
            icon={Filter}
            title="Minimum Seviye"
            subtitle="Gösterilecek en düşük önem seviyesi"
          >
            <CustomSelect
              options={levelOptions}
              value={notifications.minLevel || 'all'}
              onChange={(e) => updateNotificationSetting('minLevel', e.target.value)}
              placeholder="Seviye seçin"
            />
          </SettingsListItem>

          {/* Ses Ayarları Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderContent}>
                <Volume2 size={20} />
                <div className={styles.cardHeaderText}>
                  <h4 className={styles.cardTitle}>Ses Ayarları</h4>
                  <p className={styles.cardSubtitle}>Bildirim ses efektlerini özelleştirin</p>
                </div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <SettingsListItem
                icon={Volume2}
                title="Bildirimlerde Ses"
                subtitle="Bildirimler gösterildiğinde ses çal"
              >
                <ToggleSwitch
                  checked={notifications.soundEnabled === true}
                  onChange={(e) => updateNotificationSetting('soundEnabled', e.target.checked)}
                />
              </SettingsListItem>

              {notifications.soundEnabled && (
                <>
                  <SliderItem
                    icon={Volume2}
                    title="Ses Seviyesi"
                    subtitle={`${notifications.soundVolume ?? 50}%`}
                    value={notifications.soundVolume ?? 50}
                    min="0"
                    max="100"
                    step="5"
                    onChange={(value) => updateNotificationSetting('soundVolume', parseInt(value))}
                  />

                  <SettingsListItem
                    icon={Volume2}
                    title="Ses Türü"
                    subtitle="Bildirim için çalınacak ses"
                  >
                    <CustomSelect
                      options={soundTypeOptions}
                      value={notifications.soundType || 'default'}
                      onChange={(e) => updateNotificationSetting('soundType', e.target.value)}
                      placeholder="Ses seçin"
                    />
                  </SettingsListItem>
                </>
              )}
            </div>
          </div>

          {/* Kategori Filtreleri Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderContent}>
                <Filter size={20} />
                <div className={styles.cardHeaderText}>
                  <h4 className={styles.cardTitle}>Kategori Filtreleri</h4>
                  <p className={styles.cardSubtitle}>Bildirim türlerini yönetin</p>
                </div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <SettingsListItem
                icon={Bell}
                title="Durum Bildirimleri"
                subtitle="Sunucu çevrimiçi/çevrimdışı durumu"
              >
                <ToggleSwitch
                  checked={notifications.categoryFilters?.status !== false}
                  onChange={(e) => updateCategoryFilter('status', e.target.checked)}
                />
              </SettingsListItem>

              <SettingsListItem
                icon={Bell}
                title="Performans Bildirimleri"
                subtitle="Yüksek CPU/RAM kullanımı uyarıları"
              >
                <ToggleSwitch
                  checked={notifications.categoryFilters?.performance !== false}
                  onChange={(e) => updateCategoryFilter('performance', e.target.checked)}
                />
              </SettingsListItem>

              <SettingsListItem
                icon={Bell}
                title="Ağ Bildirimleri"
                subtitle="Bağlantı ve yanıt süresi uyarıları"
              >
                <ToggleSwitch
                  checked={notifications.categoryFilters?.network !== false}
                  onChange={(e) => updateCategoryFilter('network', e.target.checked)}
                />
              </SettingsListItem>

              <SettingsListItem
                icon={Bell}
                title="Sistem Bildirimleri"
                subtitle="Genel sistem mesajları"
              >
                <ToggleSwitch
                  checked={notifications.categoryFilters?.system !== false}
                  onChange={(e) => updateCategoryFilter('system', e.target.checked)}
                />
              </SettingsListItem>
            </div>
          </div>
        </>
      )}
    </SettingsGroup>
  );
};

export default NotificationSettings;
