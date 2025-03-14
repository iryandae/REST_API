const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;
const dataFilePath = path.join(__dirname, 'pokemons.json');
const usersFilePath = path.join(__dirname, 'users.json');
const secretKey = 'your_secret_key';

app.use(bodyParser.json());

let pokemons = [];
let users = [];

// Load existing data from the JSON file
if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    pokemons = JSON.parse(data);
}

if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath);
    users = JSON.parse(data);
}

// Middleware for basic authentication
const basicAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.sendStatus(401);
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Check credentials (you can replace this with your own logic)
    if (username === 'admin' && password === 'password') {
        next();
    } else {
        res.sendStatus(403);
    }
};

// Middleware to authenticate and authorize
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Add a route to handle the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Pokémon API');
});

// Register a new user
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2)); // Save to file
    res.status(201).json(newUser);
});

// Login a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
});

// Apply basic authentication to protected routes
app.use('/pokemons', basicAuth);
app.use('/pokemons/:id', basicAuth);

// GET all Pokémon
app.get('/pokemons', authenticateToken, (req, res) => {
    res.json(pokemons);
});

// GET a specific Pokémon by ID
app.get('/pokemons/:id', authenticateToken, (req, res) => {
    const pokemon = pokemons.find(p => p.id === parseInt(req.params.id));
    if (pokemon) {
        res.json(pokemon);
    } else {
        res.status(404).send('Pokemon not found');
    }
});

// POST a new Pokémon
app.post('/pokemons', authenticateToken, (req, res) => {
    const newPokemon = {
        id: pokemons.length + 1,
        name: req.body.name,
        type: req.body.type
    };
    pokemons.push(newPokemon);
    fs.writeFileSync(dataFilePath, JSON.stringify(pokemons, null, 2)); // Save to file
    res.status(201).json(newPokemon);
});

// PUT to update a Pokémon by ID
app.put('/pokemons/:id', authenticateToken, (req, res) => {
    const pokemon = pokemons.find(p => p.id === parseInt(req.params.id));
    if (pokemon) {
        pokemon.name = req.body.name;
        pokemon.type = req.body.type;
        fs.writeFileSync(dataFilePath, JSON.stringify(pokemons, null, 2)); // Save to file
        res.json(pokemon);
    } else {
        res.status(404).send('Pokemon not found');
    }
});

// DELETE a Pokémon by ID
app.delete('/pokemons/:id', authenticateToken, (req, res) => {
    const pokemonIndex = pokemons.findIndex(p => p.id === parseInt(req.params.id));
    if (pokemonIndex !== -1) {
        pokemons.splice(pokemonIndex, 1);
        fs.writeFileSync(dataFilePath, JSON.stringify(pokemons, null, 2)); // Save to file
        res.status(204).send();
    } else {
        res.status(404).send('Pokemon not found');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});