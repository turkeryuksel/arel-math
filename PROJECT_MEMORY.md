# PROJECT MEMORY — Arel Deniz Matematik Antrenman Sistemi

## 1. Proje Amacı ve Felsefesi
4. sınıfa başlayan Arel Deniz için geliştirilmiş, her gün 10–15 dakikalık kısa, eğlenceli ve adaptif matematik egzersizleri sunan kişisel web uygulaması.
- **Slogan**: *Her gün biraz matematik.*
- **Hedef**: Matematik refleksini canlı tutmak, dört işlem hızını artırmak, zihinden işlem alışkanlığı kazandırmak ve matematik korkusu oluşturmamak.
- **Özel Detay**: Arel (9–10 yaş, sarışın, mavi gözlü, saçını küçük at kuyruğu yapan çocuk). Karakterinde ince bir Fenerbahçe sevgisi bulunmakla birlikte, genel tasarımda stadyum/futbol baskın değildir; ferah, yumuşak, pastel tonlar ve modern kart tasarımı hakimdir.
- **Cihaz Ergonomisi**: Çoğunlukla tablet ile kullanılacağı için en az 48px–56px+ dokunma hedefleri, tablet sanal sayısal tuş takımı (Numeric Keypad), responsive sütunlar ve dokunmatik geri bildirimler ön plandadır.

---

## 2. Teknoloji Yığını
- **Framework**: Next.js 15+ (App Router), TypeScript, Tailwind CSS
- **İkonlar**: Lucide React
- **Grafikler & Animasyonlar**: Recharts, Canvas Confetti
- **Backend & Veritabanı**: Firebase Authentication ve tek kalıcı veri kaynağı olarak Cloud Firestore
- **Deployment**: Vercel & GitHub (`turkeryuksel/arel-math`)
- **PWA**: `manifest.json`, mobil/tablet ev ekranına eklenebilir yapı
- **Testler**: Vitest

---

## 3. Soru ve İçerik Motoru Mimarisi
Harici yapay zeka (OpenAI/Gemini/Claude vb.) API zorunluluğu yoktur. Tamamen yerel, deterministik ve pedagojik kurallara sahip soru üreteçleri bulunmaktadır:
1. **Zihinden Matematik (`src/lib/questions/mentalMath.ts`)**:
   - Parçalayarak toplama, 10'a/100'e tamamlama, sıfırları atarak bölme, tek basamakla iki basamağı pratik çarpma.
2. **4 İşlem (`src/lib/questions/operations.ts`)**:
   - 1'den 5'e basamak seviyeleri, eldeli toplama, onluk bozmalı çıkarma, tam bölme, sıfıra bölmeyi engelleme.
3. **Çarpım Tablosu (`src/lib/questions/multiplicationTable.ts`)**:
   - 2-12 arası özel çarpım tablosu egzersizleri ve zayıf çarpımları (örneğin 7×8) takip etme.
4. **Problemler (`src/lib/questions/wordProblems.ts`)**:
   - 50+ Türkçe gerçek yaşam problemi şablonu (yüzme, lego, kitap, spor, çıkartma koleksiyonu, harçlık, yolculuk).
5. **Beyin Jimnastiği (`src/lib/questions/logic.ts`)**:
   - Sayı Piramidi, Eksik Sayı (? + 17 = 43), Sayı Dizisi, Hızlı Karşılaştırma, İşlem Zinciri, Yaklaşık Sonuç.
6. **Statik Soru Bankası (`src/data/questions/bank.ts`)**:
   - 100+ özenle seçilmiş pedagojik referans soru.

---

## 4. Adaptif Öğrenme ve Seviye Sistemi
- **Zorluk Seviyesi**: 1–10 arası skill rating.
- **Adaptasyon Kriteri**: Son 20 sorudaki başarı oranı >%90 ise +1 seviye; <%70 ise -1 seviye ve pekiştirme.
- **Spaced Repetition**: Yanlış yapılan soru tipleri ve çarpımlar (örneğin 7'ler) takip edilerek sonraki oturumlarda ağırlığı artırılır.
- **Streak & Zaman Dilimi**: `Europe/Istanbul` saat dilimi esas alınır. Seri bozulduğunda ceza dili kullanılmaz ("Yeni bir seri başlatmaya hazır mısın?").
- **XP & Level**: Seviye 8 (1240 XP) referans alınarak ölçeklenmiş dengeli XP puanlaması.

---

## 5. Ebeveyn Paneli (`/parent`)
- Yalnızca Firebase Authentication yönetici hesabı ile erişilir; PIN veya yerel geçiş yoktur.
- Günlük hedef süresi 5–30 dakika arası ayarlanabilir.
- Konu ağırlıkları (Az, Normal, Fazla) seçilebilir.
- "Yarın için özel görev" girilebilir.
- Detaylı istatistikler ve gelişim analizi sunar.

---

## 6. Önemli Kararlar ve Kısıtlamalar
- **Firebase Storage Kullanılmadı**: Tüm görseller ve varlıklar Next.js `/public/` klasöründe yer alır.
- **Double Submission Koruması**: Cevapla butonuna basıldığında anında kilitlenir, mükerrer veri engellenir.
- **Firebase zorunluluğu**: Firebase yapılandırması yoksa uygulama demo moda düşmez ve veri yazmaz.


## 7. Son yayın kontrolü — 6 Eylül 2026
- Hesap verileri yüklenene kadar öğrenci ekranları bekler.
- Oyun ödülleri işlem içinde kaydedilir; ortak tamamlanma ekranı kayıt hatasını ve yeniden denemeyi yönetir.
- Her oyun için son 50 sonuç kimliği yakın geçmişteki tekrar kayıtları önler; mevcut Firestore yolları korunur.
- Soru doğruluğu, kayıt ve ekran etkileşimleri için toplam 92 test. Yeni özellik yol haritası `docs/OGRENME-YOL-HARITASI.md` içindedir ve henüz uygulama kapsamına alınmamıştır.
