<p align="center">
  <img src="https://github.com/Noovolari/leapp/blob/master/.github/images/README-1.png#gh-dark-mode-only" alt="Leapp" height="150" />
    <img src="https://github.com/Noovolari/leapp/blob/master/.github/images/README-1-dark.png#gh-light-mode-only" alt="Leapp" height="150" />
</p>

<h1 align="center">Leapp</h1>

<h4 align="center">
  <a href="https://www.leapp.cloud">Website</a> |
  <a href="https://roadmap.leapp.cloud/tabs/4-in-progress">Roadmap</a> |
  <a href="https://medium.com/leapp-cloud">Blog</a> |
  <a href="https://join.slack.com/t/noovolari/shared_invite/zt-opn8q98k-HDZfpJ2_2U3RdTnN~u_B~Q">Slack</a> |
  <a href="https://docs.leapp.cloud">Documentation</a> |
  <a href="https://docs.leapp.cloud/latest/troubleshooting/app-data/">Troubleshooting</a>

</h4>

<p align="center">
  <a href="https://lgtm.com/projects/g/Noovolari/leapp/context:javascript"><img src="https://img.shields.io/lgtm/grade/javascript/g/Noovolari/leapp.svg?logo=lgtm&logoWidth=18" alt="Javascript"></a>
  <a href="https://github.com/Noovolari/leapp/blob/master/LICENSE"><img alt="License" src="https://img.shields.io/github/license/noovolari/leapp"></a>
  <a href="https://join.slack.com/t/noovolari/shared_invite/zt-opn8q98k-HDZfpJ2_2U3RdTnN~u_B~Q"><img src="https://img.shields.io/badge/slack-online-green" alt="Slack"></a>
</p>

<p align="center">⚡ Lightning Fast, Safe, Desktop App for Cloud credentials managing and generation</p>

