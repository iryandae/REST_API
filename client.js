fetch('http://localhost:3000/pokemons', {
    method: 'GET',
    headers: {
        'Authorization': 'Basic ' + btoa('admin:password')
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
