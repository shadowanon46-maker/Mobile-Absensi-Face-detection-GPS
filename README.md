# 📱 Absensi Mobile

Aplikasi mobile React Native Expo untuk sistem absensi karyawan dengan verifikasi wajah dan GPS. Terintegrasi dengan backend HRIS.

## ✨ Fitur

- 🔐 **Autentikasi** - Login dengan NIP/Email dan password
- 📍 **Verifikasi GPS** - Memastikan karyawan berada di area kantor saat absensi
- 👤 **Verifikasi Wajah** - Pengenalan wajah untuk validasi identitas
- ⏰ **Clock In/Out** - Absensi masuk dan pulang
- 📊 **Dashboard** - Tampilan status absensi hari ini dan statistik bulanan
- 📅 **Jadwal Shift** - Informasi shift kerja karyawan

## 🛠️ Teknologi

- **React Native** - Framework mobile cross-platform
- **Expo SDK 54** - Development platform
- **React Navigation** - Navigasi antar screen
- **Expo Camera** - Capture wajah untuk verifikasi
- **Expo Location** - GPS untuk validasi lokasi
- **Expo Secure Store** - Penyimpanan token yang aman
- **Axios** - HTTP client untuk API calls

## 📋 Prasyarat

- Node.js 18+
- Expo CLI
- Expo Go app (untuk testing di device)
- Backend HRIS yang berjalan

## 🚀 Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd absensi-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Backend URL**
   
   Edit file `src/api/client.js`, ganti `API_BASE_URL` dengan IP/URL backend HRIS:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';
   ```
   
   > ⚠️ Gunakan IP address komputer, bukan `localhost`, agar device dapat terhubung.

4. **Jalankan aplikasi**
   ```bash
   npx expo start
   ```

5. **Scan QR Code**
   - Android: Buka Expo Go app → Scan QR
   - iOS: Buka Camera app → Scan QR

## 📁 Struktur Proyek

```
absensi-mobile/
├── App.js                      # Entry point dengan navigation
├── app.json                    # Konfigurasi Expo
├── src/
│   ├── api/
│   │   └── client.js           # Axios API client & endpoints
│   ├── context/
│   │   └── AuthContext.js      # Auth state management
│   └── screens/
│       ├── index.js            # Screen exports
│       ├── LoginScreen.js      # Halaman login
│       ├── HomeScreen.js       # Dashboard utama
│       └── AttendanceScreen.js # Screen absensi dengan kamera
└── assets/                     # Assets (icons, splash)
```

## 📱 Screenshots

### Flow Aplikasi

```
Login → Home Dashboard → Clock In/Out → Result
```

| Login | Dashboard | Clock In |
|-------|-----------|----------|
| Input NIP/Email + Password | Status absensi & statistik | Capture wajah + GPS |

## 🔗 API Endpoints

Aplikasi ini menggunakan API dari backend HRIS:

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/auth/login` | POST | Login user |
| `/api/auth/me` | GET | Get user profile |
| `/api/auth/logout` | POST | Logout |
| `/api/attendance/clock-in` | POST | Clock in dengan face + GPS |
| `/api/attendance/clock-out` | POST | Clock out dengan face + GPS |
| `/api/attendance/status` | GET | Status absensi hari ini |
| `/api/employee/my-schedule` | GET | Jadwal shift mingguan |
| `/api/employee/monthly-stats` | GET | Statistik bulanan |

## ⚙️ Konfigurasi Permissions

Aplikasi memerlukan izin berikut:
- **Kamera** - Untuk verifikasi wajah
- **Lokasi** - Untuk validasi area kantor

Permissions dikonfigurasi di `app.json`:
```json
{
  "plugins": [
    ["expo-camera", { "cameraPermission": "..." }],
    ["expo-location", { "locationWhenInUsePermission": "..." }]
  ]
}
```

## 📝 Catatan Penting

1. **Face Registration** - User harus sudah memiliki wajah terdaftar di HRIS sebelum bisa clock in/out
2. **Area Kantor** - Absensi hanya bisa dilakukan dalam radius lokasi kantor yang aktif
3. **Jadwal Shift** - User harus memiliki jadwal shift untuk hari yang bersangkutan
4. **Waktu Absensi** - Clock in/out hanya bisa dilakukan sesuai window waktu shift

## 🔧 Development

```bash
# Start development server
npx expo start

# Clear cache dan start
npx expo start -c

# Build untuk Android
npx expo build:android

# Build untuk iOS
npx expo build:ios
```

## 📄 Lisensi

MIT License

## 👥 Kontributor

- Developer Team

---

**Backend Repository:** [HRIS Attendance System](https://github.com/shadowanon46-maker/hris-attendance-system)
