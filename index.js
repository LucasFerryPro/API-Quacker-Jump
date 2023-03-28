const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config()

// Configuration de la base de données Postgres
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
});

// Définition du modèle de données des scores
const Score = sequelize.define('Score', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    pseudo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// Synchronisation du modèle avec la base de données
sequelize.sync().then(() => {
    console.log('Database synchronized');
});

// Configuration de l'application Express
const app = express();
app.use(bodyParser.json());

// Configuration du secret pour les tokens JWT
const jwtSecret = process.env.SECRET_KEY;

// Middleware pour vérifier le token JWT
const verifyJwtToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized' });
    }
    try {
        const decodedToken = jwt.verify(token, jwtSecret);
        req.userId = decodedToken.userId;
        next();
    } catch (err) {
        return res.status(401).send({ message: 'Unauthorized' });
    }
};

// Route pour ajouter un score à la base de données
app.post('/scores', verifyJwtToken, async (req, res) => {
    const { pseudo, score } = req.body;
    try {
        const newScore = await Score.create({ pseudo, score });
        res.status(201).send({ message: 'Score created', score: newScore });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Route pour récupérer la liste des scores depuis la base de données
app.get('/scores',verifyJwtToken, async (req, res) => {
    try {
        const scores = await Score.findAll({ order: [['score', 'DESC']] });
        res.status(200).send({ scores });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Démarrage du serveur
app.listen(3000, () => {
    console.log('Server started on port 3000');
    console.log('http://localhost:3000');
});