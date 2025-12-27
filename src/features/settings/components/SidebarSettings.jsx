import React, { useContext } from 'react';
import { SettingsContext } from '@/contexts/SettingsContext';
import SettingsGroup from './SettingsGroup';
import SettingsListItem from './SettingsListItem';
import CustomSelect from '@/components/CustomSelect/CustomSelect';
import ToggleSwitch from '@/components/ToggleSwitch/ToggleSwitch';
import SliderItem from './SliderItem';
import { Droplets, MousePointer, MapPin, Palette, Maximize2, Minimize2 } from 'lucide-react';
import styles from '../Settings.module.css';

const SidebarSettings = () => {
  const { appSettings, setAppSettings } = useContext(SettingsContext);
  const sidebarSettings = appSettings.sidebar || {};

  const updateSidebarSetting = (key, value) => {
    setAppSettings(prevSettings => ({
      ...prevSettings,
      sidebar: {
        ...prevSettings.sidebar,
        [key]: value
      }
    }));
  };

  // Position options
  const positionOptions = [
    { id: 'left', label: 'Sol' },
    { id: 'right', label: 'Sağ' },
    { id: 'top', label: 'Üst' },
    { id: 'bottom', label: 'Alt' },
    { id: 'auto', label: 'Otomatik (Responsive)' }
  ];

  // Mode options
  const modeOptions = [
    { id: 'fixed', label: 'Sabit (Fixed)' },
    { id: 'overlay', label: 'Üstte (Overlay)' },
    { id: 'mini', label: 'Küçük (Mini - Sadece İkonlar)' },
    { id: 'compact', label: 'Kompakt' }
  ];

  // Behavior options
  const behaviorOptions = [
    { id: 'always-visible', label: 'Her Zaman Görünür' },
    { id: 'auto-hide', label: 'Otomatik Gizle' },
    { id: 'hover-expand', label: 'Hover ile Genişle' }
  ];

  // Icon size options
  const iconSizeOptions = [
    { id: 'small', label: 'Küçük (16px)' },
    { id: 'medium', label: 'Orta (20px)' },
    { id: 'large', label: 'Büyük (24px)' }
  ];

  // Density options
  const densityOptions = [
    { id: 'compact', label: 'Kompakt' },
    { id: 'comfortable', label: 'Rahat' },
    { id: 'spacious', label: 'Geniş' }
  ];

  return (
    <div className={styles.settingsSection}>
      {/* Position & Layout */}
      <SettingsGroup title="Konum ve Düzen" icon={MapPin} description="Sidebar'ın ekrandaki konumunu ve görünüm modunu ayarlayın">
        <SettingsListItem title="Konum" description="Sidebar'ın ekranda nerede görüneceğini seçin">
          <CustomSelect
            options={positionOptions}
            value={sidebarSettings.position || 'left'}
            onChange={(e) => updateSidebarSetting('position', e.target.value)}
          />
        </SettingsListItem>

        <SettingsListItem title="Görünüm Modu" description="Sidebar'ın nasıl görüneceğini belirleyin">
          <CustomSelect
            options={modeOptions}
            value={sidebarSettings.mode || 'fixed'}
            onChange={(e) => updateSidebarSetting('mode', e.target.value)}
          />
        </SettingsListItem>

        <SettingsListItem title="Davranış" description="Sidebar'ın açılma/kapanma davranışı">
          <CustomSelect
            options={behaviorOptions}
            value={sidebarSettings.behavior || 'always-visible'}
            onChange={(e) => updateSidebarSetting('behavior', e.target.value)}
          />
        </SettingsListItem>

        {sidebarSettings.behavior === 'auto-hide' && (
          <SliderItem
            title="Otomatik Gizlenme Gecikmesi"
            description="İnaktif kaldıktan kaç saniye sonra gizlensin"
            value={(sidebarSettings.autoHideDelay || 3000) / 1000}
            min={1}
            max={10}
            step={0.5}
            unit="saniye"
            onChange={(value) => updateSidebarSetting('autoHideDelay', value * 1000)}
          />
        )}
      </SettingsGroup>

      {/* Appearance */}
      <SettingsGroup title="Görünüm" icon={Palette} description="Sidebar'ın görsel özelliklerini özelleştirin">
        <SliderItem
          icon={Droplets}
          title="Sidebar Opaklığı"
          description="Sidebar arka plan şeffaflığı"
          value={appSettings.sidebarOpacity ?? 100}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(value) => setAppSettings(prev => ({ ...prev, sidebarOpacity: parseInt(value, 10) }))}
        />

        <SettingsListItem icon={MousePointer} title="Otomatik Daralt" description="Fare ayrıldığında sidebar daraltılır">
          <ToggleSwitch
            checked={appSettings.sidebarAutoCollapse}
            onChange={() => setAppSettings(prev => ({ ...prev, sidebarAutoCollapse: !prev.sidebarAutoCollapse }))}
          />
        </SettingsListItem>

        <SettingsListItem title="İkon Boyutu" description="Kategori ve grup ikonlarının boyutu">
          <CustomSelect
            options={iconSizeOptions}
            value={sidebarSettings.iconSize || 'medium'}
            onChange={(e) => updateSidebarSetting('iconSize', e.target.value)}
          />
        </SettingsListItem>

        <SettingsListItem title="Yoğunluk" description="Öğeler arası boşluk miktarı">
          <CustomSelect
            options={densityOptions}
            value={sidebarSettings.density || 'comfortable'}
            onChange={(e) => updateSidebarSetting('density', e.target.value)}
          />
        </SettingsListItem>

        <SettingsListItem title="Etiketleri Göster" description="Kategori ve grup isimlerini göster (hem dikey hem yatay mod)">
          <ToggleSwitch
            checked={sidebarSettings.showLabels !== false}
            onChange={(e) => updateSidebarSetting('showLabels', e.target.checked)}
          />
        </SettingsListItem>

        <SettingsListItem title="Badge'leri Göster" description="Bildirim ve sayı göstergelerini göster">
          <ToggleSwitch
            checked={sidebarSettings.showBadges !== false}
            onChange={(e) => updateSidebarSetting('showBadges', e.target.checked)}
          />
        </SettingsListItem>

        <SettingsListItem title="Grup Sayılarını Göster" description="Her kategorideki grup sayısını göster">
          <ToggleSwitch
            checked={sidebarSettings.showGroupCounts !== false}
            onChange={(e) => updateSidebarSetting('showGroupCounts', e.target.checked)}
          />
        </SettingsListItem>
      </SettingsGroup>

      {/* Size Settings (Only for vertical sidebars) */}
      {(sidebarSettings.position === 'left' || sidebarSettings.position === 'right' || !sidebarSettings.position || sidebarSettings.position === 'auto') && (
        <SettingsGroup title="Boyutlar (Dikey Mod)" icon={Maximize2} description="Sidebar genişlik ayarları">
          <SliderItem
            title="Kapalı Genişlik"
            description="Sidebar daraltıldığında genişlik"
            value={sidebarSettings.collapsedWidth || 60}
            min={50}
            max={100}
            step={5}
            unit="px"
            onChange={(value) => updateSidebarSetting('collapsedWidth', value)}
          />

          <SliderItem
            title="Açık Genişlik"
            description="Sidebar genişletildiğinde genişlik"
            value={sidebarSettings.expandedWidth || 280}
            min={200}
            max={400}
            step={10}
            unit="px"
            onChange={(value) => updateSidebarSetting('expandedWidth', value)}
          />
        </SettingsGroup>
      )}

      {/* Size Settings (Only for horizontal sidebars) */}
      {(sidebarSettings.position === 'top' || sidebarSettings.position === 'bottom') && (
        <SettingsGroup title="Boyutlar (Yatay Mod)" icon={Minimize2} description="Sidebar yükseklik ayarı">
          <SliderItem
            title="Yükseklik"
            description="Yatay sidebar yüksekliği"
            value={sidebarSettings.horizontalHeight || 80}
            min={60}
            max={120}
            step={5}
            unit="px"
            onChange={(value) => updateSidebarSetting('horizontalHeight', value)}
          />
        </SettingsGroup>
      )}
    </div>
  );
};

export default SidebarSettings;
