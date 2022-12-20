import { Session } from "@noovolari/leapp-core/models/session";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { PluginLogLevel } from "@noovolari/leapp-core/plugin-sdk/plugin-log-level";
import fs from 'fs'

export class SsmTunnelConfiguration {
  target: string;
  host: string;
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

  /*
   * @params
   * session       Session            my session object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts)
   * credentials   Credential-Info    my credentials object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/credentials-info.ts)
   */
  async applySessionAction(session: Session, credentials: any): Promise<void> {
    const os = require('os');
    const platform = process.platform;
    const homeDir = os.homedir();
    let ssmPluginPath = homeDir + "/.Leapp/ssm-conf.json";
    let ssmConfig: SsmTunnelConfigurationsForRole[] = [];
    const parallelCommandsSeparator = platform == "win32" ? " | " : " & ";

    try {
      ssmConfig = JSON.parse(fs.readFileSync(ssmPluginPath, 'utf-8'));
    } catch {
      this.pluginEnvironment.log(`No SSM tunnel configuration file found in ~/.Leapp/ssm-conf.json`, PluginLogLevel.error, true);
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
      currRoleConfiguration.forEach(currConfiguration => {
        if (platform == "darwin") {
          commands.push(`aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters " & quoted form of "host=[\\"${currConfiguration.host}\\"],portNumber=[\\"${currConfiguration.portNumber}\\"],localPortNumber=[\\"${currConfiguration.localPortNumber}\\"]" & "`);
        } else {
          commands.push(`aws ssm start-session --region ${session.region} --target ${currConfiguration.target} --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters 'host=["${currConfiguration.host}"],portNumber=["${currConfiguration.portNumber}"],localPortNumber=["${currConfiguration.localPortNumber}"]'`);
        }
      });
      if (platform == "darwin") {
        commands.push(`wait`);
      }
      let command = commands.join(parallelCommandsSeparator);

      this.pluginEnvironment.openTerminal(command, env)
      .then(() => {
        this.pluginEnvironment.log("Terminal command successfully started", PluginLogLevel.info, true);
      })
      .catch((err) => {
        this.pluginEnvironment.log(`Error while opening tunnel: ${err.message}`, PluginLogLevel.error, true);
      });
    }
    else {
      this.pluginEnvironment.log(`No SSM tunnel configuration found for session called ${session.sessionName}`, PluginLogLevel.error, true);
    }
  }
}
