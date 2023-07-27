<p align="center">
  <img src="https://github.com/Noovolari/leapp/blob/master/.github/images/README-1.png#gh-dark-mode-only" alt="Leapp" height="150" />
    <img src="https://github.com/Noovolari/leapp/blob/master/.github/images/README-1-dark.png#gh-light-mode-only" alt="Leapp" height="150" />
</p>

# Leapp SSM Tunnels Plugin

## Introduction
This plugin simplifies the process of accessing private resources in AWS accounts by providing a one-click solution for developers and AWS users.

## How it works
The plugin uses the `aws ssm start-session` command to create secure and controlled connections to public and private AWS resources, such as EC2 instances. It leverages a specific feature of SSM Session Manager for remote port forwarding, allowing a managed instance to act as a "jump host" to securely connect to application ports on remote servers without exposing them to the outside network. Learn more about this feature in the [AWS announcement](https://aws.amazon.com/it/about-aws/whats-new/2022/05/aws-systems-manager-support-port-forwarding-remote-hosts-using-session-manager/).


## Configuring tunnels
The plugin uses a JSON (`ssm-conf.json`) or YAML (`ssm-conf.yaml`) configuration file to specify the parameters needed to establish tunnels. Example files can be found in this repository as `ssm-conf.json.example` and `ssm-conf.yaml.example`.

Create your configuration file and place it in the Leapp installation folder, for example: `Users/leappuser/.Leapp/ssm-conf.json`.

### JSON configuration example
```json
[
  {
    "sessionName": "session1",
    "configs": [
      {
        "target": "i-0221y321bde21hi72",
        "host": "account1-db.eu-south-1.rds.amazonaws.com",
        "portNumber": "5432",
        "localPortNumber": "3333"
      },
      {
        "target": "i-0221y321bde21hi72",
        "host": "vpc-elasticsearch-es-xxxxxxxxxxxxxxx.eu-south-1.es.amazonaws.com",
        "portNumber": "443",
        "localPortNumber": "9090"
      },
      {
        "target": "i-0221y321bde21hi72",
        "portNumber": "3389",
        "localPortNumber": "33890"
      },
      {
        "targetTagKey": "Name",
        "targetTagValue": "bastion",
        "portNumber": "22",
        "localPortNumber": "2222"
      }
    ] 
  },
  {
    "sessionName": "session2",
    "configs": [
      {
        "targetTagKey": "Name",
        "targetTagValue": "bastion",
        "host": "account2-db.us-east-1.rds.amazonaws.com",
        "portNumber": "5432",
        "localPortNumber": "3333"
      }
    ] 
  }
]
```

### YAML configuration example
```yaml
---
- sessionName: session1
  configs:
  - target: i-0221y321bde21hi72
    host: account1-db.eu-south-1.rds.amazonaws.com
    portNumber: '5432'
    localPortNumber: '3333'
  - target: i-0221y321bde21hi72
    host: vpc-elasticsearch-es-xxxxxxxxxxxxxxx.eu-south-1.es.amazonaws.com
    portNumber: '443'
    localPortNumber: '9090'
  - target: i-0221y321bde21hi72 
    portNumber: '3389'
    localPortNumber: '33890'
  - targetTagKey: Name
    targetTagValue: bastion
    portNumber: '22'
    localPortNumber: '2222'
- sessionName: session2
  configs:
  - targetTagKey: Name
    targetTagValue: bastion
    host: account2-db.us-east-1.rds.amazonaws.com
    portNumber: '5432'
    localPortNumber: '3333'
```

You can identify the target EC2 instance used as a bastion by specifying a targetTagKey and targetTagValue that your instance is tagged with.

Moreover, the `host` key is now optional. If not provided, the plugin will use the SSM document "AWS-StartPortForwardingSession" instead of "AWS-StartPortForwardingSessionToRemoteHost". This allows, for example, to expose a private webserver hosted on a single EC2 instance, or allow RDP access without having to specify the instance IP address.

## Plugin in action
To install and use this plugin, follow the [Leapp plugins introduction documentation](https://docs.leapp.cloud/0.16.2/plugins/plugins-introduction/). The npm package name for this plugin is `leapp-ssm-tunnels-plugin`.

<img src="how_to_use.jpg">