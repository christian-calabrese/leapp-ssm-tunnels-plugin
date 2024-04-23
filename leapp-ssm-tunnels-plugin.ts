import { Session } from '@noovolari/leapp-core/models/session';
import { AwsCredentialsPlugin } from '@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin';
import { PluginLogLevel } from '@noovolari/leapp-core/plugin-sdk/plugin-log-level';
import fs from 'fs';
import yaml from 'yaml';

export class SsmTunnelConfiguration {
  targetTagKey?: string;
  targetTagValue?: string;
  target?: string;
  host?: string;
  portNumber: string;
  localPortNumber: string;
}

export class SsmTunnelConfigurationsForRole {
  sessionName: string;
  configs: SsmTunnelConfiguration[];
}

export class LeappSsmTunnelsPlugin extends AwsCredentialsPlugin {
  get actionName(): string {
    return "Start SSM tunnels";
  }

  get actionIcon(): string {
    return "fas fa-archway";
  }

  static setConfig(data: any, region: string): any {
    return {
      region,
      accessKeyId: data.sessionToken.aws_access_key_id,
      secretAccessKey: data.sessionToken.aws_secret_access_key,
      sessionToken: data.sessionToken.aws_session_token,
    };
  }

  async getBastionIdFromTag(tagKey: string, tagValue: string, ssmClient: any, ec2Client: any): Promise<string> {
    let instanceId;
    let nextToken = null;
    let instances: any[] = [];

    try {
      do {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const params: any = { MaxResults: 50, NextToken: nextToken };
        if (!tagValue.includes('*')) {
          params.Filters = [{ Key: `tag:${tagKey}`, Values: [tagValue] }];
        }

        const describeInstanceResponse = await ssmClient.describeInstanceInformation(params).promise();
        instances = instances.concat(describeInstanceResponse.InstanceInformationList);
        nextToken = describeInstanceResponse.NextToken;
      } while (nextToken);

      // If tagValue contains *, use the ec2Client on the instances to get the tags as the ssmClient does not return them
      if (tagValue.includes('*')) {
        instances = instances.filter(async (instance: any) => {
          const { Tags } = await ec2Client.describeTags({ Filters: [{ Name: 'resource-id', Values: [instance.InstanceId] }] }).promise();
          return Tags && Tags.some((tag: any) => tag.Key === tagKey && tag.Value.includes(tagValue.replace('*', '')));
        });
      }

      if (instances.length === 1) {
        instanceId = instances[0].InstanceId;
      } else if (instances.length > 1) {
        this.pluginEnvironment.log(`Found multiple instances with the given tag and value (${tagKey}=${tagValue})`, PluginLogLevel.error, true);
        throw new Error(`Found multiple instances with the given tag (${tagKey})`);
      } else {
        this.pluginEnvironment.log(`Could not find any instance with the given tag and value (${tagKey}=${tagValue})`, PluginLogLevel.error, true);
        throw new Error(`Could not find any instance with the given tag (${tagKey})`);
      }

      return instanceId;
    } catch (err) {
      this.pluginEnvironment.log(err.message, PluginLogLevel.error, true);
    }
  }

