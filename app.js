const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
//exporting all the libraries related to level10
const bcrypt = require("bcrypt");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
// const flash = require("connectFlash");
const flash = require("connect-flash");
const LocalStratergy = require("passport-local");

const saltRounds = 10;

app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-2837428907583420",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (req, res, next) {
  res.locals.messages = req.flash();
  next();
});

//initializing 
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStratergy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Password is invalid!!!" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "Email-ID is invalid" });
        });
    }
  )
);

//serializing the user
passport.serializeUser((user, done) => {
  console.log("Serialize use in session", user.id);
  done(null, user.id);
});

//deserializing the user
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.set("view engine", "ejs");
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (req, res) {
  // res.render("index", {
  //   title: "My Todo Manager",
  //   csrfToken: req.csrfToken(),
  // });
  if (req.user) {
    return res.redirect("/todos");
  } else {
    res.render("index", {
      title: "My Todo Manager",
      csrfToken: req.csrfToken(),
    });
  }
});

// app.get("/todos",
//   connectEnsureLogin.ensure_LoggedIn(),
//   async function (req, res) {
//     try {
//       const user_Name = req.user.firstName + " " + req.user.lastName;
//       const logged_In = req.user.id;
//       const over_Due = await Todo.overDue(loggedIn);
//       const due_Today = await Todo.dueToday(loggedIn);
//       const due_Later = await Todo.dueLater(loggedIn);
//       const completed_Items = await Todo.completedItemsAre(loggedIn);
//       if (req.accepts("html")) {
//         res.render("todos", {
//           title: "To-Do Manager",
//           user_Name,
//           over_Due,
//           due_Today,
//           due_Later,
//           completed_Items,
//           csrfToken: req.csrfToken(),
//         });
//       } else {
//         res.json({
//           over_Due,due_Today,due_Later,completed_Items,
//         });
//       }
//     } catch (err1) {
//       console.log(err1);
//       return res.status(422).json(err1);
//     }
//   }
// );

app.get("/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    try {
      const userName = req.user.firstName + " " + req.user.lastName;
      const loggedIn = req.user.id;
      const overDue = await Todo.overDue(loggedIn);
      const dueToday = await Todo.dueToday(loggedIn);
      const dueLater = await Todo.dueLater(loggedIn);
      const completedItems = await Todo.completedItemsAre(loggedIn);
      if (req.accepts("html")) {
        res.render("todos", {
          title: "To-Do Manager",
          userName,
          overDue,
          dueToday,
          dueLater,
          completedItems,
          csrfToken: req.csrfToken(),
        });
      } else {
        res.json({
          overDue,dueToday,dueLater,completedItems,
        });
      }
    } catch (err1) {
      console.log(err1);
      return res.status(422).json(err1);
    }
  }
);


//URL Route to users
app.post("/users", async (req, res) => {
  if (!req.body.firstName) {
    req.flash("error", "Enter your first name");
    return res.redirect("/signup");
  }
  if (!req.body.email) {
    req.flash("error", "Enter your email ID");
    return res.redirect("/signup");
  }
  if (!req.body.password) {
    req.flash("error", "Enter your password");
    return res.redirect("/signup");
  }
  if (req.body.password < 8) {
    req.flash("error", "Password Length must be atleast 8");
    return res.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPwd,
    });
    req.login(user, (err1) => {
      if (err1) {
        console.log(err1);
        res.redirect("/");
      } else {
        res.redirect("/todos");
      }
    });
  } catch (errori) {
    req.flash("error", errori.message);
    return res.redirect("/signup");
  }
});

//URL Route to login
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    csrfToken: req.csrfToken(),
  });
});

//URL Route to signup
app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign up",
    csrfToken: req.csrfToken(),
  });
});

//URL Route to session
app.post("/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/todos");
  }
);

//URL Route to signout
app.get("/signout", (req, res, next) => {
  req.logout((err1) => {
    if (err1) {
      return next(err1);
    }
    res.redirect("/");
  });
});

//Not required for this level
app.get("/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    try {
      const todo1 = await Todo.findByPk(req.params.id);
      return res.json(todo1);
    } catch (error2) {
      console.log(error2);
      return res.status(422).json(error2);
    }
  }
);

//URL Route to todos
app.post("/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    if (req.body.title.length < 5) {
      req.flash("error", "Title length should atleast be 5");
      return res.redirect("/todos");
    }
    if (!req.body.dueDate) {
      req.flash("error", "Select a due date");
      return res.redirect("/todos");
    }
    try {
      await Todo.addaTodo({
        title: req.body.title,
        dueDate: req.body.dueDate,
        userID: req.user.id,
      });
      return res.redirect("/todos");
    } catch (error1) {
      console.log(error1);
      return res.status(422).json(error1);
    }
  }
);

//Error
// app.put("/todos/:id",
//   connectEnsureLogin.ensureLoggedIn(),
//   async function (req, res) {
//     // const todo = await Todo.findByPk(req.params.id);
//     
//   }
// );

//URL Route to completion status
app.put("/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    // const todo = await Todo.findByPk(req.params.id);
    try {
      const todo = await Todo.findByPk(req.params.id);
      const updatedTodoIs = await todo.setCompletionStatusAs(
        req.body.completed
      );
      return res.json(updatedTodoIs);
    } catch (error1) {
      console.log(error1);
      return res.status(422).json(error1);
    }
  }
);

//URL Route to deleting
app.delete("/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, resp) {
    console.log("Delete a todo with a particular id : ", req.params.id);
    
    try {
      const res = await Todo.remove(req.params.id, req.user.id);
      return res.json({ success: res === 1 });
    } catch (error1) {
      console.log(error1);
      return resp.status(422).json(error1);
    }
  }
);

module.exports = app;
