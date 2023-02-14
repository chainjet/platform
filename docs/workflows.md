# Workflows

### Overview

A workflow consists of a trigger and one or more actions. The trigger specifies the event on which the actions should be executed, and the actions determine what tasks should be performed. The workflow can be on-chain or off-chain. On-chain workflows are deployed as smart contracts, while off-chain workflows live on the ChainJet network. We’re still working on on-chain workflows, so they aren’t publicly available yet.

### Triggers

A trigger specifies the event that will start the workflow. The event can be a specific interval (e.g., every 6 hours), on-chain events (e.g., each time a token is transferred), or off-chain events (e.g., a Discord command). Every time the trigger condition is satisfied, all the workflow actions will be executed.

### Actions

The workflow actions specify each individual task that should be performed. Workflow actions can be either on-chain (e.g., transfer tokens) or off-chain (e.g., send a Discord message).

### Workflows Settings

<figure><img src=".gitbook/assets/wfsettings.jpg" alt=""><figcaption></figcaption></figure>

_**"ON/OFF"**_&#x20;

Enable or disable a workflow. Enabled workflows will be looking for new events, and when found, they will trigger the workflow. Disabled workflows won’t be automatically started (although you can still manually trigger it).

_**"FORK"**_&#x20;

Forking a workflow allows you to create an exact copy of any workflow. When you click it, you will be presented with a modal to select the accounts that you want to use for the new workflow. If your workflow is set as public, then it can be forked by other users. This is a good way of sharing your workflow with the community. When the workflow is forked by other users, only the workflow data will be copied, but the user will have to enter their own account credentials for each integration.

_**"RUN HISTORY"**_&#x20;

<figure><img src=".gitbook/assets/wfhistory.png" alt=""><figcaption></figcaption></figure>

In this section, you will be able to check the entire history of your workflow, such as the last time it was executed, the number of times it was executed, whether it ran correctly or failed, the number of operations that were performed during execution, and a detail of the logs to which you can access and in case of failure you can check what the problem was.

_**"SETTINGS"**_&#x20;

<figure><img src=".gitbook/assets/settings.png" alt=""><figcaption></figcaption></figure>

_Workflow Name:_ Enter the name of your workflow.

_Max consecutive failures:_ After how many consecutive failed executions the workflow will be disabled. You can set it to zero to disable it.

_Run a workflow on failure:_ You can select one of your workflows to be executed each time a workflow fails. This is useful for receiving custom alerts on failures.

_**Danger settings:**_

_Change workflow privacy:_&#x20;

_Public_: Public workflows are accessible by anyone. However, only you will be able to make changes or execute it. Credentials associated with the workflow won’t be shared. Users can create copies of your workflow, but they have to use their own credentials.

_Private_: Only your wallet can access the workflow.

_Delete Workflow:_ Allows you to permanently delete the workflow. This action cannot be undone.
