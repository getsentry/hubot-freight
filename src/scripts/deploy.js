// Description:
//   Interact with the Freight deploy service.
//
// Configuration:
//   HUBOT_FREIGHT_URL
//   HUBOT_FREIGHT_API_KEY
//
// Commands:
//   hubot deploy <app>:<revision> to <environment>
//   hubot cancel <app>/<env>#<number>
//   hubot rollback <app>/<env>

var apiRequest = function(msg, path, method, data) {
  var url = process.env.HUBOT_FREIGHT_URL + path
  var body = JSON.stringify(data || {});

  var req = msg.http(url)
    .header("Accept", "application/json")
    .header("Authorization", "Key " + process.env.HUBOT_FREIGHT_API_KEY)
    .header("Content-Type", "application/json");

  console.log("Freight: Making request to %s with params %j", url, data);
  return req[method.toLowerCase()](body)(function(err, resp, body) {
      if (err) {
        msg.reply("Freight says: " + err);
        console.error('HTTP %d: %s', resp.statusCode, err);
      } else if (200 <= resp.statusCode && resp.statusCode < 400) {
        return;
      } else {
        var data = JSON.parse(body);
        msg.reply("Freight responded with HTTP " + resp.statusCode + ": " + data.error);
        console.error("HTTP %d: %s", resp.statusCode, body);
      }
    });
};

var deployRevision = function(msg) {
  var app = msg.match[1];
  var ref = msg.match[3];
  var env = msg.match[5];

  var data = {
    ref: ref || undefined,
    env: env || undefined,
    user: msg.message.user.name,
    app: app
  };

  apiRequest(msg, "/tasks/", "POST", data);
};

var rollbackDeploy = function(msg) {
  var app = msg.match[1];
  var env = msg.match[3];

  var data = {
    ref: ':previous',
    env: env || undefined,
    user: msg.message.user.name,
    app: app
  };

  apiRequest(msg, "/tasks/", "POST", data);
};

var cancelDeploy = function(msg) {
  var app = msg.match[1];
  var env = msg.match[2];
  var number = msg.match[3];

  var data = {
    status: "cancelled"
  };

  apiRequest(msg, "/tasks/" + app + "/" + env + "/" + number + "/", "PUT", data);
};

module.exports = function(robot) {
  robot.respond(/deploy ([^\s\:\/]+)(\:([^\s]+))?( to ([^\s]+))?/i, function(msg) {
    deployRevision(msg);
  });

  robot.respond(/rollback ([^\/]+)(\/([^\s]+))?/i, function(msg) {
    rollbackDeploy(msg);
  });

  robot.respond(/cancel ([^\/]+)\/([^#]+)#(\d+)/i, function(msg) {
    cancelDeploy(msg);
  });
};
