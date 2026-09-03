import { Question, SkillId } from "./types";
import { SeededRandom, createRng } from "./seed";


interface ProblemTemplate {
  skill: SkillId;
  text: (vars: Record<string, number | string>) => string;
  generateVars: (r: SeededRandom, diff: number) => Record<string, number | string>;
  calculateAnswer: (vars: Record<string, number | string>) => number;
  explain: (vars: Record<string, number | string>, ans: number) => string[];
  hint: (vars: Record<string, number | string>) => string;
}

// 50+ rich real-life templates for 4th graders
const TEMPLATES: ProblemTemplate[] = [
  // 1-5 Swimming & Sports
  {
    skill: "problem.addition",
    text: (v) => `Arel sabah antrenmanında ${v.a} metre, öğleden sonra ise ${v.b} metre yüzdü. Arel bugün toplam kaç metre yüzmüştür?`,
    generateVars: (r, d) => ({ a: r.range(15, 30 + d * 10) * 10, b: r.range(10, 25 + d * 10) * 10 }),
    calculateAnswer: (v) => Number(v.a) + Number(v.b),
    explain: (v, ans) => [`Sabah yüzülen: ${v.a} metre`, `Öğleden sonra: ${v.b} metre`, `Toplam: ${v.a} + ${v.b} = ${ans} metre`],
    hint: (v) => `İki antrenmanda yüzülen mesafeleri toplamalısın.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Yüzme yarışında hedef ${v.total} metreydi. Arel şu ana kadar ${v.done} metre yüzdü. Hedefe ulaşmak için kaç metre daha yüzmesi gerekir?`,
    generateVars: (r, d) => {
      const total = r.range(4, 10 + d) * 100;
      const done = r.range(1, total / 100 - 1) * 100 + r.range(1, 9) * 10;
      return { total, done };
    },
    calculateAnswer: (v) => Number(v.total) - Number(v.done),
    explain: (v, ans) => [`Toplam hedef: ${v.total} metre`, `Yüzülen: ${v.done} metre`, `Kalan: ${v.total} - ${v.done} = ${ans} metre`],
    hint: (v) => `Hedef mesafeden yüzülen mesafeyi çıkar.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Arel yüzme havuzunda her biri ${v.m} metre olan kulvarda ${v.laps} tur yüzdü. Arel toplam kaç metre yüzmüştür?`,
    generateVars: (r, d) => ({ m: r.pick([25, 50]), laps: r.range(4 + d, 8 + d * 2) }),
    calculateAnswer: (v) => Number(v.m) * Number(v.laps),
    explain: (v, ans) => [`1 turun uzunluğu: ${v.m} m`, `Tur sayısı: ${v.laps}`, `Toplam mesafe: ${v.m} × ${v.laps} = ${ans} m`],
    hint: (v) => `1 turun uzunluğu ile tur sayısını çarp.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Basketbol maçında Arel ilk yarıda ${v.p1} sayı, ikinci yarıda ${v.p2} sayı attı. Arel maçı kaç sayı ile tamamladı?`,
    generateVars: (r, d) => ({ p1: r.range(8, 16 + d), p2: r.range(6, 18 + d) }),
    calculateAnswer: (v) => Number(v.p1) + Number(v.p2),
    explain: (v, ans) => [`İlk yarı: ${v.p1} sayı`, `İkinci yarı: ${v.p2} sayı`, `Toplam: ${v.p1} + ${v.p2} = ${ans} sayı`],
    hint: (v) => `İki yarıdaki sayıları topla.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Basketbol takımında her biri ${v.c} oyuncudan oluşan ${v.t} takım turnuvaya katıldı. Turnuvada toplam kaç oyuncu vardır?`,
    generateVars: (r, d) => ({ c: 5, t: r.range(6, 12 + d) }),
    calculateAnswer: (v) => Number(v.c) * Number(v.t),
    explain: (v, ans) => [`Her takımda: ${v.c} oyuncu`, `Takım sayısı: ${v.t}`, `Toplam: ${v.t} × ${v.c} = ${ans} oyuncu`],
    hint: (v) => `Takım sayısı ile takımdaki oyuncu sayısını çarp.`
  },

  // 6-10 Books & Reading
  {
    skill: "problem.subtraction",
    text: (v) => `Arel'in okuduğu macera kitabı ${v.total} sayfadır. Arel şu ana kadar ${v.read} sayfa okudu. Kitabı bitirmek için kaç sayfa kalmıştır?`,
    generateVars: (r, d) => {
      const total = r.range(12, 28 + d * 2) * 10;
      const read = r.range(3, Math.floor(total / 10) - 2) * 10 + r.range(1, 9);
      return { total, read };
    },
    calculateAnswer: (v) => Number(v.total) - Number(v.read),
    explain: (v, ans) => [`Toplam sayfa: ${v.total}`, `Okunan sayfa: ${v.read}`, `Kalan: ${v.total} - ${v.read} = ${ans} sayfa`],
    hint: (v) => `Toplam sayfa sayısından okunan kısmı çıkar.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Arel her gün düzenli olarak ${v.daily} sayfa kitap okuyor. Arel ${v.days} günde kaç sayfa kitap okumuş olur?`,
    generateVars: (r, d) => ({ daily: r.range(15, 25 + d * 2), days: r.range(5, 10) }),
    calculateAnswer: (v) => Number(v.daily) * Number(v.days),
    explain: (v, ans) => [`Günde okunan: ${v.daily} sayfa`, `Gün sayısı: ${v.days}`, `Toplam: ${v.daily} × ${v.days} = ${ans} sayfa`],
    hint: (v) => `Günlük sayfa sayısı ile gün sayısını çarp.`
  },
  {
    skill: "problem.division",
    text: (v) => `Okul kütüphanesine gelen ${v.total} yeni kitap, ${v.shelves} rafa eşit olarak dizilecektir. Her rafa kaç kitap konulmalıdır?`,
    generateVars: (r, d) => {
      const shelves = r.range(4, 8);
      const perShelf = r.range(12 + d, 25 + d * 2);
      return { total: shelves * perShelf, shelves };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.shelves),
    explain: (v, ans) => [`Toplam kitap: ${v.total}`, `Raf sayısı: ${v.shelves}`, `Her rafa: ${v.total} ÷ ${v.shelves} = ${ans} kitap`],
    hint: (v) => `Toplam kitap sayısını raf sayısına böl.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Sınıf kitaplığında ${v.story} hikaye kitabı, ${v.comic} çizgi roman ve ${v.science} bilim kitabı vardır. Kitaplıkta toplam kaç kitap vardır?`,
    generateVars: (r, d) => ({ story: r.range(35, 75), comic: r.range(20, 50), science: r.range(15, 40) }),
    calculateAnswer: (v) => Number(v.story) + Number(v.comic) + Number(v.science),
    explain: (v, ans) => [`Hikaye: ${v.story}`, `Çizgi roman: ${v.comic}`, `Bilim: ${v.science}`, `Toplam: ${v.story} + ${v.comic} + ${v.science} = ${ans}`],
    hint: (v) => `Üç kitap türünün sayısını birbiriyle topla.`
  },
  {
    skill: "problem.multiStep",
    text: (v) => `Arel 120 sayfalık bir kitabın ilk gün ${v.day1} sayfasını, ikinci gün ${v.day2} sayfasını okudu. Kitapta okunmamış kaç sayfa kaldı?`,
    generateVars: (r, d) => ({ day1: r.range(30, 45), day2: r.range(25, 45) }),
    calculateAnswer: (v) => 120 - (Number(v.day1) + Number(v.day2)),
    explain: (v, ans) => [`İlk iki gün okunan: ${v.day1} + ${v.day2} = ${Number(v.day1) + Number(v.day2)}`, `Kalan sayfa: 120 - ${Number(v.day1) + Number(v.day2)} = ${ans}`],
    hint: (v) => `Önce okunan iki günü topla, sonra 120'den çıkar.`
  },

  // 11-15 Lego & Toys
  {
    skill: "problem.addition",
    text: (v) => `Arel uzay gemisi lego setini yaparken önce ${v.a} parça, ardından ${v.b} parça taktı. Toplam kaç lego parçası birleştirmiştir?`,
    generateVars: (r, d) => ({ a: r.range(45, 120 + d * 15), b: r.range(35, 95 + d * 10) }),
    calculateAnswer: (v) => Number(v.a) + Number(v.b),
    explain: (v, ans) => [`İlk takılan: ${v.a}`, `İkinci takılan: ${v.b}`, `Toplam: ${v.a} + ${v.b} = ${ans} parça`],
    hint: (v) => `İki aşamada takılan parçaları topla.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Bir lego kalesinde toplam ${v.total} parça bulunması gerekiyor. Arel şu ana kadar ${v.used} parça taktı. Geriye kaç parça kaldı?`,
    generateVars: (r, d) => {
      const total = r.range(25, 60) * 10;
      const used = r.range(10, Math.floor(total / 10) - 5) * 10 + r.range(2, 8);
      return { total, used };
    },
    calculateAnswer: (v) => Number(v.total) - Number(v.used),
    explain: (v, ans) => [`Gereken toplam: ${v.total}`, `Takılan: ${v.used}`, `Kalan: ${v.total} - ${v.used} = ${ans} parça`],
    hint: (v) => `Toplam parça sayısından takılanları çıkar.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Arel lego mini figürlerini sergilemek için ${v.boxes} kutu aldı. Her kutuda ${v.figs} figür olduğuna göre toplam kaç figür vardır?`,
    generateVars: (r, d) => ({ boxes: r.range(4, 9 + d), figs: r.range(6, 12) }),
    calculateAnswer: (v) => Number(v.boxes) * Number(v.figs),
    explain: (v, ans) => [`Kutu sayısı: ${v.boxes}`, `Her kutudaki: ${v.figs}`, `Toplam: ${v.boxes} × ${v.figs} = ${ans} figür`],
    hint: (v) => `Kutu sayısı ile kutu başına düşen figürü çarp.`
  },
  {
    skill: "problem.division",
    text: (v) => `Arel ${v.total} adet lego tekerleğini ${v.cars} adet oyuncak arabaya eşit olarak paylaştırdı. Her arabada kaç tekerlek oldu?`,
    generateVars: (r, d) => {
      const cars = r.range(4, 8);
      const perCar = r.pick([4, 6, 8]);
      return { total: cars * perCar, cars };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.cars),
    explain: (v, ans) => [`Toplam tekerlek: ${v.total}`, `Araba sayısı: ${v.cars}`, `Her arabaya: ${v.total} ÷ ${v.cars} = ${ans} tekerlek`],
    hint: (v) => `Toplam tekerlek sayısını araba sayısına böl.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Arel'in kutusunda ${v.red} kırmızı, ${v.blue} mavi ve ${v.yellow} sarı lego tuğlası vardır. Toplam kaç tuğla vardır?`,
    generateVars: (r, d) => ({ red: r.range(40, 80), blue: r.range(35, 75), yellow: r.range(25, 60) }),
    calculateAnswer: (v) => Number(v.red) + Number(v.blue) + Number(v.yellow),
    explain: (v, ans) => [`${v.red} + ${v.blue} + ${v.yellow} = ${ans} tuğla`],
    hint: (v) => `Üç rengin adetlerini topla.`
  },

  // 16-20 Stickers & Cards Collection
  {
    skill: "problem.addition",
    text: (v) => `Arel'in albümünde ${v.start} futbolcu çıkartması vardı. Babası ona ${v.added} çıkartma daha hediye etti. Arel'in kaç çıkartması oldu?`,
    generateVars: (r, d) => ({ start: r.range(45, 110 + d * 15), added: r.range(25, 65 + d * 10) }),
    calculateAnswer: (v) => Number(v.start) + Number(v.added),
    explain: (v, ans) => [`Başlangıçta: ${v.start}`, `Eklenen: ${v.added}`, `Toplam: ${v.start} + ${v.added} = ${ans} çıkartma`],
    hint: (v) => `Eski çıkartma sayısına yeni gelenleri ekle.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Arel'in ${v.total} adet çıkartması vardı. Çift olan ${v.given} tanesini arkadaşına verdi. Arel'in elinde kaç çıkartma kaldı?`,
    generateVars: (r, d) => {
      const total = r.range(65, 140);
      const given = r.range(15, 38);
      return { total, given };
    },
    calculateAnswer: (v) => Number(v.total) - Number(v.given),
    explain: (v, ans) => [`Eldeki toplam: ${v.total}`, `Verilen: ${v.given}`, `Kalan: ${v.total} - ${v.given} = ${ans} çıkartma`],
    hint: (v) => `Toplam çıkartmadan verilenleri çıkar.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Her pakette ${v.perPack} çıkartma bulunan paketlerden Arel ${v.packs} adet satın aldı. Toplam kaç çıkartma açmıştır?`,
    generateVars: (r, d) => ({ perPack: r.pick([5, 6, 8]), packs: r.range(6, 14 + d) }),
    calculateAnswer: (v) => Number(v.perPack) * Number(v.packs),
    explain: (v, ans) => [`Paket sayısı: ${v.packs}`, `Paket başına: ${v.perPack}`, `Toplam: ${v.packs} × ${v.perPack} = ${ans} çıkartma`],
    hint: (v) => `Paket sayısı ile içindeki çıkartma adedini çarp.`
  },
  {
    skill: "problem.division",
    text: (v) => `Arel ${v.total} adet sporcu kartını ${v.friends} arkadaşına eşit olarak paylaştırmak istiyor. Her arkadaşına kaç kart düşer?`,
    generateVars: (r, d) => {
      const friends = r.range(3, 6);
      const perFriend = r.range(12, 24 + d);
      return { total: friends * perFriend, friends };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.friends),
    explain: (v, ans) => [`Toplam kart: ${v.total}`, `Kişi sayısı: ${v.friends}`, `Kişi başına: ${v.total} ÷ ${v.friends} = ${ans} kart`],
    hint: (v) => `Toplam kartı arkadaş sayısına böl.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Çıkartma albümü ${v.full} çıkartma ile dolmaktadır. Arel'in şu anda ${v.current} çıkartması olduğuna göre albümü tamamlamak için kaç çıkartma daha gerekir?`,
    generateVars: (r, d) => {
      const full = r.range(18, 30) * 10;
      const current = r.range(8, Math.floor(full / 10) - 3) * 10 + r.range(1, 9);
      return { full, current };
    },
    calculateAnswer: (v) => Number(v.full) - Number(v.current),
    explain: (v, ans) => [`Gereken toplam: ${v.full}`, `Mevcut: ${v.current}`, `Eksik: ${v.full} - ${v.current} = ${ans} çıkartma`],
    hint: (v) => `Albüm kapasitesinden mevcut sayıyı çıkar.`
  },

  // 21-25 School & Stationery
  {
    skill: "problem.multiplication",
    text: (v) => `Okulda her sınıfta ${v.desks} sıra vardır. 4. sınıflar için ${v.classes} sınıf olduğuna göre bu sınıflarda toplam kaç sıra vardır?`,
    generateVars: (r, d) => ({ desks: r.range(14, 22), classes: r.range(4, 7) }),
    calculateAnswer: (v) => Number(v.desks) * Number(v.classes),
    explain: (v, ans) => [`Sınıf sayısı: ${v.classes}`, `Sınıf başına sıra: ${v.desks}`, `Toplam: ${v.classes} × ${v.desks} = ${ans} sıra`],
    hint: (v) => `Sınıf sayısı ile sıra sayısını çarp.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Kırtasiyeden ${v.pen} TL'ye kalem kutusu ve ${v.book} TL'ye resim defteri alan Deniz toplam kaç TL ödemiştir?`,
    generateVars: (r, d) => ({ pen: r.range(45, 95), book: r.range(35, 75) }),
    calculateAnswer: (v) => Number(v.pen) + Number(v.book),
    explain: (v, ans) => [`Kalem kutusu: ${v.pen} TL`, `Resim defteri: ${v.book} TL`, `Toplam: ${v.pen} + ${v.book} = ${ans} TL`],
    hint: (v) => `İki ürünün fiyatını topla.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Arel kırtasiyeye 200 TL verdi. Aldığı defter ve boya kalemleri ${v.cost} TL tuttu. Arel kaç TL para üstü alır?`,
    generateVars: (r, d) => ({ cost: r.range(75, 165) }),
    calculateAnswer: (v) => 200 - Number(v.cost),
    explain: (v, ans) => [`Verilen para: 200 TL`, `Harcama: ${v.cost} TL`, `Para üstü: 200 - ${v.cost} = ${ans} TL`],
    hint: (v) => `200'den yapılan harcamayı çıkar.`
  },
  {
    skill: "problem.division",
    text: (v) => `Öğretmen ${v.total} kurşun kalemi ${v.students} öğrenciye eşit olarak dağıttı. Her öğrenciye kaç kurşun kalem düşmüştür?`,
    generateVars: (r, d) => {
      const students = r.range(15, 24);
      const perStudent = r.range(3, 5);
      return { total: students * perStudent, students };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.students),
    explain: (v, ans) => [`Toplam kalem: ${v.total}`, `Öğrenci sayısı: ${v.students}`, `Öğrenci başına: ${v.total} ÷ ${v.students} = ${ans} kalem`],
    hint: (v) => `Toplam kalemi öğrenci sayısına böl.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Bir kutuda ${v.markers} renkli keçeli kalem bulunmaktadır. Kırtasiyeci bu kutulardan ${v.boxes} adet sattığına göre kaç adet kalem satmıştır?`,
    generateVars: (r, d) => ({ markers: r.pick([12, 18, 24]), boxes: r.range(4, 8) }),
    calculateAnswer: (v) => Number(v.markers) * Number(v.boxes),
    explain: (v, ans) => [`Kutu sayısı: ${v.boxes}`, `Kutudaki kalem: ${v.markers}`, `Toplam: ${v.boxes} × ${v.markers} = ${ans} kalem`],
    hint: (v) => `Kutu sayısı ile kutudaki kalem sayısını çarp.`
  },

  // 26-30 Fruits & Shopping
  {
    skill: "problem.multiplication",
    text: (v) => `Manavdan kilosu ${v.price} TL olan elmalardan ${v.kg} kilogram alan bir kişi kaç TL öder?`,
    generateVars: (r, d) => ({ price: r.range(25, 45), kg: r.range(3, 7) }),
    calculateAnswer: (v) => Number(v.price) * Number(v.kg),
    explain: (v, ans) => [`1 kg elma: ${v.price} TL`, `Alınan miktar: ${v.kg} kg`, `Toplam: ${v.kg} × ${v.price} = ${ans} TL`],
    hint: (v) => `Kilo fiyatı ile alınan kilogramı çarp.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Pazardan ${v.orange} kg portakal, ${v.apple} kg elma ve ${v.banana} kg muz alan Arel'in ailesi toplam kaç kg meyve almıştır?`,
    generateVars: (r, d) => ({ orange: r.range(3, 8), apple: r.range(4, 9), banana: r.range(2, 5) }),
    calculateAnswer: (v) => Number(v.orange) + Number(v.apple) + Number(v.banana),
    explain: (v, ans) => [`Portakal: ${v.orange} kg`, `Elma: ${v.apple} kg`, `Muz: ${v.banana} kg`, `Toplam: ${v.orange} + ${v.apple} + ${v.banana} = ${ans} kg`],
    hint: (v) => `Meyvelerin kilogramlarını topla.`
  },
  {
    skill: "problem.division",
    text: (v) => `Bir kasada ${v.total} mandalina vardı. Mandalinalar her pakete ${v.perPack} adet gelecek şekilde paketlendi. Kaç paket mandalina yapılmıştır?`,
    generateVars: (r, d) => {
      const perPack = r.range(6, 12);
      const packs = r.range(8, 16 + d);
      return { total: perPack * packs, perPack };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.perPack),
    explain: (v, ans) => [`Toplam mandalina: ${v.total}`, `Paket başına: ${v.perPack}`, `Paket sayısı: ${v.total} ÷ ${v.perPack} = ${ans}`],
    hint: (v) => `Toplam mandalinayı paket büyüklüğüne böl.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Markette ${v.start} şişe süt vardı. Gün boyunca ${v.sold} şişe süt satıldı. Geriye satılmayan kaç şişe süt kalmıştır?`,
    generateVars: (r, d) => {
      const start = r.range(120, 250);
      const sold = r.range(45, start - 25);
      return { start, sold };
    },
    calculateAnswer: (v) => Number(v.start) - Number(v.sold),
    explain: (v, ans) => [`Başlangıçtaki süt: ${v.start}`, `Satılan: ${v.sold}`, `Kalan: ${v.start} - ${v.sold} = ${ans} şişe`],
    hint: (v) => `Başlangıçtaki sayıdan satılanı çıkar.`
  },
  {
    skill: "problem.multiStep",
    text: (v) => `Tanesi ${v.breadPrice} TL olan ekmekten ${v.breadCount} tane ve ${v.cheesePrice} TL'ye peynir alan biri toplam kaç TL öder?`,
    generateVars: (r, d) => ({ breadPrice: 10, breadCount: r.range(3, 6), cheesePrice: r.range(65, 120) }),
    calculateAnswer: (v) => Number(v.breadPrice) * Number(v.breadCount) + Number(v.cheesePrice),
    explain: (v, ans) => [
      `Ekmeklerin tutarı: ${v.breadCount} × ${v.breadPrice} = ${Number(v.breadCount) * Number(v.breadPrice)} TL`,
      `Toplam harcama: ${Number(v.breadCount) * Number(v.breadPrice)} + ${v.cheesePrice} = ${ans} TL`
    ],
    hint: (v) => `Önce ekmeklerin fiyatını hesapla, sonra peynir fiyatını ekle.`
  },

  // 31-35 Journey & Travel
  {
    skill: "problem.subtraction",
    text: (v) => `İstanbul ile Ankara arası karayolu mesafesi yaklaşık ${v.dist} kilometredir. Arel ve ailesi ${v.driven} kilometre yol gittikten sonra mola verdi. Ankara'ya varmak için kaç km yolları kalmıştır?`,
    generateVars: (r, d) => ({ dist: 450, driven: r.range(160, 320) }),
    calculateAnswer: (v) => 450 - Number(v.driven),
    explain: (v, ans) => [`Toplam yol: 450 km`, `Gidilen yol: ${v.driven} km`, `Kalan yol: 450 - ${v.driven} = ${ans} km`],
    hint: (v) => `Toplam mesafeden gidilen yolu çıkar.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Bir tren saatte ${v.speed} kilometre hızla gitmektedir. Tren durmaksızın ${v.hours} saat yol alırsa kaç kilometre yol gitmiş olur?`,
    generateVars: (r, d) => ({ speed: r.pick([80, 90, 110, 120]), hours: r.range(3, 6) }),
    calculateAnswer: (v) => Number(v.speed) * Number(v.hours),
    explain: (v, ans) => [`Saatlik hız: ${v.speed} km`, `Süre: ${v.hours} saat`, `Toplam yol: ${v.speed} × ${v.hours} = ${ans} km`],
    hint: (v) => `Hız ile geçen saati çarp.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Arel uçak yolculuğunda önce ${v.fly1} dakika, aktarma yaptıktan sonra ${v.fly2} dakika uçtu. Arel havada toplam kaç dakika kalmıştır?`,
    generateVars: (r, d) => ({ fly1: r.range(55, 95), fly2: r.range(65, 125) }),
    calculateAnswer: (v) => Number(v.fly1) + Number(v.fly2),
    explain: (v, ans) => [`1. uçuş: ${v.fly1} dk`, `2. uçuş: ${v.fly2} dk`, `Toplam: ${v.fly1} + ${v.fly2} = ${ans} dakika`],
    hint: (v) => `İki uçuş süresini topla.`
  },
  {
    skill: "problem.division",
    text: (v) => `Okul gezisi için ${v.total} öğrenci ${v.busCount} otobüse eşit olarak binecektir. Her otobüse kaç öğrenci biner?`,
    generateVars: (r, d) => {
      const busCount = r.range(3, 6);
      const perBus = r.range(28, 45);
      return { total: busCount * perBus, busCount };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.busCount),
    explain: (v, ans) => [`Toplam öğrenci: ${v.total}`, `Otobüs sayısı: ${v.busCount}`, `Otobüs başına: ${v.total} ÷ ${v.busCount} = ${ans} öğrenci`],
    hint: (v) => `Toplam öğrenci sayısını otobüs sayısına böl.`
  },
  {
    skill: "problem.multiStep",
    text: (v) => `Bir gemide ${v.adults} yetişkin ve ${v.children} çocuk yolcu vardı. İlk limanda ${v.left} yolcu indi. Gemide kaç yolcu kaldı?`,
    generateVars: (r, d) => ({ adults: r.range(140, 260), children: r.range(40, 95), left: r.range(35, 75) }),
    calculateAnswer: (v) => Number(v.adults) + Number(v.children) - Number(v.left),
    explain: (v, ans) => [
      `Toplam yolcu: ${v.adults} + ${v.children} = ${Number(v.adults) + Number(v.children)}`,
      `İnen yolcular çıkınca: ${Number(v.adults) + Number(v.children)} - ${v.left} = ${ans} yolcu`
    ],
    hint: (v) => `Önce yetişkin ve çocukları topla, sonra inenleri çıkar.`
  },

  // 36-40 Time & Clocks
  {
    skill: "problem.addition",
    text: (v) => `Arel ${v.h1} dakika matematik ve ${v.h2} dakika Türkçe çalıştı. Arel toplam kaç dakika ders çalışmıştır?`,
    generateVars: (r, d) => ({ h1: r.range(25, 45), h2: r.range(20, 40) }),
    calculateAnswer: (v) => Number(v.h1) + Number(v.h2),
    explain: (v, ans) => [`Matematik: ${v.h1} dk`, `Türkçe: ${v.h2} dk`, `Toplam: ${v.h1} + ${v.h2} = ${ans} dakika`],
    hint: (v) => `İki dersin çalışma dakikalarını topla.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `1 saat 60 dakikadır. Buna göre ${v.hours} saat kaç dakikadır?`,
    generateVars: (r, d) => ({ hours: r.range(3, 8) }),
    calculateAnswer: (v) => Number(v.hours) * 60,
    explain: (v, ans) => [`1 saat = 60 dakika`, `${v.hours} saat = ${v.hours} × 60 = ${ans} dakika`],
    hint: (v) => `Saat sayısını 60 ile çarp.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Bir sinema filmi ${v.movie} dakika sürmektedir. Filmin başlamasından ${v.passed} dakika geçtiğine göre filmin bitmesine kaç dakika vardır?`,
    generateVars: (r, d) => ({ movie: r.range(90, 130), passed: r.range(35, 75) }),
    calculateAnswer: (v) => Number(v.movie) - Number(v.passed),
    explain: (v, ans) => [`Toplam süre: ${v.movie} dk`, `İzlenen süre: ${v.passed} dk`, `Kalan süre: ${v.movie} - ${v.passed} = ${ans} dk`],
    hint: (v) => `Film süresinden geçen süreyi çıkar.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `1 haftada 7 gün vardır. ${v.weeks} haftada toplam kaç gün vardır?`,
    generateVars: (r, d) => ({ weeks: r.range(6, 14) }),
    calculateAnswer: (v) => Number(v.weeks) * 7,
    explain: (v, ans) => [`Hafta sayısı: ${v.weeks}`, `1 hafta = 7 gün`, `Toplam: ${v.weeks} × 7 = ${ans} gün`],
    hint: (v) => `Hafta sayısını 7 ile çarp.`
  },
  {
    skill: "problem.multiStep",
    text: (v) => `Arel günde ${v.hours} saat uyumaktadır. Arel bir haftada (7 gün) toplam kaç saat uyumuş olur?`,
    generateVars: (r, d) => ({ hours: r.range(8, 10) }),
    calculateAnswer: (v) => Number(v.hours) * 7,
    explain: (v, ans) => [`Günde ${v.hours} saat`, `7 gün: 7 × ${v.hours} = ${ans} saat uyku`],
    hint: (v) => `Günlük uyku süresini 7 ile çarp.`
  },

  // 41-45 Money & Savings
  {
    skill: "problem.addition",
    text: (v) => `Arel'in kumbarasında ${v.bank} TL vardı. Bayramda dedesi ${v.gift1} TL, teyzesi ${v.gift2} TL harçlık verdi. Kumbarada toplam kaç TL oldu?`,
    generateVars: (r, d) => ({ bank: r.range(120, 300), gift1: r.range(50, 150), gift2: r.range(50, 100) }),
    calculateAnswer: (v) => Number(v.bank) + Number(v.gift1) + Number(v.gift2),
    explain: (v, ans) => [`Kumbaradaki para: ${v.bank} TL`, `Dededen: ${v.gift1} TL`, `Teyzeden: ${v.gift2} TL`, `Toplam: ${ans} TL`],
    hint: (v) => `Kumbaradaki paraya verilen tüm harçlıkları ekle.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Arel her hafta kumbarasına ${v.weekly} TL para atıyor. ${v.weeks} hafta sonra kumbarasında kaç TL birikmiş olur?`,
    generateVars: (r, d) => ({ weekly: r.range(20, 50), weeks: r.range(6, 12) }),
    calculateAnswer: (v) => Number(v.weekly) * Number(v.weeks),
    explain: (v, ans) => [`Haftalık birikim: ${v.weekly} TL`, `Hafta sayısı: ${v.weeks}`, `Toplam: ${v.weeks} × ${v.weekly} = ${ans} TL`],
    hint: (v) => `Haftalık birikim ile hafta sayısını çarp.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Arel beğendiği akıllı saati almak istiyor. Saatin fiyatı ${v.target} TL'dir. Arel'in ${v.saved} TL'si olduğuna göre saati alabilmek için kaç TL daha biriktirmelidir?`,
    generateVars: (r, d) => {
      const target = r.range(60, 120) * 10;
      const saved = r.range(25, Math.floor(target / 10) - 5) * 10;
      return { target, saved };
    },
    calculateAnswer: (v) => Number(v.target) - Number(v.saved),
    explain: (v, ans) => [`Fiyat: ${v.target} TL`, `Biriken para: ${v.saved} TL`, `Eksik: ${v.target} - ${v.saved} = ${ans} TL`],
    hint: (v) => `Hedef fiyattan biriken parayı çıkar.`
  },
  {
    skill: "problem.division",
    text: (v) => `Fiyatı ${v.total} TL olan bir bisiklet ${v.months} eşit taksitle satın alınacaktır. Aylık taksit kaç TL olur?`,
    generateVars: (r, d) => {
      const months = r.pick([4, 5, 6]);
      const perMonth = r.range(25, 60) * 10;
      return { total: months * perMonth, months };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.months),
    explain: (v, ans) => [`Toplam fiyat: ${v.total} TL`, `Taksit sayısı: ${v.months}`, `Aylık taksit: ${v.total} ÷ ${v.months} = ${ans} TL`],
    hint: (v) => `Toplam fiyatı taksit ayına böl.`
  },
  {
    skill: "problem.multiStep",
    text: (v) => `Cebinde 500 TL olan Deniz, ${v.item1} TL'ye tişört ve ${v.item2} TL'ye spor şapka aldı. Geriye kaç TL parası kaldı?`,
    generateVars: (r, d) => ({ item1: r.range(140, 220), item2: r.range(80, 160) }),
    calculateAnswer: (v) => 500 - (Number(v.item1) + Number(v.item2)),
    explain: (v, ans) => [
      `Toplam harcama: ${v.item1} + ${v.item2} = ${Number(v.item1) + Number(v.item2)} TL`,
      `Kalan para: 500 - ${Number(v.item1) + Number(v.item2)} = ${ans} TL`
    ],
    hint: (v) => `Önce harcamaları topla, sonra 500 TL'den çıkar.`
  },

  // 46-52 Nature, Animals & Everyday Life
  {
    skill: "problem.multiplication",
    text: (v) => `Bir çiftlikte ${v.cows} inek vardır. Her ineğin 4 ayağı olduğuna göre çiftlikteki ineklerin toplam ayak sayısı kaçtır?`,
    generateVars: (r, d) => ({ cows: r.range(15, 35 + d * 5) }),
    calculateAnswer: (v) => Number(v.cows) * 4,
    explain: (v, ans) => [`İnek sayısı: ${v.cows}`, `İnek başına ayak: 4`, `Toplam ayak: ${v.cows} × 4 = ${ans}`],
    hint: (v) => `İnek sayısını 4 ile çarp.`
  },
  {
    skill: "problem.multiplication",
    text: (v) => `Bir tavuk çiftliğinde ${v.hens} tavuk vardır. Tavukların 2 ayağı olduğuna göre toplam tavuk ayağı sayısı kaçtır?`,
    generateVars: (r, d) => ({ hens: r.range(25, 65 + d * 5) }),
    calculateAnswer: (v) => Number(v.hens) * 2,
    explain: (v, ans) => [`Tavuk sayısı: ${v.hens}`, `Tavuk başına ayak: 2`, `Toplam ayak: ${v.hens} × 2 = ${ans}`],
    hint: (v) => `Tavuk sayısını 2 ile çarp.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Arel doğa yürüyüşünde ${v.pine} çam ağacı ve ${v.oak} meşe ağacı saydı. Arel toplam kaç ağaç saymıştır?`,
    generateVars: (r, d) => ({ pine: r.range(65, 140), oak: r.range(45, 115) }),
    calculateAnswer: (v) => Number(v.pine) + Number(v.oak),
    explain: (v, ans) => [`Çam ağacı: ${v.pine}`, `Meşe ağacı: ${v.oak}`, `Toplam: ${v.pine} + ${v.oak} = ${ans} ağaç`],
    hint: (v) => `İki ağaç çeşidinin sayılarını topla.`
  },
  {
    skill: "problem.subtraction",
    text: (v) => `Fidan dikme etkinliğinde ${v.target} fidan dikilmesi hedeflenmiştir. Sabah ${v.planted} fidan dikildiğine göre öğleden sonra dikilmesi gereken kaç fidan kalmıştır?`,
    generateVars: (r, d) => {
      const target = r.range(15, 30) * 10;
      const planted = r.range(6, Math.floor(target / 10) - 3) * 10 + r.range(2, 8);
      return { target, planted };
    },
    calculateAnswer: (v) => Number(v.target) - Number(v.planted),
    explain: (v, ans) => [`Hedef fidan: ${v.target}`, `Dikilen fidan: ${v.planted}`, `Kalan: ${v.target} - ${v.planted} = ${ans} fidan`],
    hint: (v) => `Hedeflenen sayıdan dikilen fidanları çıkar.`
  },
  {
    skill: "problem.division",
    text: (v) => `Bir bahçivan topladığı ${v.total} adet elmayı her biri ${v.perCrate} elma alan kasalara doldurdu. Bahçivan kaç kasa elma doldurmuştur?`,
    generateVars: (r, d) => {
      const perCrate = r.pick([15, 20, 25]);
      const crates = r.range(8, 18);
      return { total: perCrate * crates, perCrate };
    },
    calculateAnswer: (v) => Number(v.total) / Number(v.perCrate),
    explain: (v, ans) => [`Toplam elma: ${v.total}`, `Kasa kapasitesi: ${v.perCrate}`, `Kasa sayısı: ${v.total} ÷ ${v.perCrate} = ${ans}`],
    hint: (v) => `Toplam elma sayısını bir kasanın aldığı elma sayısına böl.`
  },
  {
    skill: "problem.multiStep",
    text: (v) => `Bir pastanede sabah ${v.m} adet, öğleden sonra ${v.a} adet kurabiye pişirildi. Gün sonunda ${v.s} adet kurabiye satıldığına göre satılmayan kaç kurabiye kalmıştır?`,
    generateVars: (r, d) => ({ m: r.range(60, 110), a: r.range(50, 90), s: r.range(70, 130) }),
    calculateAnswer: (v) => Number(v.m) + Number(v.a) - Number(v.s),
    explain: (v, ans) => [
      `Toplam pişen: ${v.m} + ${v.a} = ${Number(v.m) + Number(v.a)} kurabiye`,
      `Satılanlar çıkınca kalan: ${Number(v.m) + Number(v.a)} - ${v.s} = ${ans} kurabiye`
    ],
    hint: (v) => `Önce pişen kurabiyeleri topla, sonra satılanları çıkar.`
  },
  {
    skill: "problem.addition",
    text: (v) => `Arel robotik kodlama kursunda ilk hafta ${v.code1} satır, ikinci hafta ${v.code2} satır kod yazdı. İki haftada toplam kaç satır kod yazmıştır?`,
    generateVars: (r, d) => ({ code1: r.range(45, 95), code2: r.range(60, 135) }),
    calculateAnswer: (v) => Number(v.code1) + Number(v.code2),
    explain: (v, ans) => [`1. hafta: ${v.code1} satır`, `2. hafta: ${v.code2} satır`, `Toplam: ${v.code1} + ${v.code2} = ${ans} satır kod`],
    hint: (v) => `İki haftadaki kod satır sayılarını topla.`
  }
];