[**Leapp**](https://github.com/noovolari/leapp) is a Cross-Platform Cloud access App, built on top of [Electron](https://github.com/electron/electron).

[The App](https://github.com/noovolari/leapp) is designed to **manage and secure Cloud Access in multi-account environments,** and it is available for MacOS, Windows, and Linux.

# How to build a plugin For Leapp

This README covers all the steps required to build a simple plugin for [Leapp](https://github.com/noovolari/leapp). 
If you are in a rush, you can jump directly to the [build](https://github.com/Noovolari/leapp-plugin-template/blob/main/README.md#4-create-your-first-plugin) section!

### 1. Copy the template

Just click the green button above ⬆️ or [use this quicklink](https://github.com/Noovolari/leapp-plugin-template/generate). This action **will fork the repository** and gives you a **ready-to-use** template project for creating a new plugin.

### 2. Install the project locally

Just **clone the forked repository** and use 

```npm install```

You are ready to go.

### 3. Configuring your new Plugin

Inside the project folder you will find 3 configuration file *but you need to edit ony* **package.json**:

**PACKAGE.JSON overview of metadata**:

```json
{
  "name": "<YOUR-PLUGIN-NAME-IN-SNAKE-CASE>", // Must be unique on npm and can contain your organization name as well
  "author": "<YOU-OR-YOUR-ORGANIZATION>", // The author of this plugin
  "version": "1.0.0", // Any Semver Value is ok, be sure to always use a value > of the one on your npm repository
  "description": "<YOUR-AWESOME-PLUGIN-DESCRIPTION>", // Describe your plugin
  "keywords": [
    "leapp-plugin", // THIS IS MANDATORY!!!!
    "AWS" // Any other meaningful tag
    ...
  ],
  "leappPlugin": {
    "supportedOS": [
      "mac", "win", "linux" // You can insert one, two or all the values, you can also leave this tag blank to include all OSs
    ],
    "supportedSessions": [
      "awsIamRoleFederated", // Possible values are: any, aws, azure, awsIamRoleFederated, awsIamRoleChained, awsSsoRole, awsIamUser
      "awsIamRoleChained",
      "awsSsoRole"
      ...
    ]
  },
  ...
}
```

> Remember: `"keywords": [ "leapp-plugin" ]` is **Mandatory** to allow Leapp to recognize the plugin!

### 4. Create your first plugin!

> The base objects needed to create your plugin are implemented in the [here](https://github.com/Noovolari/leapp/tree/master/packages/core/src/plugin-sdk), in the [Leapp repository](https://github.com/Noovolari/leapp).

#### plugin-index.ts

**plugin-index.ts** is the **entry point** for your plugin! Open `plugin-index.ts` and export a class for your plugin.
The exported class is implemented in a different file. You can see a real example below.

> E.g. `export { WebConsolePlugin } from "./web-console-plugin";`. We are declaring **WebConsolePlugin** as our plugin class.

You are done with `plugin-index.ts`.

#### plugin-class.ts (web-console-plugin.ts in our example)

Create a new **TypeScript class** and **extend** `AwsCredentialsPlugin`.

> There will be different kinds of plugins. AwsCredentialsPlugin is the first plugin available, so we're going to focus on that. 
> The AwsCredentialsPlugin abstract class is defined in the [plugin-sdk folder of the Leapp Core](https://github.com/Noovolari/leapp/tree/master/packages/core/src/plugin-sdk). 
> You don't have to re-implement it from scratch, as the leapp-core npm package is a dependency of the provided plugin template.

```javascript 
export class WebConsolePlugin extends AwsCredentialsPlugin { ... }
```

> Note: `AwsCredentialsPlugin` is a **class from Leapp** that gives you **access to temporary credentials for a given session**.

Add the following **3 imports** (usually the editor will do this step for you):

```javascript
import { Session } from "@noovolari/leapp-core/models/session";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { PluginLogLevel } from "@noovolari/leapp-core/plugin-sdk/plugin-log-level";
```

**Inside the class** you define **2 properties** (actionName, actionIcon) and **1 method** (applySessionAction); it's as simple as that! Let's see:

```javascript
get actionName(): string {
  return "Open web console"; // Friendly Name of your plugin: will be used to show the action in the Leapp Menu and Leapp plugin List
}

get actionIcon(): string {
  return "fa fa-globe"; // An icon for your plugin! Currently compatible with Font-Awesome 5+ icon tags.
}
```
> [Here](https://fontawesome.com/v5/search) you can find a list of compatible icons!

Now the main dish: the **action method**! Leapp will use this method to execute an action based on a session's temporary credentials set, in this case will use them to generate a link shortcut to open AWS web console for that specific session's role.

```javascript
async applySessionAction(session: Session, credentials: any): Promise<void> { ... }
```

As you can see, the applySessionAction method signature contains both a session and a credentials parameters.
The credentials parameter is specific to the AwsCredentialsPlugin type; other plugin types could expect other parameters
in addition to the session one, which contains Leapp Session metadata.

In the applySessionAction method you have access to **3 important variables**:

- [session](https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts) 
   Leapp session the user clicked on, or selected in the Leapp CLI.
   ```javascript
   export class Session {
    sessionId: string;
    status: SessionStatus;
    startDateTime?: string;
    type: SessionType;
    sessionTokenExpiration: string;

    constructor(public sessionName: string, public region: string) {
      this.sessionId = uuid.v4();
      this.status = SessionStatus.inactive;
      this.startDateTime = undefined;
    }

    expired(): boolean {
      if (this.startDateTime === undefined) {
        return false;
      }
      const currentTime = new Date().getTime();
      const startTime = new Date(this.startDateTime).getTime();
      return (currentTime - startTime) / 1000 > constants.sessionDuration;
    }
  }
   ```
- [credentials](https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/credentials-info.ts)
  Credentials set for the session.
  ```javascript
  export interface CredentialsInfo {
    sessionToken: {
      aws_access_key_id: string;
      aws_secret_access_key: string;
      aws_session_token: string;
      region: string;
    }
  }
  ```
- [pluginEnvironment](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/plugin-environment.ts)
  A set of methods to help you develop your plugin:
  
  - **`log`**`(message: string, level: PluginLogLevel, display: boolean): void`
    Log a custom message in Leapp or in the log file

    | argument | type      | description |
    | -------- | --------- | ----------- |
    | message  | string    | the message to show  |
    | level    | [LogLevel](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/plugin-log-level.ts) | severity of the message |
    | display  | boolean   | shows the message in a toast in the desktop app when true. Otherwise, log it in the log files |

  - **`fetch`**`(url: string): any`
    Retrieve the content of an URL. Returns a promise for the URL

    | argument | type.  |  description |
    | -------- | ------ | ------------ |
    | url      | string | a valid HTTP URL to fetch from |

  - **`openExternalUrl`**`(url: string): void`
    Open an external URL in the default browser

    | argument | type     | description |
    | -------- | -------- | ----------- |
    | url      | string   | a valid HTTP URL to open in the default browser |

  - **`getProfileIdByName`**`(profileName: string): string`

    Return the ID of a NamedProfile from the given name if it exists, otherwise creates a new named profile and returns its ID.

    Can be used when creating/editing a session since SessionData requires the ID of a named profile.

    | argument    | type    | description |
    | ----------- | ------- | ----------- |
    | profileName | string  | the name of the NamedProfile I want to retrieve |

  - **`getIdpUrlIdByUrl`**`(url: string): string`

    Return the ID of the IdpUrl object from the given URL if it exists, otherwise creates a new IdP URL and returns its ID.

    Can be used when creating/editing Federated Sessions since SessionData requires the ID of an IdP URL.

    | argument | type   | description |
    | -------- | ------ | ----------- |
    | url      | string | the URL associated with the IdpUrl I want to retrieve |

  - **`openTerminal`**`(command: string, env?: any): string`

    Execute the given command in the platform-specific terminal; optionally, it is possible to set an env key/value object containing the env variables to export in the terminal, before the command execution.

    The terminal window base path is set to the home directory.
  
    | argument | type   | description |
    |--------| ------ | ----------- |
    | command  | string | the command that I want to execute in the platform-specific terminal |
    | env      | any    | optional key/value env variables object |

  - **`createSession`**`(createSessionData: SessionData): Promise<string>`

    Create a new Leapp Session from the createSessionData parameter. The type of its argument is SessionData. In particular, SessionData is an abstract class that contains Leapp Session metadata. 
  
    You have to pass a concrete implementation of the SessionData abstract clas to createSession. Available concrete implementations are: [AwsIamUserSessionData](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/interfaces/aws-iam-user-session-data.ts), [AwsIamRoleFederatedSessionData](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/interfaces/aws-iam-role-federated-session-data.ts), or [AwsIamRoleChainedSessionData](https://github.com/Noovolari/leapp/blob/master/packages/core/src/plugin-sdk/interfaces/aws-iam-role-chained-session-data.ts).

    | argument           | type        | description |
    | ------------------ | ----------- | ----------- |
    | createSessionData  | SessionData | the metadata used to create the Leapp Session |

  - **`cloneSession`**`(session: Session): Promise<string>`

    This method allows you to clone the given Leapp Session. This operation is allowed for the following Leapp Session types:

    - AwsIamUserSession
    - AwsIamRoleFederatedSession
    - AwsIamRoleChainedSession

    | argument | type    | description |
    | -------- | ------- | ----------- |
    | session  | Session | the Leapp Session that I want to clone |

  - **`updateSession`**`(updateSessionData: SessionData, session: Session): Promise<void>`

    This method allows you to update the given session with the given updateSessionData. This operation is allowed for the following Leapp Session types:

    - AwsIamUserSession
    - AwsIamRoleFederatedSession
    - AwsIamRoleChainedSession

    | argument          | type        | description |
    | ----------------- | ----------- | ----------- |
    | updateSessionData | SessionData | the metadata used to update the given Leapp Session |
    | session           | Session     | the Leapp Session that I want to update |
    
Finally you can find the complete code reference for our example plugin [here](https://github.com/Noovolari/leapp-plugin-template/blob/main/example-plugin.ts).

### Build and publish!

#### Build plugin.js

Use `npm run build`. A complete project will be created inside the root folder. 

> Note: you can **test your plugin** before submission, by **copying** the output folder of `npm run build` inside `~/.Leapp/plugins/`.

#### Publish your plugin

- **Login to npm** (you need to be registered on npm as a user or an organization) using `npm login` in the ```<project-root>/<plugin-name>``` folder generated by the command `npm run build`, which has the same name as the one declared in the **package.json**.
- **Publish** the plugin with `npm publish --access public`.

### Examples

You can find examples of plugins for Leapp in the dedicated [section](https://docs.leapp.cloud/latest/plugins/plugins-development#plugin-examples) of our documentation.

### Final notes

If you want a more detailed explanation of the plugin system please go to the [dedicated section](https://docs.leapp.cloud/latest/plugins/plugins-introduction) in  our documentation.
