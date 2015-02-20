# Description:
#   Interact with the Freight deploy service.
#
# Configuration:
#   HUBOT_FREIGHT_URL
#   HUBOT_FREIGHT_API_KEY
#
# Commands:
#   hubot deploy <app>:<revision> to <environment>

deployRevision = (msg) ->
  app = msg.match[1]
  ref = msg.match[3]
  env = msg.match[5]

  url = "#{process.env.HUBOT_FREIGHT_URL}/tasks/"

  data =
    ref: ref || undefined
    env: env || undefined
    user: msg.message.user.name
    app: app

  console.log("Freight: Making request to #{url}")

  msg.http(url)
    .header('Accept', 'application/json')
    .header('Authorization', "Key #{process.env.HUBOT_FREIGHT_API_KEY}")
    .header('Content-Type', 'application/json')
    .post(JSON.stringify(data)) (err, resp, body) ->
      if err
        msg.reply "Freight says: #{err}"
        console.error(err)
      else if 200 <= resp.statusCode < 400 # Or, not an error code.
        return
      else
        data = JSON.parse(body)
        msg.reply "Freight responded with HTTP #{resp.statusCode}: #{data.error}"
        console.error("HTTP #{resp.statusCode}: #{body}")

module.exports = (robot) ->
  robot.respond /deploy ([^\s\:]+)(\:([^\s]+))?( to ([^\s]+))?/i, (msg) ->
    deployRevision(msg)
