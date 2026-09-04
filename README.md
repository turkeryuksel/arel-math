# Arel'le Öğreniyorum — Matematik 🚀📐

4. sınıfa başlayan Arel Deniz için geliştirilmiş kişisel, adaptif ve eğlenceli günlük matematik antrenman web uygulaması.

![Arel Matematik Dashboard](/illustrations/hero-arel.png)

## 🌟 Temel Özellikler

- **Özel Tasarım & Karakter**: Arel'in sevimli karakter illüstrasyonları (küçük at kuyruklu saç, lacivert kıyafet, ince Fenerbahçe detayı).
- **Tablet Uyumlu Ergonomi**: Büyük dokunma alanları, dokunmatik sanal sayısal tuş takımı (Numeric Keypad), tablet yatay ve dikey mod desteği.
- **Her Gün 10–15 Dakika**: Zihinden matematik, 4 işlem, günlük hayat problemleri ve beyin jimnastiğinden oluşan dengeli seanslar.
- **Deterministik Günlük Oturum**: Sayfa yenilendiğinde aynı günün soruları sabit kalır.
- **Zengin Soru Motoru**: 50+ Türkçe problem şablonu, mantık egzersizleri, zihinden işlem stratejileri, çarpım tablosu ve MEB kazanım etiketli müfredat soruları.
- **Adaptif Zorluk**: Çocuğun doğruluk oranına ve cevap hızına göre otomatik seviye ayarlama (1–10).
- **Aralıklı Tekrar (Spaced Repetition)**: Zorlanılan işlemler ertesi günlerde pekiştirilir.
- **Motive Edici Gamification**: XP, seviye atlama, cezasız seri (streak) sistemi ve özel rozetler.
- **Gerçek Mini Oyunlar**: Hafıza, simetri, labirent, araba yarışı, basketbol ve yüzme ritmi oyunları.
- **Ebeveyn Paneli (`/parent`)**: Firebase Authentication üzerinden yalnızca yönetici hesabına açık; günlük hedef, konu ağırlığı, öğrenci ve gelişim yönetimi.
- **PWA Desteği**: Tablet ve telefonlarda ana ekrana eklenebilir.

---

## 🛠️ Kurulum ve Yerel Geliştirme

### Gereksinimler
- Node.js 20.9+
- npm veya yarn

### Adımlar

1. Depoyu klonlayın:
```bash
git clone https://github.com/turkeryuksel/arel-math.git
cd arel-math
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda açın:
```
http://localhost:3000
```

---

## 🧪 Testler

Unit testleri çalıştırmak için:
```bash
npm test
```

---

## 🔥 Firebase Kurulumu (Zorunlu)

Uygulamanın tek kalıcı veri kaynağı Cloud Firestore'dur. Tarayıcı depolaması yalnızca eski sürümde kalan Arel verilerini ilk başarılı girişte Firestore'a kayıpsız taşımak ve ardından temizlemek için okunur.

1. Firebase Console'da yeni bir web projesi oluşturun.
2. `.env.example` dosyasını `.env.local` olarak kopyalayın ve değerleri girin:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=arel-math.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=arel-math
NEXT_PUBLIC_FIREBASE_APP_ID=1:...
```
3. E-posta/parola giriş yöntemini Firebase Authentication'da etkinleştirin.
4. `firestore.rules` dosyasını Firebase'e dağıtın.

Firebase yapılandırması yoksa uygulama sahte/demo kullanıcıya geçmez; giriş ve veri yazma işlemleri açık bir hata ile durur.

---

## 🚀 Vercel Dağıtımı

Uygulama Vercel için optimize edilmiştir:
```bash
npm run build
vercel --prod
```
