export interface PlanConfig {
  key: string
  maxOperations: number
  maxActiveWorkflows: number
  minPollingInterval: number
  features: {
    executeWorkflowOnError: boolean
  }
}

export const defaultPlan = 'free'

export const plansConfig: Record<string, PlanConfig> = {
  free: {
    key: 'free',
    maxOperations: 10000,
    maxActiveWorkflows: 5,
    minPollingInterval: 60 * 15,
    features: {
      executeWorkflowOnError: false,
    },
  },
  prod_NbsBYZA9BxFF7r: {
    key: 'starter',
    maxOperations: 30000,
    maxActiveWorkflows: 25,
    minPollingInterval: 60 * 5,
    features: {
      executeWorkflowOnError: true,
    },
  },
  prod_NYG90VSEfU0TfQ: {
    key: 'core',
    maxOperations: 1e5,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 60,
    features: {
      executeWorkflowOnError: true,
    },
  },
  prod_NYGB1kY91pq5g6: {
    key: 'pro',
    maxOperations: 3e5,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 15,
    features: {
      executeWorkflowOnError: true,
    },
  },
  prod_NYGCd7KzrCjd7Y: {
    key: 'business',
    maxOperations: 750000,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 15,
    features: {
      executeWorkflowOnError: true,
    },
  },
  unlimited: {
    key: 'unlimited',
    maxOperations: Infinity,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 15,
    features: {
      executeWorkflowOnError: true,
    },
  },
  early: {
    key: 'early',
    maxOperations: Infinity,
    maxActiveWorkflows: Infinity,
    minPollingInterval: 60,
    features: {
      executeWorkflowOnError: true,
    },
  },
}

// Plans on Stripe test mode
if (process.env.NODE_ENV === 'development') {
  // starter
  plansConfig['prod_NbsFKhWJ6PMBpx'] = plansConfig['prod_NbsBYZA9BxFF7r']
  delete plansConfig['prod_NbsBYZA9BxFF7r']
  // core
  plansConfig['prod_NXQOvZowLlwuaH'] = plansConfig['prod_NYG90VSEfU0TfQ']
  delete plansConfig['prod_NYG90VSEfU0TfQ']
  // pro
  plansConfig['prod_NXsxne4WGLGVct'] = plansConfig['prod_NYGB1kY91pq5g6']
  delete plansConfig['prod_NYGB1kY91pq5g6']
  // business
  plansConfig['prod_NXsy6KRk62T4yx'] = plansConfig['prod_NYGCd7KzrCjd7Y']
  delete plansConfig['prod_NYGCd7KzrCjd7Y']
}
