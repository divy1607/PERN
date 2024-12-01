require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL database connection setup
const pool = new Pool({
    user: process.env.DB_USER || 'divy',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'persondb',
    password: process.env.DB_PASSWORD || 'divy1607',
    port: process.env.DB_PORT || 5432,
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type'));
        }
        cb(null, true);
    }
});

// Validation middleware
const validatePerson = [
    check('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a valid string')
        .trim(),
    check('phone_number')
        .matches(/^\+?[\d\s-]+$/).withMessage('Phone number must be a valid format'),
    check('bank_balance')
        .isFloat({ min: 0 }).withMessage('Bank balance must be a valid positive number'),
    check('dob')
        .isDate().withMessage('Date of birth must be a valid date (e.g., YYYY-MM-DD)')
];

// GET all persons with pagination
app.get('/api/persons', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const result = await pool.query(
            'SELECT * FROM persons LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        const total = await pool.query('SELECT COUNT(*) FROM persons');

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total: parseInt(total.rows[0].count)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

// GET single person
app.get('/api/persons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM persons WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST new person
// POST new person
app.post('/api/persons', upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'media', maxCount: 1 }
]), validatePerson, async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Files:', req.files);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, dob, phone_number, bank_balance } = req.body;
        const resumePath = req.files['resume'] ? req.files['resume'][0].path : null;
        const mediaPath = req.files['media'] ? req.files['media'][0].path : null;

        console.log('Processed data:', {
            name,
            dob,
            phone_number,
            bank_balance,
            resumePath,
            mediaPath
        });

        const result = await pool.query(
            'INSERT INTO persons (name, dob, phone_number, bank_balance, resume_path, media_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, dob, phone_number, bank_balance, resumePath, mediaPath]
        );

        console.log('Database result:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Detailed error:', err);
        res.status(500).json({
            error: 'Server error',
            details: err.message,
            code: err.code
        });
    }
});
// PUT update person
app.put('/api/persons/:id', upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'media', maxCount: 1 }
]), validatePerson, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, dob, phone_number, bank_balance } = req.body;
        const resumePath = req.files['resume'] ? req.files['resume'][0].path : null;
        const mediaPath = req.files['media'] ? req.files['media'][0].path : null;

        let query = 'UPDATE persons SET name = $1, dob = $2, phone_number = $3, bank_balance = $4';
        let values = [name, dob, phone_number, bank_balance];
        let valueIndex = 5;

        if (resumePath) {
            query += `, resume_path = $${valueIndex}`;
            values.push(resumePath);
            valueIndex++;
        }

        if (mediaPath) {
            query += `, media_path = $${valueIndex}`;
            values.push(mediaPath);
            valueIndex++;
        }

        query += ` WHERE id = $${valueIndex} RETURNING *`;
        values.push(id);

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Person not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE person
app.delete('/api/persons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM persons WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});