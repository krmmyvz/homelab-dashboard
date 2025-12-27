# 🏠 Homelab Dashboard

**Modern, feature-rich dashboard for managing your entire homelab infrastructure from a single interface.**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.7.0-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=flat&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=flat&logo=redis)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=flat&logo=typescript)](https://typescriptlang.org/)

## 🌟 **Özellikler**

### 🎨 **Modern UI/UX**
- **Material 3 Design System** - Google'ın en güncel tasarım dili
- **Dinamik Tema Sistemi** - Wallpaper'dan otomatik renk çıkarma
- **Responsive Design** - Mobile-first yaklaşımla tüm cihazlarda mükemmel görünüm
- **Smooth Animations** - Framer Motion ile akıcı geçişler
- **Dark/Light Mode** - Sistem temasına otomatik uyum

### 📊 **Gelişmiş Monitoring**
- **Real-time Status Tracking** - WebSocket ile anlık durum güncellemeleri
- **Multi-Protocol Support** - HTTP, HTTPS, TCP, SSH protokol kontrolü
- **Performance Analytics** - ML destekli performans analizi ve anomali tespiti
- **Historical Data** - Geçmiş performans verilerinin grafiksel görünümü
- **Smart Alerts** - Otomatik uyarı sistemi ve bildirimler

### 🗄️ **Enterprise Database Integration**
- **MySQL/MariaDB Support** - Production-ready veritabanı entegrasyonu
- **Intelligent Fallback** - JSON dosya sistemine otomatik geçiş
- **Connection Pooling** - Optimize edilmiş veritabanı bağlantı yönetimi
- **Automated Schema** - Otomatik tablo oluşturma ve güncelleme

### ⚡ **High-Performance Caching**
- **Redis Integration** - Yüksek performanslı cache katmanı
- **Memory Fallback** - Redis erişilemediğinde bellek cache'i
- **Smart TTL Management** - Akıllı cache süresi yönetimi
- **API Response Caching** - API yanıtlarının optimize edilmiş cache'lenmesi

### 🔌 **Real-time Communication**
- **Dual WebSocket System** - Native WebSocket + Socket.IO desteği
- **Auto-reconnection** - Bağlantı kopması durumunda otomatik yeniden bağlanma
- **Rate Limiting** - Kötüye kullanımı önleyen akıllı sınırlama
- **Broadcasting** - Tüm client'lara anlık veri yayını

### 🎛️ **Advanced Configuration**
- **Drag & Drop Interface** - Kolay server ve kategori düzenleme
- **Custom Categories** - Özelleştirilebilir kategori ve gruplar
- **Flexible Layouts** - Grid bazlı esnek düzen sistemi
- **Import/Export** - Yapılandırma yedekleme ve geri yükleme

## 🚀 **Hızlı Başlangıç**

### **Gereksinimler**
- Node.js 18+ (Önerilen: 24.7.0+)
- npm veya yarn
- MySQL/MariaDB (Opsiyonel)
- Redis (Opsiyonel)

### **Kurulum**

1. **Repository'yi klonlayın:**
```bash
git clone <repository-url>
cd homelab-dashboard
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment dosyasını oluşturun:**
```bash
cp .env.example .env
```

4. **Environment değişkenlerini düzenleyin:**
```bash
# Database Configuration (Opsiyonel)
DB_HOST=localhost
DB_PORT=3306
DB_USER=homelab
DB_PASSWORD=your_password
DB_NAME=homelab_dashboard

# Redis Configuration (Opsiyonel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

5. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

6. **Tarayıcınızda açın:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

## 📱 **Kullanım Rehberi**

### **İlk Kurulum**
1. Uygulamayı açtıktan sonra ayarlar sekmesinden tema ve görünümü özelleştirin
2. Server'larınızı eklemek için "+" butonunu kullanın
3. Kategoriler oluşturarak server'larınızı gruplandırın
4. Wallpaper yükleyerek otomatik renk teması oluşturun

### **Server Ekleme**
```
- Server Adı: Benzersiz tanımlayıcı isim
- URL: http://example.com veya https://example.com:8080
- Açıklama: Server hakkında kısa bilgi
- Kategori: Hangi kategoriye ait olduğu
- İkon: Lucide React ikonlarından seçim
- Protokol: HTTP, HTTPS, TCP, SSH
```

### **Monitoring Özellikleri**
- **Status Checks**: 30 saniye aralıklarla otomatik kontrol
- **Response Time**: Yanıt süreleri grafiksel görünüm
- **Uptime Tracking**: Çalışma süresi istatistikleri
- **Alert System**: Durum değişikliklerinde anlık uyarılar

## 🏗️ **Mimari Yapı**

### **Frontend Stack**
```
React 19.1.0
├── Vite (Build Tool)
├── Framer Motion (Animations)
├── Material 3 Colors (Theme System)
├── React DnD (Drag & Drop)
├── Socket.IO Client (Real-time)
└── CSS Modules (Styling)
```

### **Backend Stack**
```
Node.js + Express
├── Socket.IO (WebSocket Server)
├── MySQL2 (Database Driver)
├── Redis (Cache Layer)
├── Sharp (Image Processing)
├── Multer (File Uploads)
├── Zod (Validation)
└── TCP-Ping (Protocol Checking)
```

### **Database Schema**
```sql
-- Ana tablolar
servers          (id, name, url, status, protocol, category_id)
categories       (id, name, color, icon)
server_groups    (id, name, description)
server_metrics   (id, server_id, response_time, status_code, timestamp)
alerts           (id, server_id, type, message, severity, created_at)
dashboard_settings (id, user_id, settings, updated_at)
```

## 🔧 **Development**

### **Available Scripts**
```bash
npm run dev          # Development server (Frontend + Backend)
npm run dev:unsafe   # Development with SSL certificate bypass
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run test suite
npm run test:ui      # Test UI with Vitest
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
```

### **Development Ports**
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:3001
- **WebSocket**: ws://localhost:3001/ws
- **Socket.IO**: http://localhost:3001/socket.io

### **Proxy Configuration**
Vite otomatik olarak API isteklerini backend'e yönlendirir:
```javascript
'/api' -> 'http://localhost:3001'
'/assets' -> 'http://localhost:3001' 
'/ws' -> 'ws://localhost:3001'
```

## 📊 **Phase 2 Features (Advanced)**

### **Machine Learning Analytics**
- **Anomaly Detection** - Z-score algoritması ile anormal davranış tespiti
- **Trend Analysis** - Geçmiş verilere dayalı trend analizi
- **Performance Prediction** - Gelecek performans tahminleri
- **Automated Recommendations** - Sistem optimizasyon önerileri

### **Enterprise Monitoring**
- **Multi-Protocol Checks** - HTTP, HTTPS, TCP, SSH, ICMP
- **Advanced Metrics** - CPU, Memory, Disk, Network metrikleri
- **Custom Alerts** - Email, Webhook, Discord, Slack entegrasyonu
- **SLA Reporting** - Detaylı çalışma süresi raporları

### **Enhanced WebSocket Features**
- **Room Management** - Client gruplandırma sistemi
- **Subscription System** - Seçici veri akışı
- **Rate Limiting** - Kötüye kullanım koruması
- **Metrics Broadcasting** - Real-time performans verileri

## 🔒 **Güvenlik**

- **CORS Protection** - Cross-origin request koruması
- **Input Validation** - Zod ile type-safe validation
- **File Upload Security** - Güvenli dosya yükleme
- **SQL Injection Prevention** - Parameterized queries
- **Rate Limiting** - API abuse koruması

## 🚀 **Production Deployment**

### **Build Process**
```bash
npm run build     # Frontend build
npm start         # Production server
```

### **Environment Variables**
```bash
NODE_ENV=production
PORT=3001
DB_HOST=your-db-host
REDIS_HOST=your-redis-host
CORS_ORIGIN=https://yourdomain.com
```

### **Docker Support**
```dockerfile
# Dockerfile örneği
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 **Katkıda Bulunma**

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'Add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 **Lisans**

Bu proje MIT lisansı altında lisanslanmıştır.

## 🔗 **API Endpoints**

### **Server Management**
```
GET    /api/config          # Tüm yapılandırma
POST   /api/config          # Yapılandırma güncelleme
GET    /api/servers         # Server listesi
POST   /api/servers         # Yeni server ekleme
PUT    /api/servers/:id     # Server güncelleme
DELETE /api/servers/:id     # Server silme
```

### **Monitoring**
```
GET    /api/monitoring/overview       # Genel durum özeti
GET    /api/monitoring/servers/:id    # Server detay monitoring
GET    /api/monitoring/metrics        # Performans metrikleri
GET    /api/monitoring/alerts         # Aktif uyarılar
```

### **System**
```
GET    /api/health          # Sistem sağlık kontrolü
GET    /api/stats           # Sistem istatistikleri
POST   /api/uploads         # Dosya yükleme
DELETE /api/uploads/:file   # Dosya silme
```

## 🎯 **Browser Support**

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📞 **Destek**

Herhangi bir sorun yaşarsanız:
1. GitHub Issues'da arama yapın
2. Yeni issue oluşturun
3. Detaylı açıklama ve log'ları paylaşın

---

**Homelab Dashboard** - Ev laboratuvarınızı yönetmenin en modern yolu! 🚀
