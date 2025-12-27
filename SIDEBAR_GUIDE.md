# 🎯 Sidebar Özelleştirme Rehberi

## 📍 1. KONUM (Position)

### **Sol (Left)** 
- Sidebar ekranın sol tarafında
- Klasik masaüstü uygulaması düzeni
- En yaygın kullanım

### **Sağ (Right)**
- Sidebar ekranın sağ tarafında
- Sağ elini kullananlar için ideal
- Reverse layout

### **Üst (Top)**
- Yatay sidebar, ekranın üstünde
- Tab/sekme şeklinde kategoriler
- Mobil cihazlar için ideal
- Scroll ile sağa-sola kayar

### **Alt (Bottom)**
- Yatay sidebar, ekranın altında
- Mobil uygulama tarzı navigation bar
- Parmakla erişim kolay

### **Otomatik (Auto)** 🤖
- Ekran boyutuna göre otomatik seçer:
  - 📱 **<768px (Mobil)**: Üst
  - 📱 **768-1024px (Tablet)**: Sol + Overlay
  - 💻 **>1024px (Desktop)**: Sol + Fixed

---

## 🎨 2. GÖRÜNÜM MODU (Display Mode)

### **Fixed (Sabit)** 📌
```
┌──────────┬─────────────┐
│ SIDEBAR  │   CONTENT   │
│          │             │
│          │             │
└──────────┴─────────────┘
```
- Sidebar her zaman sabit durur
- Content'i yana iter
- Masaüstü için ideal
- Resize handle ile genişlik ayarlanabilir

### **Overlay (Üstte)** 🎭
```
┌─────────────────────────┐
│ ┌─────────┐             │
│ │SIDEBAR  │  CONTENT    │
│ │ (üstte) │             │
│ └─────────┘             │
└─────────────────────────┘
```
- Sidebar content'in üstünde durur
- Content'i itmez, üzerini örter
- Backdrop (karartma) ile content geri planda
- Tablet için ideal
- Backdrop'a tıklayınca kapanır

### **Mini (Küçük - Sadece İkonlar)** 🔲
```
┌──┬──────────────────────┐
│▣ │     CONTENT          │
│▣ │                      │
│▣ │                      │
└──┴──────────────────────┘
```
- Sadece ikonlar görünür (60px genişlik)
- Hover ile üzerine gelince açılır
- Ekran alanından tasarruf
- Hızlı erişim için ideal

### **Compact (Kompakt)** 📏
- Fixed mod ama daha az padding
- Sıkışık görünüm
- Çok kategorisi olanlar için
- Normal genişlikte ama yoğun

---

## ⚙️ 3. DAVRANIŞLAR (Behaviors)

### **Her Zaman Görünür (Always Visible)** 👁️
- Sidebar sürekli açık
- Kullanıcı manuel kapatmadıkça açık kalır
- Fixed ve Overlay modlarında çalışır
- En basit mod

### **Otomatik Gizle (Auto-Hide)** ⏱️
```
Kullanıcı idle → 3 saniye bekle → Sidebar kapan
Kullanıcı hareket etti → Sidebar aç
```
- Belirlediğiniz süre sonra (varsayılan 3sn) otomatik kapanır
- Mouse hareket edince tekrar açılır
- Tam ekran için ideal
- Delay ayarlanabilir (1-10 saniye)

### **Hover ile Genişle (Hover Expand)** 🖱️
```
Normal: [▣] (kapalı/dar)
Hover:  [▣ Kategoriler] (açık/geniş)
```
- Varsayılan olarak kapalı/dar
- Mouse üzerine gelince açılır/genişler
- Mouse çekilince tekrar daralır
- Mini mode ile benzer ama daha akıllı

---

## 🔄 4. MOD KOMBİNASYONLARI

### **SOL/SAĞ (Vertical) Kombinasyonları:**

| Position | Mode | Behavior | Sonuç |
|----------|------|----------|-------|
| Sol | Fixed | Always Visible | Klasik masaüstü, sürekli açık |
| Sol | Fixed | Auto-Hide | Kullanınca görünür, boştayken gizli |
| Sol | Fixed | Hover Expand | Üzerine gelince açılır |
| Sol | Overlay | Always Visible | İçeriğin üstünde, backdrop ile |
| Sol | Overlay | Auto-Hide | Overlay + otomatik kapanma |
| Sol | Mini | - | Sadece ikonlar, hover'da açılır |
| Sol | Compact | - | Dar padding, sıkışık görünüm |
| Sağ | * | * | Sol ile aynı ama sağ tarafta |