  async getCommand(currConfiguration: SsmTunnelConfiguration, ssmClient: any, ec2Client: any, platform: string, session: any) {
    let command;
    if (currConfiguration.targetTagKey !== undefined && currConfiguration.targetTagValue !== undefined) {
      currConfiguration.target = await this.getBastionIdFromTag(currConfiguration.targetTagKey, currConfiguration.targetTagValue, ssmClient, ec2Client);
    }

    if (currConfiguration.target !== undefined) {
      if (currConfiguration.host !== undefined) {
        if (platform == "darwin") {
          command = `aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters " & quoted form of "host=[\\"${currConfiguration.host}\\"],portNumber=[\\"${currConfiguration.portNumber}\\"],localPortNumber=[\\"${currConfiguration.localPortNumber}\\"]" & "`;
        } else if (platform == "win32") {
          command = `aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters host="${currConfiguration.host}",portNumber="${currConfiguration.portNumber}",localPortNumber="${currConfiguration.localPortNumber}"`;
        } else {
          command = `aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters 'host=["${currConfiguration.host}"],portNumber=["${currConfiguration.portNumber}"],localPortNumber=["${currConfiguration.localPortNumber}"]'`;
        }
      } else {
        if (platform == "darwin") {
          command = `aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSession --parameters " & quoted form of "portNumber=[\\"${currConfiguration.portNumber}\\"],localPortNumber=[\\"${currConfiguration.localPortNumber}\\"]" & "`;
        } else if (platform == "win32") {
          command = `aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSession --parameters portNumber="${currConfiguration.portNumber}",localPortNumber="${currConfiguration.localPortNumber}"`;
        } else {
          command = `aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSession --parameters 'portNumber=["${currConfiguration.portNumber}"],localPortNumber=["${currConfiguration.localPortNumber}"]'`;
        }
      }
    }

    return command;
  }
  /*
     * @params
     * session       Session            my session object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts)
     * credentials   Credential-Info    my credentials object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/credentials-info.ts)
     */
  async applySessionAction(session: Session, credentials: any): Promise<void> {
    const os = require('os');
    const aws = require('aws-sdk');
    aws.config.update(LeappSsmTunnelsPlugin.setConfig(credentials, session.region));
    const ssmClient = new aws.SSM();
    const ec2Client = new aws.EC2();
    const platform = process.platform;
    const homeDir = os.homedir();
    let ssmPluginPath = homeDir + "/.Leapp/ssm-conf";
    let ssmConfig: SsmTunnelConfigurationsForRole[] = [];
    const parallelCommandsSeparator = platform == "win32" ? " | " : " & ";
    let errors = { json: false, yaml: false }
    let error_messages: string[] = []

    try {
      ssmConfig = JSON.parse(fs.readFileSync(`${ssmPluginPath}.json`, 'utf-8'));
    } catch (err) {
      errors.json = true
      error_messages.push(err.message)
    }

    try {
      ssmConfig = yaml.parse(fs.readFileSync(`${ssmPluginPath}.yaml`, 'utf-8'));
    } catch (err) {
      errors.yaml = true
      error_messages.push(err.message)
    }

    if (Object.values(errors).every(Boolean)) {
      this.pluginEnvironment.log(`No SSM tunnel configuration file found in ~/.Leapp/ssm-conf.json and ~/.Leapp/ssm-conf.yaml - Error ${error_messages.join('\n')}`, PluginLogLevel.error, true);
      return;
    }

    const configurationForRoleExists = ssmConfig.find(item => item.sessionName === session.sessionName);
    if (configurationForRoleExists !== undefined) {
      const env = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AWS_ACCESS_KEY_ID: credentials.sessionToken.aws_access_key_id,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AWS_SECRET_ACCESS_KEY: credentials.sessionToken.aws_secret_access_key,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AWS_SESSION_TOKEN: credentials.sessionToken.aws_session_token,
      };
      let currRoleConfiguration: SsmTunnelConfiguration[] = configurationForRoleExists.configs;
      let commands: string[] = []

      await Promise.all(currRoleConfiguration.map(async (currConfiguration) => {
        let currCommand = await this.getCommand(currConfiguration, ssmClient, ec2Client, platform, session)
        if (currCommand !== undefined) {
          commands.push(currCommand);
        }
      }));

      if (platform == "darwin" && commands.length > 0) {
        commands.push(`wait`);
      }

      if (commands.length > 0) {
        if (platform != "win32") {
          commands = [commands.join(parallelCommandsSeparator)];
        }
        await Promise.all(commands.map(async (command) => {
          this.pluginEnvironment.openTerminal(command, env)
        })).then(() => {
          this.pluginEnvironment.log("Terminal command successfully started", PluginLogLevel.info, true);
        })
          .catch((err) => {
            this.pluginEnvironment.log(`Error while opening tunnel: ${err.message}`, PluginLogLevel.error, true);
          });
      } else {
        this.pluginEnvironment.log(`No commands to execute`, PluginLogLevel.info, true);
      }
    }
    else {
      this.pluginEnvironment.log(`No SSM tunnel configuration found for session called ${session.sessionName}`, PluginLogLevel.error, true);
    }
  }
}
