export interface PlanConfig {
  name: string
  maxOperations: number
}

export const defaultPlan = 'early' // TODO make free plan the default

export const plansConfig: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    maxOperations: 10000,
  },
  // TODO
  stripe_plan_id_1: {
    name: 'Starter',
    maxOperations: 1e5,
  },
  // TODO
  stripe_plan_id_2: {
    name: 'Pro',
    maxOperations: 3e5,
  },
  internal: {
    name: 'Internal',
    maxOperations: Infinity,
  },
  early: {
    name: 'Early Access',
    maxOperations: Infinity,
  },
}
