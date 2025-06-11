import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001'; // URL backend kita

function App() {
    const [config, setConfig] = useState({
        symbol: 'BTCUSDT',
        timeframe: '5m',
        diPlusThreshold: 25,
        diMinusThreshold: 20,
        adxMinimum: 20,
        takeProfit: 2,
        stopLoss: 1,
        leverage: 10,
    });
    const [orders, setOrders] = useState([]);
    const [activeConfig, setActiveConfig] = useState(null);

    // Fungsi untuk mengambil konfigurasi dan order saat aplikasi dimuat
    const fetchData = async () => {
        try {
            const configRes = await axios.get(`${API_URL}/config`);
            setActiveConfig(configRes.data);
            setConfig(configRes.data); // Update form dengan config aktif
        } catch (error) {
            console.log('Belum ada konfigurasi aktif.');
        }
        try {
            const ordersRes = await axios.get(`${API_URL}/orders`);
            setOrders(ordersRes.data);
        } catch (error) {
            console.error('Gagal mengambil data order:', error);
        }
    };
    
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh data setiap 5 detik
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: parseFloat(value) || value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/config`, config);
            alert('Konfigurasi berhasil disimpan!');
            fetchData(); // Muat ulang data setelah simpan
        } catch (error) {
            alert('Gagal menyimpan konfigurasi!');
            console.error(error);
        }
    };

    return (
        <div className="container">
            <h1>Trading Bot Simulator</h1>
            
            <div className="main-content">
                <div className="form-section">
                    <h2>Form Input Strategi</h2>
                    <form onSubmit={handleSubmit}>
                        {/* ... (input fields) ... */}
                        {Object.keys(config).map(key => (
                             <div className="form-group" key={key}>
                                <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                <input type="text" name={key} value={config[key]} onChange={handleChange} />
                            </div>
                        ))}
                        <button type="submit">Simpan Konfigurasi</button>
                    </form>
                </div>

                <div className="config-section">
                    <h2>Konfigurasi Aktif</h2>
                    {activeConfig ? (
                        <pre>{JSON.stringify(activeConfig, null, 2)}</pre>
                    ) : (
                        <p>Belum ada konfigurasi yang disimpan.</p>
                    )}
                </div>
            </div>

            <div className="orders-section">
                <h2>Riwayat Order Simulasi</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Symbol</th>
                            <th>Aksi</th>
                            <th>Harga Entry</th>
                            <th>Take Profit</th>
                            <th>Stop Loss</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, index) => (
                            <tr key={index}>
                                <td>{new Date(order.timestamp).toLocaleString()}</td>
                                <td>{order.symbol}</td>
                                <td className={`action-${order.action.toLowerCase()}`}>{order.action}</td>
                                <td>{order.price_entry}</td>
                                <td>{order.tp_price}</td>
                                <td>{order.sl_price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;