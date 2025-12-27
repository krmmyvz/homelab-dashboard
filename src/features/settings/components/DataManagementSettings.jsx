import React, { useContext } from 'react';
import { Download, Upload, AlertTriangle, Database } from 'lucide-react';
import { ServerDataContext } from '../../../contexts/ServerDataContext';
import { UIContext } from '../../../contexts/UIContext';
import SettingsListItem from './SettingsListItem';
import SettingsGroup from './SettingsGroup';
import styles from '../Settings.module.css';

const DataManagementSettings = () => {
    const { resetData, importInputRef, exportData } = useContext(ServerDataContext);
    const { openModal } = useContext(UIContext);

    const handleResetClick = () => {
        openModal('confirm', {
          title: 'Ayarları Sıfırla',
          message: 'Tüm kategoriler, gruplar, sunucular ve kişisel ayarlarınız silinecektir. Bu işlem geri alınamaz. Emin misiniz?',
          confirmText: 'Evet, Sıfırla',
          onConfirm: resetData
        });
    };

    return (
        <SettingsGroup title="Veri Yönetimi" icon={Database}>
            <div className={styles.settingsList}>
                <SettingsListItem icon={Download} title="Yapılandırmayı Dışa Aktar" subtitle="Tüm ayarlarınızı bir JSON dosyası olarak kaydedin." isClickable={true} onClick={exportData} />
                <SettingsListItem icon={Upload} title="Yapılandırmayı İçe Aktar" subtitle="Daha önce kaydettiğiniz bir JSON dosyasını yükleyin." isClickable={true} onClick={() => importInputRef.current.click()} />
                <SettingsListItem icon={AlertTriangle} title="Uygulamayı Sıfırla" subtitle="Tüm verileri silerek başlangıç durumuna dönün." isClickable={true} onClick={handleResetClick} />
            </div>
        </SettingsGroup>
    );
};

export default DataManagementSettings;
