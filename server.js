const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const dataFilePath = path.join(__dirname, 'pokemons.json');

app.use(bodyParser.json());

let pokemons = [];

// Load existing data from the JSON file
if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath);
    pokemons = JSON.parse(data);
}

// Add a route to handle the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Pokémon API');
});

// GET all Pokémon
app.get('/pokemons', (req, res) => {
    res.json(pokemons);
});

// GET a specific Pokémon by ID
app.get('/pokemons/:id', (req, res) => {
    const pokemon = pokemons.find(p => p.id === parseInt(req.params.id));
    if (pokemon) {
        res.json(pokemon);
    } else {
        res.status(404).send('Pokemon not found');
    }
});

// POST a new Pokémon
app.post('/pokemons', (req, res) => {
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
app.put('/pokemons/:id', (req, res) => {
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
app.delete('/pokemons/:id', (req, res) => {
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
