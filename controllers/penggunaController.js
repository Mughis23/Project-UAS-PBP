const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Gunakan db dari config.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Pastikan menggunakan environment variable

const SECRET_KEY = process.env.SECRET_KEY; // Gunakan SECRET_KEY dari environment variable

// Registrasi pengguna untuk platform pencari lowongan kerja dan konsultasi pra-kerja
router.post('/register', async (req, res) => {
    const { nama, email, kata_sandi, peran } = req.body;

    if (!nama || !email || !kata_sandi) {
        return res.status(400).json({ message: 'Semua field harus diisi!' });
    }

    try {
        const [existingUser] = await db.promise().query('SELECT * FROM pengguna WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email sudah digunakan!' });
        }

        const hashedPassword = await bcrypt.hash(kata_sandi, 10);

        await db.promise().query('INSERT INTO pengguna (nama, email, kata_sandi, peran) VALUES (?, ?, ?, ?)', [
            nama,
            email,
            hashedPassword,
            peran || 'pelamar'
        ]);

        res.status(201).json({ message: 'Pengguna berhasil didaftarkan' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Login pengguna
router.post('/login', async (req, res) => {
    const { email, kata_sandi } = req.body;

    if (!email || !kata_sandi) {
        return res.status(400).json({ message: 'Email dan kata sandi harus diisi!' });
    }

    try {
        const [users] = await db.promise().query('SELECT * FROM pengguna WHERE email = ?', [email]);
        const user = users[0];
        if (!user) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan!' });
        }

        const isMatch = await bcrypt.compare(kata_sandi, user.kata_sandi);
        if (!isMatch) {
            return res.status(401).json({ message: 'Kata sandi salah!' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, peran: user.peran }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login berhasil',
            token,
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Mendapatkan daftar pengguna
router.get('/pengguna', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan!' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const [users] = await db.promise().query('SELECT id, nama, email, peran FROM pengguna');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Token tidak valid!' });
    }
});

// Mendapatkan detail pengguna berdasarkan ID
router.get('/pengguna/:id', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan!' });
    }

    const token = authHeader.split(' ')[1];
    const userId = req.params.id;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const [users] = await db.promise().query('SELECT id, nama, email, peran FROM pengguna WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan!' });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Token tidak valid!' });
    }
});

// Mengupdate informasi pengguna
router.put('/pengguna/:id', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan!' });
    }

    const token = authHeader.split(' ')[1];
    const userId = req.params.id;
    const { nama, email, peran } = req.body;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const [result] = await db.promise().query(
            'UPDATE pengguna SET nama = ?, email = ?, peran = ? WHERE id = ?',
            [nama, email, peran, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan!' });
        }

        res.status(200).json({ message: 'Data pengguna berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Menghapus pengguna dari platform pencari kerja dan konsultasi
router.delete('/pengguna/:id', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan!' });
    }

    const token = authHeader.split(' ')[1];
    const userId = req.params.id;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const [result] = await db.promise().query('DELETE FROM pengguna WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan!' });
        }

        res.status(200).json({ message: 'Pengguna berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
