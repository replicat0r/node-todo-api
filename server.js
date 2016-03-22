var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = []
var todoNextId = 1
app.use(bodyParser.json())
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

app.post('/todos',function(req,res){
    var body = req.body;
    //add id field
    //push body into array
    body.id = todoNextId++;
    todos.push(body)
    res.json(body)
    
})

app.listen(PORT, function() {
    console.log(`listening on port ${PORT}`)
})