export interface PlanConfig {
  key: string
  maxContacts: number
  maxOperations: number
  maxActiveWorkflows: number
  minPollingInterval: number
  maxTriggerItems: number
  features: {
    executeWorkflowOnError: boolean
  }
}

export const defaultPlan = 'free'

export const plansConfig: Record<string, PlanConfig> = {
  free: {
    key: 'free',
    maxContacts: 50,
    maxOperations: 3000,
    maxActiveWorkflows: 5,
    minPollingInterval: 60 * 15,
    maxTriggerItems: 50,
    features: {
      executeWorkflowOnError: false,
    },
  },
  prod_OPe3MZ5ynuDahA: {
    key: 'starter',
    maxContacts: 1000,
    maxOperations: 30000,
    maxActiveWorkflows: 20,
    minPollingInterval: 60,
    maxTriggerItems: Infinity,
    features: {
      executeWorkflowOnError: true,
    },
  },
  prod_NYGB1kY91pq5g6: {
    key: 'pro',
    maxContacts: 5000,
    maxOperations: 1e5,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 15,
    maxTriggerItems: Infinity,
    features: {
      executeWorkflowOnError: true,
    },
  },
  prod_NYGCd7KzrCjd7Y: {
    key: 'business',
    maxContacts: 20000,
    maxOperations: 5e5,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 15,
    maxTriggerItems: Infinity,
    features: {
      executeWorkflowOnError: true,
    },
  },
  unlimited: {
    key: 'unlimited',
    maxContacts: Infinity,
    maxOperations: Infinity,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 15,
    maxTriggerItems: Infinity,
    features: {
      executeWorkflowOnError: true,
    },
  },

  // these plans are deprecated
  prod_NYG90VSEfU0TfQ: {
    key: 'core',
    maxContacts: 50,
    maxOperations: 1e5,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 60,
    maxTriggerItems: Infinity,
    features: {
      executeWorkflowOnError: true,
    },
  },
}

// Plans on Stripe test mode
if (process.env.NODE_ENV === 'development') {
  // starter
  plansConfig['prod_NbsFKhWJ6PMBpx'] = plansConfig['prod_OPe3MZ5ynuDahA']
  delete plansConfig['prod_OPe3MZ5ynuDahA']
  // pro
  plansConfig['prod_NXsxne4WGLGVct'] = plansConfig['prod_NYGB1kY91pq5g6']
  delete plansConfig['prod_NYGB1kY91pq5g6']
  // business
  plansConfig['prod_NXsy6KRk62T4yx'] = plansConfig['prod_NYGCd7KzrCjd7Y']
  delete plansConfig['prod_NYGCd7KzrCjd7Y']
}
