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

var deployRevision = function(msg) {
  var app = msg.match[1];
  var ref = msg.match[3];
  var env = msg.match[5];

  var url = process.env.HUBOT_FREIGHT_URL + "/tasks/";

  var data = {
    ref: ref || undefined,
    env: env || undefined,
    user: msg.message.user.name,
    app: app
  };

  console.log("Freight: Making request to " + url);

  msg.http(url)
    .header("Accept", "application/json")
    .header("Authorization", "Key " + process.env.HUBOT_FREIGHT_API_KEY)
    .header("Content-Type", "application/json")
    .post(JSON.stringify(data), function(err, resp, body) {
      if (err) {
        msg.reply("Freight says: " + err);
        console.error(err);
      } else if (200 <= resp.statusCode < 400) {  // Or, not an error code.
        return;
      } else {
        var data = JSON.parse(body)
        msg.reply("Freight responded with HTTP " + resp.statusCode + ": " + data.error);
        console.error("HTTP " + resp.statusCode + ": " + body);
      }
    });
}

var cancelDeploy = function(msg) {
  var app = msg.match[1];
  var env = msg.match[2];
  var number = msg.match[3];

  var url = process.env.HUBOT_FREIGHT_URL + "/tasks/" + app + "/" + env + "/" + number + "/";

  var data = {
    status: "cancelled"
  };

  console.log("Freight: Making request to " + url)

  msg.http(url)
    .header("Accept", "application/json")
    .header("Authorization", "Key " + process.env.HUBOT_FREIGHT_API_KEY)
    .header("Content-Type", "application/json")
    .put(JSON.stringify(data), function(err, resp, body) {
      if (err) {
        msg.reply("Freight says: " + err);
        console.error(err);
      } else if (200 <= resp.statusCode < 400) {  // Or, not an error code.
        return;
      } else {
        var data = JSON.parse(body)
        msg.reply("Freight responded with HTTP " + resp.statusCode + ": " + data.error);
        console.error("HTTP " + resp.statusCode + ": " + body);
      }
    });
}

module.exports = function(robot) {
  robot.respond(/deploy ([^\s\:]+)(\:([^\s]+))?( to ([^\s]+))?/i, function(msg) {
    deployRevision(msg);
  });

  robot.respond(/cancel ([^\/]+)\/([^#]+)#(\d+)/i, function(msg) {
    cancelDeploy(msg);
  });
};
