# Trading Bot Simulator

## Deskripsi Proyek
Aplikasi ini adalah simulator bot trading sederhana yang dibangun dengan backend Node.js/Express dan frontend React. Aplikasi memungkinkan pengguna untuk mengatur parameter strategi trading berdasarkan indikator DMI/ADX, dan kemudian menyimulasikan eksekusi order berdasarkan sinyal yang diterima, dengan mengambil data harga real-time dari Binance Testnet.

---

## Struktur Folder
Proyek ini dibagi menjadi dua bagian utama:

```
trading-bot-simulator/
├── backend/      # Server Node.js, logika bot, dan API
└── frontend/     # Aplikasi React untuk antarmuka pengguna
```

---

## Cara Menjalankan Proyek

### Prasyarat
- [Node.js](https://nodejs.org/) (versi LTS direkomendasikan)
- [Git](https://git-scm.com/)

### 1. Backend
```bash
# Masuk ke folder backend
cd backend

# Install dependensi
npm install

# Buat file .env dan isi dengan API key Binance Testnet Anda
# BINANCE_TESTNET_API_KEY=apikey_anda_disini
# BINANCE_TESTNET_SECRET_KEY=secretkey_anda_disini

# Jalankan server backend
node index.js
# Server akan berjalan di http://localhost:3001
```

### 2. Frontend
```bash
# Buka terminal baru, masuk ke folder frontend
cd frontend

# Install dependensi
npm install

# Jalankan aplikasi React
npm start
# Aplikasi akan terbuka otomatis di browser pada http://localhost:3000
```

---

## Dokumentasi API

### `POST /config`
Menyimpan konfigurasi strategi dari frontend ke backend.
- **Payload (Contoh):**
  ```json
  {
    "symbol": "BTCUSDT",
    "timeframe": "5m",
    "diPlusThreshold": 25,
    "diMinusThreshold": 20,
    "adxMinimum": 20,
    "takeProfit": 2,
    "stopLoss": 1,
    "leverage": 10
  }
  ```

### `GET /config`
Mengambil konfigurasi yang sedang aktif tersimpan di backend.

### `GET /orders`
Mengambil semua riwayat order simulasi yang telah dieksekusi.

### `POST /webhook`
Menerima sinyal dari pemicu eksternal (disimulasikan dari TradingView).
- **Payload (Contoh):**
  ```json
  {
    "symbol": "BTCUSDT",
    "plusDI": 27.5,
    "minusDI": 15.0,
    "adx": 25.0,
    "timeframe": "5m"
  }
  ```

---

## ⚠️ Simulasi Webhook TradingView

Karena fitur webhook di TradingView memerlukan akun premium, fungsionalitas webhook disimulasikan menggunakan **Postman** untuk mendemonstrasikan bahwa backend siap menerima dan memproses sinyal secara real-time.

**Cara Melakukan Simulasi:**
1. Pastikan server backend (`node index.js`) berjalan.
2. Jalankan Ngrok untuk mengekspos server lokal Anda: `ngrok http 3001`.
3. Salin URL `https` yang diberikan oleh Ngrok.
4. Buka Postman dan buat request baru:
   - **Metode:** `POST`
   - **URL:** `[URL Ngrok Anda]/webhook` (Contoh: ` https://40ce-125-166-13-56.ngrok-free.app/webhook`)
   - **Body:** Pilih `raw` dan `JSON`. Tempel payload di bawah ini untuk menyimulasikan sinyal **BUY**:
     ```json
     {
       "symbol": "BTCUSDT",
       "plusDI": 27.5,
       "minusDI": 15.0,
       "adx": 25.0,
       "timeframe": "5m"
     }
     ```
5. Klik **"Send"**. Anda akan melihat log proses muncul di terminal backend dan order baru akan otomatis tampil di aplikasi frontend.