### **ÜST/ALT (Horizontal) Kombinasyonları:**

| Position | Mode | Behavior | Sonuç |
|----------|------|----------|-------|
| Üst | Fixed | - | Yatay tab bar, sürekli görünür |
| Alt | Fixed | - | Alt navigation bar, mobil tarzı |

**NOT:** Üst/Alt modlarda Overlay/Mini/Compact çalışmaz!

---

## 🎯 5. ÖNERİLEN AYARLAR

### 📱 **Mobil/Küçük Ekran:**
```
Position: Üst (Top)
Mode: Fixed
Behavior: Always Visible
Labels: Kapalı (sadece ikonlar)
```

### 📱 **Tablet:**
```
Position: Sol (Left)
Mode: Overlay
Behavior: Auto-Hide (3sn)
Labels: Açık
```

### 💻 **Desktop - Çok Yer İsteyen:**
```
Position: Sol (Left)
Mode: Fixed
Behavior: Always Visible
Width: 280px
```

### 💻 **Desktop - Ekran Tasarrufu:**
```
Position: Sol (Left)
Mode: Mini
Behavior: Hover Expand
Labels: Açık (hover'da görünür)
```

### 💻 **Desktop - Odaklanma Modu:**
```
Position: Sol (Left)
Mode: Fixed
Behavior: Auto-Hide (5sn)
Labels: Açık
```

---

## 🔧 6. DİĞER AYARLAR

### **Görünüm Özellikleri:**
- **İkon Boyutu**: Küçük (16px) / Orta (20px) / Büyük (24px)
- **Yoğunluk**: Compact / Comfortable / Spacious
- **Etiketleri Göster**: Kategori/grup isimlerini göster/gizle
- **Badge'leri Göster**: Sunucu sayı göstergelerini göster/gizle
- **Grup Sayılarını Göster**: Her gruptaki sunucu sayısını göster

### **Boyutlar (Vertical Only):**
- **Kapalı Genişlik**: 50-100px (varsayılan 60px)
- **Açık Genişlik**: 200-500px (varsayılan 280px)

### **Boyutlar (Horizontal Only):**
- **Yükseklik**: 60-120px (varsayılan 80px)

---

## 🐛 7. ŞUAN ÇALIŞAN DURUMLAR

### ✅ **Çalışan:**
- Sol/Sağ/Üst/Alt konumları
- Fixed, Overlay, Mini, Compact modları
- Always Visible, Auto-Hide, Hover Expand davranışları
- Icon-only mode (showLabels: false)
- Otomatik responsive (Auto position)
- Backdrop tıklayınca kapanma
- Resize handle (Fixed modda)

### ⚠️ **Bilinen Sınırlamalar:**
- Üst/Alt modlarda sadece Fixed çalışır
- Mini mode'da behavior seçenekleri pasif
- Compact mode'da sadece padding azalır

---

## 💡 8. HIZLI KARŞILAŞTIRMA

### **Fixed vs Overlay**
- **Fixed**: İçeriği iter, sabit durur, resize edilebilir
- **Overlay**: İçeriğin üstünde, backdrop var, tıklayınca kapanır

### **Mini vs Hover Expand**
- **Mini**: Mod olarak seçilir, sürekli dar
- **Hover Expand**: Davranış olarak seçilir, başlangıçta kapalı

### **Auto-Hide vs Hover Expand**
- **Auto-Hide**: Zaman bazlı, X saniye sonra kapanır
- **Hover Expand**: Mesafe bazlı, mouse yaklaştığında açılır

### **Compact vs Mini**
- **Compact**: Normal genişlik, az padding
- **Mini**: Dar (60px), sadece ikonlar

---

## 🎮 9. NASIL TEST EDİLİR

1. **Ayarlar > Sidebar** sekmesine git
2. Farklı kombinasyonları dene:
   - `Sol + Fixed + Always Visible` → Klasik
   - `Sol + Overlay + Auto-Hide` → Modern
   - `Sol + Mini` → Minimalist
   - `Üst + Fixed` → Mobil tarzı
   - `Otomatik` → Responsive
3. Ekranı büyült/küçült
4. Hover'ları test et
5. Backdrop'a tıkla (Overlay modda)

---

**Son Güncelleme:** 29 Ekim 2025  
**Versiyon:** 2.0 - Tam Özelleştirme Sistemi
