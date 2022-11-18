import { Session } from "@noovolari/leapp-core/models/session";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { PluginLogLevel } from "@noovolari/leapp-core/plugin-sdk/plugin-log-level";

export class ExamplePlugin extends AwsCredentialsPlugin {
  get actionName(): string {
    return "Add a friendly name for your plugin action, eg. My first Plugin";
  }

  /*
   * Get your icon here: 
   * https://fontawesome.com/v5/search
   */
  get actionIcon(): string {
    return "Add a font awesome compatible icon tag, e.g. fa fa-globe";
  }

  /*
   * @params
   * session       Session            my session object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts)
   * credentials   Credential-Info    my credentials object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/credentials-info.ts)
   */
  async applySessionAction(session: Session, credentials: any): Promise<void> {

    /* Add your plugin code here... 
     *
     * You can also access this.pluginEnvironment which have 3 useful methods
     *
     * log("MESSAGE", PluginLogLevel, display?);
     * e.g. this.pluginEnvironment.log("Starting opening Web Console", PluginLogLevel.info, true);
     *
     * fetch("MYURL");
     * e.g. this.pluginEnvironment.fetch("https://www.google.it");
     *
     * openExternalUrl("MYURL");
     * e.g. this.plugin.pluginEnvironment.openExternalUrl("https://www.google.it");
     */
    
  }
}
