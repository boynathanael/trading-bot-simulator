// index.js (Versi Upgrade, Siap Deploy)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Binance = require('node-binance-api'); // <-- TAMBAHKAN library Binance

const app = express();
const corsOptions = {
    origin: 'https://trading-bot-simulator-t2kz.vercel.app/' // <-- GANTI DENGAN URL FRONTEND ANDA
};
app.use(cors(corsOptions));
app.use(express.json());

// --- PERUBAHAN BESAR: Ganti penyimpanan file dengan variabel di memori ---
let activeConfig = null; // <-- GANTI config.json dengan variabel
let orderHistory = [];   // <-- GANTI orders.log dengan array

const PORT = process.env.PORT || 3001;

// --- Inisialisasi Binance API dengan kunci dari file .env ---
const binance = new Binance().options({ // <-- TAMBAHKAN BLOK INI
    APIKEY: process.env.BINANCE_TESTNET_API_KEY,
    APISECRET: process.env.BINANCE_TESTNET_SECRET_KEY,
    test: true // PENTING: Menandakan kita menggunakan Testnet
});

// --- Endpoint untuk menyimpan konfigurasi dari frontend ---
app.post('/config', (req, res) => {
    activeConfig = req.body; // <-- SIMPAN ke variabel, bukan file
    console.log('Konfigurasi disimpan:', activeConfig);
    res.status(200).send({ message: 'Konfigurasi berhasil disimpan' });
});

// --- Endpoint untuk mengambil konfigurasi aktif ---
app.get('/config', (req, res) => {
    if (activeConfig) {
        res.status(200).json(activeConfig); // <-- AMBIL dari variabel
    } else {
        res.status(404).send({ message: 'Konfigurasi tidak ditemukan' });
    }
});

// --- Endpoint untuk menerima sinyal dari TradingView (VERSI UPGRADE TOTAL) ---
app.post('/webhook', async (req, res) => {
    const signal = req.body;
    console.log('Sinyal diterima:', signal);

    // 1. Baca konfigurasi yang aktif dari memori
    if (!activeConfig) {
        console.error('Error: Konfigurasi belum diatur.');
        return res.status(500).send('Error: Konfigurasi belum diatur.');
    }

    // 2. Validasi sinyal (Logika Anda tetap sama)
    const isBuySignal = signal.plusDI > activeConfig.diPlusThreshold && signal.minusDI < activeConfig.diMinusThreshold && signal.adx > activeConfig.adxMinimum;

    if (isBuySignal) {
        console.log(`Sinyal BUY valid terdeteksi untuk ${activeConfig.symbol}! Mencoba eksekusi...`);
        try {
            // TENTUKAN JUMLAH ORDER (misalnya, 0.001 BTC untuk demo)
            const quantity = 0.001;

            // A. Set Leverage
            await binance.futuresLeverage(activeConfig.symbol, activeConfig.leverage);
            console.log(`Leverage diatur ke ${activeConfig.leverage}x`);

            // B. Eksekusi Market Buy Order
            const orderResponse = await binance.futuresMarketBuy(activeConfig.symbol, quantity);
            console.log('Order BUY berhasil dieksekusi di Binance:', orderResponse);
            
            // C. Buat objek order untuk disimpan di riwayat (berdasarkan respons nyata)
            const entryPrice = parseFloat(orderResponse.price);
            const tpPrice = entryPrice * (1 + activeConfig.takeProfit / 100);
            const slPrice = entryPrice * (1 - activeConfig.stopLoss / 100);

            const executedOrder = {
                symbol: activeConfig.symbol,
                action: "BUY",
                price_entry: entryPrice,
                tp_price: tpPrice.toFixed(2),
                sl_price: slPrice.toFixed(2),
                leverage: `${activeConfig.leverage}x`,
                timeframe: activeConfig.timeframe,
                timestamp: new Date().toISOString()
            };

            // D. Simpan order ke riwayat di memori
            orderHistory.push(executedOrder);
            console.log('Order berhasil dieksekusi dan disimpan ke riwayat:', executedOrder);

        } catch (error) {
            // Error handling yang lebih baik
            console.error('Gagal mengeksekusi order di Binance:', error.body || error.message);
            return res.status(500).send('Gagal mengeksekusi order di Binance.');
        }
    } else {
        console.log('Sinyal tidak memenuhi kriteria.');
    }

    res.status(200).send('Sinyal diterima dan diproses.');
});

// --- Endpoint untuk mengambil semua riwayat order simulasi ---
app.get('/orders', (req, res) => {
    // <-- AMBIL riwayat dari array, lalu balik urutannya
    res.status(200).json([...orderHistory].reverse()); 
});


app.listen(PORT, () => {
    console.log(`Backend server berjalan di http://localhost:${PORT}`);
});

module.exports = app;