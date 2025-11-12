// const dbConn = require('../config/db');

import dbConn from '../config/db.js';

// Add a new restaurant
export const addRestaurant = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Restaurant name is required' });
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (phone && !/^\+?\d{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const [result] = await dbConn.query(
      'INSERT INTO companies (name, email, phone) VALUES (?, ?, ?)',
      [name.trim(), email || null, phone || null]
    );

    res.status(201).json({
      success: true,
      message: 'Restaurant added successfully',
      company_id: result.insertId,
      result: result.entries
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
