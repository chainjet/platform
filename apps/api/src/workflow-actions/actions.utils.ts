import { WorkflowAction } from './entities/workflow-action'

/**
 * Sort the action tree using pre-order traversal.
 * All the dependencies of an action will always be early in the list.
 */
export function sortActionTree(
  actions: WorkflowAction[],
  rootAction?: WorkflowAction,
  visited = new Set<string>(),
): WorkflowAction[] {
  if (!rootAction) {
    rootAction = actions.find((action) => action.isRootAction)
  }
  if (!rootAction) {
    return []
  }
  if (visited.has(rootAction.id)) {
    return []
  }
  visited.add(rootAction.id)
  const nextActions = rootAction.nextActions
    .map((actionId) => actions.find((action) => action.id === actionId.action.toString()))
    .filter((action) => !!action) as WorkflowAction[]
  const orderedActions = [rootAction]
  for (const nextAction of nextActions) {
    orderedActions.push(...sortActionTree(actions, nextAction, visited))
  }
  return orderedActions
}
