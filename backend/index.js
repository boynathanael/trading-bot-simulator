// index.js (di folder backend)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Untuk membaca/menulis file
const axios = require('axios');
const app = express();
app.use(cors()); // Mengizinkan akses dari domain lain (frontend)
app.use(express.json()); // Membaca body JSON dari request
const CONFIG_FILE = './config.json';
const ORDERS_LOG_FILE = './orders.log';
const PORT = 3001; // Port untuk backend

// Endpoint untuk menyimpan konfigurasi dari frontend
app.post('/config', (req, res) => {
    const config = req.body; // Mengambil data JSON dari body request
    // Menulis data config ke file config.json
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); 
    console.log('Konfigurasi disimpan:', config); // Log di terminal server
    res.status(200).send({ message: 'Konfigurasi berhasil disimpan' }); // Kirim respons ke frontend
});

// Endpoint untuk mengambil konfigurasi aktif
app.get('/config', (req, res) => {
    // Cek apakah file config.json ada
    if (fs.existsSync(CONFIG_FILE)) {
        // Baca file, ubah dari teks JSON ke objek JS
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE)); 
        res.status(200).json(config); // Kirim config sebagai respons JSON
    } else {
        res.status(404).send({ message: 'Konfigurasi tidak ditemukan' }); // Kirim error jika file tidak ada
    }
});

// Endpoint untuk menerima sinyal dari TradingView
app.post('/webhook', async (req, res) => {
    const signal = req.body;
    console.log('Sinyal diterima:', signal);

    // 1. Baca konfigurasi yang aktif
    if (!fs.existsSync(CONFIG_FILE)) {
        return res.status(500).send('Error: Konfigurasi belum diatur.');
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE));

    // 2. Validasi sinyal
    const isBuySignal = signal.plusDI > config.diPlusThreshold && signal.minusDI < config.diMinusThreshold && signal.adx > config.adxMinimum;

    if (isBuySignal) {
        console.log('Sinyal BUY valid terdeteksi!');
        try {
            // 3. Ambil harga terkini dari Binance Testnet
            const priceResponse = await axios.get(`https://testnet.binancefuture.com/fapi/v1/ticker/price?symbol=${config.symbol}`);
            const entryPrice = parseFloat(priceResponse.data.price);
            
            // 4. Hitung TP & SL
            const tpPrice = entryPrice * (1 + config.takeProfit / 100);
            const slPrice = entryPrice * (1 - config.stopLoss / 100);

            // 5. Buat data order simulasi
            const order = {
                symbol: config.symbol,
                action: "BUY",
                price_entry: entryPrice,
                tp_price: tpPrice.toFixed(2),
                sl_price: slPrice.toFixed(2),
                leverage: `${config.leverage}x`,
                timeframe: config.timeframe,
                timestamp: new Date().toISOString()
            };

            // 6. Simpan order ke log
            fs.appendFileSync(ORDERS_LOG_FILE, JSON.stringify(order) + '\n');
            console.log('Order simulasi disimpan:', order);
            
            // TODO: Kirim order ke Binance Testnet API jika diperlukan

        } catch (error) {
            console.error('Error saat memproses order:', error.message);
        }
    } else {
        console.log('Sinyal tidak memenuhi kriteria.');
    }

    res.status(200).send('Sinyal diterima');
});


// Endpoint untuk mengambil semua riwayat order simulasi
app.get('/orders', (req, res) => {
    if (fs.existsSync(ORDERS_LOG_FILE)) {
        // Baca semua baris dari file log
        const ordersData = fs.readFileSync(ORDERS_LOG_FILE, 'utf-8').trim().split('\n');
        // Ubah setiap baris (yang merupakan string JSON) menjadi objek
        const orders = ordersData.map(order => JSON.parse(order));
        // Kirim array of objects, dibalik agar yang terbaru di atas
        res.status(200).json(orders.reverse()); 
    } else {
        res.status(200).json([]); // Kirim array kosong jika belum ada order
    }
});

app.listen(PORT, () => {
    console.log(`Backend server berjalan di http://localhost:${PORT}`);
});