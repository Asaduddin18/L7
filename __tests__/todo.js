const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

//extract csrf token
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Testing a Todo for my todo manager", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  //Test for creating new todo
  test("creating new todo...", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Complete WD",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(422); //http status code
  });

  // Test for false to true
//test for updating the completed field
  test("Updating the completed field : ", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy medicine",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    
    const todoID = await agent.get("/todos").then((response) => {
      const parsedResponse1 = JSON.parse(response.text);
      return parsedResponse1[1]["id"];
    });

    // Testing for false to true
    const setCompletionResponse17 = await agent
      .put(`/todos/${todoID}`)
      .send({ completed: true, _csrf: csrfToken });
    const parsedUpdateResponse38 = JSON.parse(setCompletionResponse17.text);
    expect(parsedUpdateResponse38.completed).toBe(true);

    // Testing for true to false
    const setCompletionResponse21 = await agent
      .put(`/todos/${todoID}`)
      .send({ completed: false, _csrf: csrfToken });
    const parsedUpdateResponse29 = JSON.parse(setCompletionResponse21.text);
    expect(parsedUpdateResponse29.completed).toBe(false);
  });
  
 //Test to mark a todo as complete

  test("Todo mark as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Do the work",
      dueDate: new Date().toLocaleString("en-CA"),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    // const status = latestTodo.completed ? false : true;

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    console.log(latestTodo)
    const markAsCompleteresponse = await agent.put(`todos/${latestTodo["id"]}`).send({
      _csrf: csrfToken,
      // completed: status,
    });
    const parsedUpdateResponse = JSON.parse(markAsCompleteresponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });


  //Marking a todo as incomplete with the given id
  test("Marking a todo incomplete with the given ID ", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Testing Incomplete for WD",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponsee = JSON.parse(groupedTodosResponse.text);
    const completedItemsCount = parsedGroupedResponsee.completedItems.length;
    const latestTodoo = parsedGroupedResponsee.completedItems[completedItemsCount - 1];
    const completed = !latestTodoo.completed;
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponses = await agent
      .put(`/todos/${latestTodoo.id}`)
      .send({
        _csrf: csrfToken,
        completed: completed,
      });

    const parsedUpdateResponses = JSON.parse(markCompleteResponses.text);
    expect(parsedUpdateResponses.completed).toBe(false);
  });

 
  //Test to delete a todo using id
  test("Delete a todo using ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Done with the exams",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const gropuedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const response = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(response.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });


  
});