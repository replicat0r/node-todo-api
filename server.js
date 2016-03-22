var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [{
    id: 1,
    description: "meet mom for lunch",
    completed: false
}, {
        id: 2,
        description: 'goto market',
        complete: false
    },
    {
        id: 3,
        description: "finish nodejs course",
        complete: true
    }]

app.get('/', function(req, res) {
    res.send('To do api root')
})

app.get('/todos', function(req, res) {
    res.json(todos)
})

app.get('/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id,10)
    var matchedTodo
    todos.forEach(function(todo) {
        console.log(todo.id)
        // console.log(matchedTodo)
        if (todoId === todo.id) {
           matchedTodo = todo
        }
    });
    console.log(`matched ${matchedTodo}`)
    if (matchedTodo) {
        res.json(matchedTodo)

    } else {
        res.status(404).send();
    }
})

app.listen(PORT, function() {
    console.log(`listening on port ${PORT}`)
})