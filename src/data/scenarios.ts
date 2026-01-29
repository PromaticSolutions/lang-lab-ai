import { Scenario, PlanType } from '@/types';

// Scenario IDs that map to translation keys
export const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    titleKey: 'scenarios.restaurant.title',
    descriptionKey: 'scenarios.restaurant.description',
    icon: '🍽️',
    color: 'from-orange-400 to-red-500',
    requiredPlan: ['pro', 'fluency_plus'],
    difficulty: 'basic',
  },
  {
    id: 'interview',
    titleKey: 'scenarios.interview.title',
    descriptionKey: 'scenarios.interview.description',
    icon: '💼',
    color: 'from-blue-400 to-indigo-500',
    requiredPlan: ['free_trial', 'beginner', 'pro', 'fluency_plus'],
    difficulty: 'intermediate',
  },
  {
    id: 'airport',
    titleKey: 'scenarios.airport.title',
    descriptionKey: 'scenarios.airport.description',
    icon: '✈️',
    color: 'from-sky-400 to-blue-500',
    requiredPlan: ['pro', 'fluency_plus'],
    difficulty: 'intermediate',
  },
  {
    id: 'hotel',
    titleKey: 'scenarios.hotel.title',
    descriptionKey: 'scenarios.hotel.description',
    icon: '🏨',
    color: 'from-purple-400 to-pink-500',
    requiredPlan: ['free_trial', 'beginner', 'pro', 'fluency_plus'],
    difficulty: 'basic',
  },
  {
    id: 'shopping',
    titleKey: 'scenarios.shopping.title',
    descriptionKey: 'scenarios.shopping.description',
    icon: '🛍️',
    color: 'from-pink-400 to-rose-500',
    requiredPlan: ['beginner', 'pro', 'fluency_plus'],
    difficulty: 'basic',
  },
  {
    id: 'business',
    titleKey: 'scenarios.business.title',
    descriptionKey: 'scenarios.business.description',
    icon: '📊',
    color: 'from-emerald-400 to-teal-500',
    requiredPlan: ['fluency_plus'],
    difficulty: 'advanced',
  },
  {
    id: 'hospital',
    titleKey: 'scenarios.hospital.title',
    descriptionKey: 'scenarios.hospital.description',
    icon: '🏥',
    color: 'from-red-400 to-pink-500',
    requiredPlan: ['beginner', 'pro', 'fluency_plus'],
    difficulty: 'intermediate',
  },
  {
    id: 'transport',
    titleKey: 'scenarios.transport.title',
    descriptionKey: 'scenarios.transport.description',
    icon: '🚗',
    color: 'from-gray-600 to-gray-800',
    requiredPlan: ['beginner', 'pro', 'fluency_plus'],
    difficulty: 'basic',
  },
];

export const getAvailableScenarios = (plan: PlanType): Scenario[] => {
  return scenarios.filter(scenario => scenario.requiredPlan.includes(plan));
};

export const isScenarioLocked = (scenario: Scenario, plan: PlanType): boolean => {
  return !scenario.requiredPlan.includes(plan);
};
