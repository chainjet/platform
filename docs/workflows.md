# Workflows

### Overview

A workflow consists of a trigger and one or more actions. A trigger specifies when the workflow should be executed, and the actions determine what steps the workflow should perform. The workflow can be on-chain or off-chain. On-chain workflows are deployed as smart contracts, while off-chain workflows live on the ChainJet network.

### Triggers

A trigger specifies the condition on which the workflow will be executed. The condition can be a specific interval (e.g., every 6 hours), on-chain events (e.g., each time a token is transferred), or off-chain events (e.g., a Discord command). Every time the trigger condition is satisfied, the workflow actions will be executed.

### Actions

The workflow actions specify each individual task that should be performed. Workflow actions can be either on-chain (e.g., transfer tokens) or off-chain (e.g., send a Discord message).
