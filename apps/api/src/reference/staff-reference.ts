/**
 * Banks a Nigerian staff member is likely to be paid into: commercial banks
 * plus the microfinance banks and fintechs now common for salaries. Heritage
 * Bank is left out — the CBN revoked its licence in June 2024.
 *
 * Reviewed September 2026. Banks merge and lose licences; if a staff member's
 * bank is missing, add it here — the form offers exactly this list and the API
 * accepts exactly this list.
 */
export const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Microfinance Bank",
  "Lotus Bank",
  "Moniepoint Microfinance Bank",
  "OPay",
  "Optimus Bank",
  "PalmPay",
  "Parallex Bank",
  "Polaris Bank",
  "PremiumTrust Bank",
  "Providus Bank",
  "Signature Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "TAJBank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
] as const;

export const NEXT_OF_KIN_RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Child", "Other relative", "Friend"] as const;
