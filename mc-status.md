---
description: A tool to ping a Minecraft server based on the given address
---

# MC Status

{% api-method method="get" host="https://api.mugicon.net" path="/mc-status?address={address}&port={port}&timeout={timeout}" %}
{% api-method-summary %}
Ping
{% endapi-method-summary %}

{% api-method-description %}
This endpoint allows you to get free cakes.
{% endapi-method-description %}

{% api-method-spec %}
{% api-method-request %}
{% api-method-query-parameters %}
{% api-method-parameter name="address" type="string" required=true %}
The target server's address. Could be either a domain or IPv4 address.
{% endapi-method-parameter %}

{% api-method-parameter name="port" type="integer" required=false %}
The target server's port. Default is \`\`25565\`\` as it's the Minecraft server's default port.
{% endapi-method-parameter %}

{% api-method-parameter name="timeout" type="integer" %}
The connection's maximum timeout time in milliseconds. Greater than 5000 will cap at 5000. \(5 Seconds\)
{% endapi-method-parameter %}
{% endapi-method-query-parameters %}
{% endapi-method-request %}

{% api-method-response %}
{% api-method-response-example httpCode=200 %}
{% api-method-response-example-description %}
Successfully retrieved the Minecraft server's information
{% endapi-method-response-example-description %}

```
{    
   "code": 200,
   "message": "Success",
   "data": {
     "minecraft_version": "Server's Minecraft Version (Configurable in BungeeCord),
     "server_motd": "Server's MOTD in the plain text",
     "player_count": 10000,
     "max_player_count": 10000,
     "latency": 100
}
```
{% endapi-method-response-example %}

{% api-method-response-example httpCode=400 %}
{% api-method-response-example-description %}
The request 
{% endapi-method-response-example-description %}

```
{    "message": "Ain't no cake like that."}
```
{% endapi-method-response-example %}
{% endapi-method-response %}
{% endapi-method-spec %}
{% endapi-method %}



