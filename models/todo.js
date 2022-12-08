"use strict";
const { Model, where } = require("sequelize");
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    setCompletionStatus() {
      return this.update({
        completed: !this.completed,
      });
    }

    static getTodos() {
      const todos = Todo.findAll({
        order: [["id", "ASC"]],
      });
      return todos;
    }

    static getOverdueItems() {
      const overdueItems = Todo.findAll({
        where: {
          dueDate: { [Op.lt]: new Date() },
          completed: { [Op.eq]: false },
        },
        order: [["id", "ASC"]],
      });

      return overdueItems;
    }

    static getDueTodayItems() {
      const dueTodayItems = Todo.findAll({
        where: {
          dueDate: new Date(),
          completed: { [Op.eq]: false },
        },
        order: [["id", "ASC"]],
      });

      return dueTodayItems;
    }

    static getDueLaterItems() {
      const dueLaterItems = Todo.findAll({
        where: {
          dueDate: { [Op.gt]: new Date() },
          completed: { [Op.eq]: false },
        },
        order: [["id", "ASC"]],
      });

      return dueLaterItems;
    }

    deleteTodo() {
      return this.destroy({
        where: {
          id: this.id,
        },
      });
    }

    static getCompletedTodos() {
      return this.findAll({
        where: { completed: { [Op.eq]: true } },
        order: [["id", "DESC"]],
      });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
