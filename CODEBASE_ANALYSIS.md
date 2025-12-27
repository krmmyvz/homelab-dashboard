# Homelab Dashboard - Codebase Analizi

Bu belge, `homelab-dashboard` projesinin teknik yapısını, mimarisini ve bileşenlerini detaylı bir şekilde incelemektedir.

## 1. Proje Özeti
**Homelab Dashboard**, ev laboratuvarı (homelab) altyapısını tek bir arayüzden yönetmek ve izlemek için geliştirilmiş, modern ve özellik açısından zengin bir web uygulamasıdır. Hem sunucu (backend) hem de istemci (frontend) tarafını içeren bütünleşik bir yapıya sahiptir.

## 2. Teknoloji Yığını (Tech Stack)

### Backend (Sunucu Tarafı)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Veritabanı**: MySQL / MariaDB (Opsiyonel, JSON fallback mevcut)
- **Önbellek (Cache)**: Redis (Opsiyonel, Memory fallback mevcut)
- **Gerçek Zamanlı İletişim**: Socket.IO & Native WebSocket (`ws`)
- **Validasyon**: Zod
- **Görüntü İşleme**: Sharp
- **Dosya Yükleme**: Multer

### Frontend (İstemci Tarafı)
- **Framework**: React 19
- **Build Tool**: Vite
- **Dil**: JavaScript / TypeScript (Proje JS ağırlıklı görünse de TS konfigürasyonları mevcut)
- **Styling**: CSS Modules, Material 3 Design System (`@material/material-color-utilities`)
- **Animasyon**: Framer Motion
- **State/Veri Yönetimi**: React Hooks, Context API
- **İkonlar**: Lucide React

## 3. Mimari ve Dizin Yapısı

Proje, frontend ve backend kodlarını aynı depoda (monorepo benzeri ama tek paket) barındırmaktadır.

### Kök Dizin
- **`main-server.js`**: Uygulamanın ana giriş noktasıdır. Express sunucusunu, Socket.IO'yu ve WebSocket sunucusunu başlatır. API endpoint'lerini ve statik dosya sunumunu yönetir.
- **`vite.config.js`**: Frontend build konfigürasyonu.
- **`package.json`**: Proje bağımlılıkları ve script'ler.

### `src/` Dizini
Bu dizin ilginç bir şekilde hem frontend hem de backend kodlarını barındırıyor gibi görünmektedir:

#### Backend Servisleri (`src/services/`)
`main-server.js` tarafından import edilen ve sunucu tarafında çalışan servisler burada bulunur:
- **`databaseManager.js`**: MySQL bağlantısını ve sorgularını yönetir. Bağlantı yoksa hata yönetimi sağlar.
- **`cacheManager.js`**: Redis entegrasyonunu ve önbellekleme stratejilerini yönetir.
- **`statusMonitor.js` & `enhancedStatusMonitor.js`**: Sunucuların durumunu (online/offline) periyodik olarak kontrol eder.
- **`analyticsEngine.js`**: Performans verilerini analiz eder.
- **`protocolCheckers.js`**: HTTP, TCP, SSH gibi protokollerin kontrol mantığını içerir.

#### Frontend Bileşenleri
- **`components/`**: React UI bileşenleri.
- **`features/`**: Belirli özelliklere ait bileşenler ve mantıklar.
- **`hooks/`**: Custom React hook'ları.
- **`contexts/`**: React Context tanımları (Tema, Veri vb.).
- **`assets/`**: Görseller ve statik dosyalar.

## 4. Öne Çıkan Özellikler ve Mekanizmalar

### 1. Hibrit Veri Saklama (Intelligent Fallback)
Sistem, MySQL veritabanı mevcutsa onu kullanır. Ancak veritabanı bağlantısı yoksa veya koptuysa, verileri yerel JSON dosyaları veya bellek (in-memory) üzerinden yöneterek çalışmaya devam edebilir. Bu, kurulum kolaylığı ve dayanıklılık sağlar.

### 2. Çift Yönlü Gerçek Zamanlı İletişim
- **Socket.IO**: Frontend ile zengin veri alışverişi için kullanılır.
- **Native WebSocket (`/ws`)**: Daha düşük seviyeli veya farklı istemciler için ham WebSocket desteği de sunulmuştur.

### 3. Dinamik Tema Sistemi
Material 3 tasarım prensiplerini kullanır. Kullanıcının yüklediği duvar kağıdından (wallpaper) otomatik olarak renk paleti çıkararak (`colorthief` veya benzeri araçlarla) arayüz temasını dinamik olarak değiştirir.

### 4. Gelişmiş İzleme (Monitoring)
Sadece HTTP ping atmaz; TCP port kontrolü ve SSH bağlantı denemeleri gibi çoklu protokol desteği sunar. Ayrıca yanıt sürelerini ve uptime oranlarını takip eder.

## 5. Geliştirme ve Kurulum
- `npm run dev`: Hem Vite (frontend) hem de Node (backend) sunucusunu aynı anda başlatır (`concurrently` kullanarak).
- `npm run build`: Frontend'i production için derler (`dist` klasörüne).
- Production modunda `main-server.js`, `dist` klasöründeki statik dosyaları sunar.

## 6. Sonuç
Homelab Dashboard, modern web teknolojilerini (React 19, Vite) sağlam bir backend mimarisiyle (Node.js, Redis, MySQL) birleştiren, hem hobi hem de yarı-profesyonel kullanıma uygun, genişletilebilir bir projedir. Kod yapısı modülerdir ancak frontend ve backend kodlarının `src` altında iç içe geçmiş olması geliştirme sırasında dikkat gerektirebilir.
