var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db')
var bcrypt = require('bcrypt')


var app = express();
var PORT = process.env.PORT || 3000;
var todos = []
var todoNextId = 1

var middleware = require('./middleware')(db)
app.use(bodyParser.json())
app.get('/', function(req, res) {
    res.send('To do api root')
})

app.get('/todos', middleware.requireAuthentication, function(req, res) {
    var queryParams = req.query;
    var where = { userId: req.user.get('id') };
    if (queryParams.hasOwnProperty('completed') && (queryParams.completed === "true")) {
        where.completed = true
    } else if (queryParams.hasOwnProperty('completed') && (queryParams.completed === "false")) {
        where.completed = false
    }
    if (queryParams.hasOwnProperty('q') && (queryParams.q.length > 0)) {
        where.description = {
            $like: `%${queryParams.q}%`
        }
    }

    db.todo.findAll({
        where: where
    }).then(function(todos) {
        res.json(todos)

    }, function(e) {
        res.status(500).send(e)
    })

})

app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var todoId = parseInt(req.params.id, 10)

    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function(todo) {
        if (!!todo) {
            res.json(todo)
        } else {
            res.status(404).send();
        }
    }, function(err) {
        res.status(500).json(err)
    })

})

app.post('/todos', middleware.requireAuthentication, function(req, res) {
    var body = _.pick(req.body, 'description', 'completed')

    db.todo.create(body).then(function(todo) {
        req.user.addTodo(todo).then(function() {
            return todo.reload();
        }).then(function(todo) {
            res.json(todo.toJSON())

        })
    }, function(e) {
        res.status(400).json(e)
    })
})

app.post('/users', function(req, res) {
    var user = _.pick(req.body, 'email', 'password')
    db.user.create(user).then(function(user) {
        res.json(user.toPublicJSON())
    }, function(e) {
        res.status(400).json(e)
    })
})

app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var todoId = parseInt(req.params.id, 10)

    db.todo.destroy({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function(rowsDeleted) {
        if (rowsDeleted === 0) {
            res.status(404).json({
                error: "no todo with id"
            })
        } else {
            res.status(204).send();
        }
    }, function(err) {
        res.status(500).send();

    })
})

app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
    var todoId = parseInt(req.params.id, 10)

    var body = _.pick(req.body, 'description', 'completed')

    var attributes = {}

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed
    }

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description
    }

    db.todo.findOne({
        id: todoId,
        userId: req.user.get('id')
    }).then(function(todo) {
        if (todo) {
            todo.update(attributes).then(function(todo) {
                res.json(todo.toJSON())

            }, function(err) {
                res.status(400).json(e)
            })
        } else {
            res.status(404).send();
        }
    }, function(err) {
        res.status(500).send();
    })

})
app.post('/users/login', function(req, res) {
    var body = _.pick(req.body, 'email', 'password')
    var userInstance;

    db.user.authenticate(body).then(function(user) {
        var token = user.generateToken('authentication');
        userInstance = user
        return db.token.create({
            token: token
        });

    }).then(function(tokenInstance) {
        res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON())

    }).catch(function() {
        res.status(401).send();
    })


})

app.delete('/users/login',middleware.requireAuthentication,function(req,res){
    console.log('inside delete route ' + req.token)
    req.token.destroy().then(function(){
        res.status(204).send();
    }).catch(function(){
        res.status(500).send();
    })
});

db.sequelize.sync().then(function() {
    app.listen(PORT, function() {
        console.log(`listening on port ${PORT}`)
    })
});