export function generateWordProblemQuestion(
  difficulty: number = 3,
  rng?: SeededRandom,
  recentSignatures: Set<string> = new Set(),
  theme?: string
): Question {
  const r = rng || createRng();
  const themeRanges: Record<string, [number, number]> = {
    "Yüzme ve Spor": [0, 5],
    "Kitap ve Kütüphane": [5, 10],
    "Lego ve Oyuncaklar": [10, 15],
    "Çıkartma Koleksiyonu": [15, 20],
    "Kırtasiye ve Okul": [20, 25],
    "Kumbaram ve Harçlık": [40, 45],
  };
  const [themeStart, themeEnd] = (theme ? themeRanges[theme] : undefined) || [0, TEMPLATES.length];
  const templatePool = TEMPLATES.slice(themeStart, themeEnd);
  let attempts = 0;
  let q: Question | null = null;

  while (attempts < 20) {
    const template = r.pick(templatePool);
    const vars = template.generateVars(r, difficulty);
    const answer = template.calculateAnswer(vars);
    const prompt = template.text(vars);
    const signature = `word_prob_${prompt.slice(0, 25)}_${answer}`;

    if (!recentSignatures.has(signature)) {
      const explanation = template.explain(vars, answer);
      const hint = template.hint(vars);
      const id = `prob_${Date.now()}_${r.range(1000, 9999)}`;

      q = {
        id,
        signature,
        category: "problems",
        categoryTitle: "Problemler",
        skill: template.skill,
        difficulty,
        questionType: "numeric",
        prompt,
        answer,
        explanation,
        hint,
      };
      break;
    }
    attempts++;
  }

  if (q) return q;

  // Fallback
  const template = r.pick(templatePool);
  const vars = template.generateVars(r, difficulty);
  const answer = template.calculateAnswer(vars);
  const prompt = template.text(vars);
  return {
    id: `prob_${Date.now()}_${r.range(1000, 9999)}`,
    signature: `word_prob_${prompt.slice(0, 20)}_${answer}_${Date.now()}`,
    category: "problems",
    categoryTitle: "Problemler",
    skill: template.skill,
    difficulty,
    questionType: "numeric",
    prompt,
    answer,
    explanation: template.explain(vars, answer),
    hint: template.hint(vars),
  };
}

