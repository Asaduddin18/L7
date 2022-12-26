const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;


function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
//Function to login
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("My Todo Manager", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
//Test case to signup
  test("Test to Sign-up", async () => {
    let res = await agent.get("/signup");
    const csrfTokenIs = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Virat",
      lastName: "Kohli",
      email: "Virat.a@test1.com",
      password: "12345678@",
      _csrf: csrfTokenIs,
    });
    expect(res.statusCode).toBe(302);
  });
//test case to sign out
  test("Test to Sign-out", async () => {
    let response = await agent.get("/todos");
    expect(response.statusCode).toBe(200);
    response = await agent.get("/signout");
    expect(response.statusCode).toBe(302);
    response = await agent.get("/todos");
    expect(response.statusCode).toBe(302);
  });
//test case to create a todo
  test("Test to create a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Write a book",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });
//Test case to marke a todo as complete
  test("Test to marking a todo complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Completed OS record",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
//Test case to marke a todo as incomplete
  test("test to mark a todo incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "To complete FOST assignment",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: false,
      });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });
//Testcase to delete a todo
  test("Test to delete a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Completed OS lab Internal",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse1 = await agent
      .get("/todos")
      .set("Accept", "application/json");

    const parsedGroupedResponse1 = JSON.parse(groupedTodosResponse1.text);
    const dueTodayCount = parsedGroupedResponse1.dueToday.length;
    const latestTodo = parsedGroupedResponse1.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const todoID = latestTodo.id;
    const deleteResponse1 = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });
    const parsedDeleteResponse1 = JSON.parse(deleteResponse1.text).success;
    expect(parsedDeleteResponse1).toBe(true);
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const deleteResponse21 = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });
    const parsedDeleteResponse21 = JSON.parse(deleteResponse21.text).success;
    expect(parsedDeleteResponse21).toBe(false);
  });


  //One of the user cannot mark as complete or incomplete a todo of another user
  test("One user cannot mark as complete or incomplete a todo of another user", async () => {
    //creating UserA account
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "test",
      lastName: "User A",
      email: "userA@test1.com",
      password: "123456789",
      _csrf: csrfToken,
    });
    //create Todo from User1 account
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/todos").send({
      title: "Buy sweets",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const idOfTodoFromUserA1 = res.id;
    //Signout User1
    await agent.get("/signout");
    //Create User1 account
    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "test",
      lastName: "User B",
      email: "userB@test2.com",
      password: "123456",
      _csrf: csrfToken,
    });
    //Try markAsComplete on User1 Todo from User2 account
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const markCompleteResponse = await agent
      .put(`/todos/${idOfTodoFromUserA1}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });
    expect(markCompleteResponse.statusCode).toBe(422);
    //Try markAsIncomplete on User1 Todo from User2 account
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const markIncompleteResponse11 = await agent
      .put(`/todos/${idOfTodoFromUserA1}`)
      .send({
        _csrf: csrfToken,
        completed: false,
      });
    expect(markIncompleteResponse11.statusCode).toBe(422);
  });

  //One of the user can't delete a todo of another user
  test("One of the user can't delete a todo of another user", async () => {
    //create UserA account
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "UserC",
      email: "userC@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    //creating a todo from User1 account

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/todos").send({
      title: "Sem end next week",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const idOfTodoFromUserA2 = res.id;
    //Signing out from User1
    await agent.get("/signout");
    //Creating an User2 account
    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User D",
      email: "userD@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    //Tring to delete an User1's Todo from User2's accounts
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const deleteResponse22 = await agent
      .delete(`/todos/${idOfTodoFromUserA2}`)
      .send({
        _csrf: csrfToken,
      });
    expect(deleteResponse22.statusCode).toBe(422);
  });
});
