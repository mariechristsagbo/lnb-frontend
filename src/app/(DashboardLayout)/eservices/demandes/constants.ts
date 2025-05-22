export const REQUEST_OPTIONS = {
  leave: [
    { value: 'vacation', label: 'Congés payés' },
    { value: 'sickness', label: 'Maladie' },
    { value: 'training', label: 'Formation' }
  ],
  document: [
    { value: 'pay_slip', label: 'Fiche de paie' },
    { value: 'certificate', label: 'Attestation' }
  ],
  support: [
    { value: 'technical', label: 'Problème technique' },
    { value: 'access', label: "Demande d'accès" }
  ]
} as const;

export const STATUS_COLORS = {
  draft: 'gray',
  pending: 'yellow',
  in_review: 'blue',
  approved: 'emerald',
  rejected: 'red'
} as const;