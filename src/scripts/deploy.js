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

var isAuthorized = function(robot, user, app, ref, env, action) {
    if (robot.auth.hasRole === undefined) {
        return true;  // hubot-auth not installed
    };
    // todo: add support for more granular permissions
    return robot.auth.hasRole(user,'freight:admin');
};

var authError = function(msg) {
    msg.reply("Sorry, I won't take any order from you.");
    console.error('Freight: user %s is not authorized to perform this aciton', msg.envelope.user);
};

var deployRevision = function(msg, robot) {
  var app = msg.match[1];
  var ref = msg.match[3];
  var env = msg.match[5];

  if (!isAuthorized(robot, msg.envelope.user, app, ref, env, 'deploy')) {
    authError(msg);
    return;
  };

  var data = {
    ref: ref || undefined,
    env: env || undefined,
    user: msg.message.user.name,
    app: app
  };

  apiRequest(msg, "/tasks/", "POST", data);
};

var rollbackDeploy = function(msg, robot) {
  var app = msg.match[1];
  var env = msg.match[3];

  if (!isAuthorized(robot, msg.envelope.user, app, null, env, 'rollback')) {
    authError(msg);
    return;
  };

  var data = {
    ref: ':previous',
    env: env || undefined,
    user: msg.message.user.name,
    app: app
  };

  apiRequest(msg, "/tasks/", "POST", data);
};

var cancelDeploy = function(msg, robot) {
  var app = msg.match[1];
  var env = msg.match[2];
  var number = msg.match[3];

  if (!isAuthorized(robot, msg.envelope.user, app, null, env, 'cancel')) {
    authError(msg);
    return;
  };

  var data = {
    status: "cancelled"
  };

  apiRequest(msg, "/tasks/" + app + "/" + env + "/" + number + "/", "PUT", data);
};

module.exports = function(robot) {
  robot.respond(/deploy ([^\s\:\/]+)(\:([^\s]+))?( to ([^\s]+))?/i, function(msg) {
    deployRevision(msg, robot);
  });

  robot.respond(/rollback ([^\/]+)(\/([^\s]+))?/i, function(msg) {
    rollbackDeploy(msg, robot);
  });

  robot.respond(/cancel ([^\/]+)\/([^#]+)#(\d+)/i, function(msg) {
    cancelDeploy(msg, robot);
  });
};
