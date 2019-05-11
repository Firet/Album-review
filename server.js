const express = require('express');
const app = express();
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
// JS y módulos propios 
const login = require('./server/login');
const ObjectId = require('mongodb').ObjectID;
// Obtenemos el objeto MongoClient
const MongoClient = require('mongodb').MongoClient;
// Configuramos la url dónde está corriendo MongoDB, base de datos y nombre de la colección
const url = 'mongodb://localhost:27017';
const dbName = 'catalogo';
const collectionName = 'peliculas';

//Creamos una nueva instancia de MongoClient
const client = new MongoClient(url);

// Utilizamos el método connect para conectarnos a MongoDB
client.connect(function (err, client) {
    // Acá va todo el código para interactuar con MongoDB
    console.log("Conectado a MongoDB, usando la base de datos " + dbName);
    // Luego de usar la conexión podemos cerrarla
    client.close();
});

// Middleware de body-parser para json
app.use(bodyParser.json());

// Ruta de recursos estáticos
app.use(express.static(path.join(__dirname, "./public")));

// Configuración de Handlebars
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, "views/layouts")
}));
app.set('view engine', 'handlebars');
app.set("views", path.join(__dirname, "./views"));
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/index', function (req, res) {
    //console.log("get a /index");
    res.render('home');
});

app.get('/favoritos', function (req, res) {
    //console.log("get a /favoritos");
    res.render('favoritos');
});

app.get('/contacto', function (req, res) {
    //console.log("get a /contacto");
    res.render('contacto', { selected: { contact: true } });
});

app.get('/contacto/submitporget', function (req, res) {
    // vemos en la consola del server el objeto query con todos los datos
    console.log(req.query)

    const firstname = req.query.firstname;
    const lastname = req.query.lastname;
    const country = req.query.country;
    const subject = req.query.subject;

    res.send(`
    Nombre: ${firstname}
    Apellido: ${lastname}
    País: ${country}
    Mensaje: ${subject}
    `);
});

// Configuración de Login en la ruta raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/landing.html'));
});

// POST /login
app.post('/login', (req, res) => {
    console.log(req.body);
    if (req.body.user !== undefined && req.body.password !== undefined) {
        if (login.validarUsuario(req.body.user, req.body.password)) {
            res.send('/index');
        } else {
            res.sendStatus(403);
        }
    } else {
        res.status(403).end();
    }

});

app.get('/series', function (req, res) {
    //console.log("get a /series");
    //const client = new MongoClient(url);
    client.connect(function (err, client) {
        const db = client.db(dbName);
        // Acá le cambié de colección
        const collectionName = 'series';
        const coleccion = db.collection(collectionName);
        coleccion.find().toArray(function (err, series) {
            client.close();
            res.render('series', { series_: series, selected: { series_: true } });
        });
    });
});

app.get('/peliculas', function (req, res) {
    //console.log("get a /peliculas");
    const client = new MongoClient(url);
    client.connect(function (err, client) {
        const db = client.db(dbName);
        // Acá le cambié de colección
        const collectionName = 'peliculas';
        const coleccion = db.collection(collectionName);
        coleccion.find().toArray(function (err, peliculas) {
            client.close();
            res.render('peliculas', { peliculas_: peliculas, selected: { peliculas_: true } });
        });
    });
});

// El get de la pelicula individual, filtrado por titulo 
app.get('/pelicula/:titulo', function (req, res) {
    const titulo = req.params.titulo;
    console.log(titulo);
    const client = new MongoClient(url);
    client.connect(function (err, client) {
        const db = client.db(dbName);
        const coleccion = db.collection(collectionName);
        // ejemplo de como buscar: coleccion.findOne({ "titulo": "Eyes Wide Shut" } 
        coleccion.findOne({ "titulosinespacio": titulo }, function (err, pelicula) {
            console.log(pelicula);
            client.close();
            res.render('pelicula', { pelicula: pelicula })
        });
    });
});

app.get('/peliculas/nueva', function (req, res) {
    res.render('peliculasform');
});

app.post('/peliculas/nueva', function (req, res) {
    const pelicula = {
        titulo: req.body.titulo,
        ruta: req.body.imagen,
        //categories: ["macbook", "notebook"]
    }
    console.log(pelicula);
    const client = new MongoClient(url);

    client.connect(function (err, client) {
        const db = client.db(dbName);
        // Acá le cambié de colección
        const collectionName = 'peliculas';
        const coleccion = db.collection(collectionName);
        coleccion.insertOne(pelicula, function (error, resultado) {
            res.render('peliculasform', { message: 'Pelicula creada!' })
        });
    });
});

app.post('/peliculas/borrar/:id', function (req, res) {
    const id = req.params.id

    const client = new MongoClient(url);

    client.connect(function (err, client) {
        const db = client.db(dbName);
        const coleccion = db.collection(collectionName);
        coleccion.deleteOne({ _id: ObjectId(id) }, function (err, resultado) {
            res.redirect('/peliculas');
        })
    })
})


app.get('/peliculas/update/:id', function (req, res) {
    const id = req.params.id;
    const client = new MongoClient(url);

    client.connect(function (err, client) {
        const db = client.db(dbName);
        const coleccion = db.collection(collectionName);
        coleccion.findOne({ _id: ObjectId(id) }, function (err, pelicula) {
            client.close();
            res.render('actualizarpelicula', { pelicula: pelicula });
        });
    });
});

app.post('/peliculas/update/:id', function (req, res) {
    const id = req.params.id;
    const pelicula = {
        //name: req.body.nombre,
        titulo: req.body.titulo,
        //price: parseInt(req.body.precio),
        titulosinespacio: req.body.titulosinespacio,
        ruta: req.body.ruta
    }

    console.log(pelicula);
    const client = new MongoClient(url);

    client.connect(function (err, client) {
        const db = client.db(dbName);
        const coleccion = db.collection(collectionName);
        coleccion.updateOne({ _id: ObjectId(id) }, { $set: pelicula }, function (err, respuesta) {
            coleccion.findOne({ _id: ObjectId(id) }, function (err, pelicula) {
                client.close();
                res.render('actualizarpelicula', { message: 'Pelicula actualizada!', pelicula: pelicula });
            });
        });
    });
});

//Asigno el puerto 4000 para que escuche el servidor
app.listen(4000, function () {
    console.log('Express escuchando en el puerto 4000');
});