const express = require("express");
let csrf = require("tiny-csrf");
const path = require("path");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
let cookieParser = require("cookie-parser");

// eslint-disable-next-line no-unused-vars
const todo = require("./models/todo");
//app.use() for use
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_charactes_long", ["PUT", "POST", "DELETE"]));

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
//app.get() to get
app.get("/", async function (request, response) {
  try {
    const overdueItems = await Todo.getOverdueItems();
    const dueTodayItems = await Todo.getDueTodayItems();
    const dueLaterItems = await Todo.getDueLaterItems();
    const completedItems = await Todo.getCompletedTodos();

    if (request.accepts("html")) {
      return response.render("index", {
        overdueItems,
        dueTodayItems,
        dueLaterItems,
        completedItems,
        csrfToken: request.csrfToken(),
      });
    } else {
      return response.json({
        overdueItems,
        dueTodayItems,
        dueLaterItems,
        completedItems,
      });
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos", async function (_request, response) {
  console.log("getting the list all Todos ...");
  
  try {
    const todos = await Todo.getTodos();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  console.log("creating new todo", request.body);
  try {
    await Todo.addTodo(request.body);
    //return response.json(todo);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//app.put for todo
app.put("/todos/:id", async function (request, response) {
  console.log("Mark Todo as completed:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);

  try {
    const updatedTodo = await todo.setCompletionStatus();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//app.delete for todo
app.delete("/todos/:id", async function (request, response) {
  console.log("delete a todo with ID:", request.params.id);
  
  const todo = await Todo.findByPk(request.params.id);
  if (todo) {
    try {
      const deletedTodo = await todo.deleteTodo();

      return response.send(deletedTodo ? true : false);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  } else return response.send(false);
});

module.exports = app;
