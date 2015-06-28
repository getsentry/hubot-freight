var Path = require('path');

module.exports = function(robot, scripts) {
  robot.loadFile(Path.resolve(__dirname, "src", "scripts"), "deploy.js");
};
