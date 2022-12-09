const express = require("express");
var csrf = require("tiny-csrf");
//csrf isnt there so used tiny-csrf
const app = express();
//using body parser
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.urlencoded({ extended: false }));
const path = require("path");
//using bodyparser.json
app.use(bodyParser.json());
//using express static
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
//using cookie parser
app.use(cookieParser("This is a secret string!!!"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));


// eslint-disable-next-line no-unused-vars
// const {todo} = require("./models");

const { Todo } = require("./models");


app.set("view engine", "ejs");
//get request to fetch details
app.get("/", async (request, response) => {
  const allTodosAre76 = await Todo.getAllTodos();  
  const completedItemsIs84 = await Todo.completedItemsAre();
  const overdue32 = await Todo.overdue();
  const dueLater = await Todo.dueLater();
  const dueToday = await Todo.dueToday();
  //If the request is accepted
  if (request.accepts("html")) {
    response.render("index", {
      title: "My Todo Manager",
      allTodosAre76,
      overdue32,
      dueLater,
      dueToday,
      completedItemsIs84,
      //for every req. we need to add rendering csrf token to avoid invalid csrf token error
      csrfToken: request.csrfToken(),
    });
  } else {
    //return response
    response.json({overdue32, dueLater, dueToday, completedItemsIs84});
  }
});



//post request to create a todo
app.post("/todos", async (request2, response2) => {
  // console.log("creating new todo", request2.body);
  // console.log("creating new ", request2.body);
  try {
    // eslint-disable-next-line no-unused-vars
      await Todo.addaTodo({
      title: request2.body.title,
      dueDate: request2.body.dueDate,
      completed: false,
    });
    //redirect to the root URL
    return response2.redirect("/");
  } catch (err1) {
    console.log(err1);
    return response2.status(422).json(err1);
  }
});
//Modifying a todo as completed in the list
app.put("/todos/:id", async (req, res) => {
  console.log("Marking a todo as completed : ", req.params.id);
  const todo = await Todo.findByPk(req.params.id);
  //try block to modify
  try {
    const updatedtodoIs3 = await todo.setCompletionStatusAs(req.body.completed);
    return res.json(updatedtodoIs3);
  } catch (err2) {
    console.log(err2);
    return res.status(422).json(err2);
  }
});
//deleting a todo from the list
app.delete("/todos/:id", async (req, res) => {
  console.log("Deleting a todo with a particular id..", req.params.id);
  //try block to delete
  try {
    await Todo.remove(req.params.id);
    return res.json({ success: true });
  } catch (err3) {
    return res.status(422).json(err3);
  }
});
module.exports = app;
