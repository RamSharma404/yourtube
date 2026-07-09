export const PLAN_DETAILS = {
  Free: { name: "Free", amount: 0, watchLimitSeconds: 300, isPremium: false },
  Bronze: { name: "Bronze", amount: 1000, watchLimitSeconds: 420, isPremium: true },
  Silver: { name: "Silver", amount: 5000, watchLimitSeconds: 600, isPremium: true },
  Gold: { name: "Gold", amount: 10000, watchLimitSeconds: null, isPremium: true },
};

export const getPlanDetails = (plan = "Free") => PLAN_DETAILS[plan] || PLAN_DETAILS.Free;

export const isPremiumActive = (user) => {
  if (!user?.isPremium) return false;
  if (!user.premiumExpiry) return true;
  return new Date(user.premiumExpiry).getTime() > Date.now();
};

export const applyPlanToUser = (user, planName = "Free") => {
  const plan = getPlanDetails(planName);
  user.plan = plan.name;
  user.isPremium = plan.isPremium;
  user.planWatchLimitSeconds = plan.watchLimitSeconds ?? null;

  if (!plan.isPremium) {
    user.premiumExpiry = null;
  }

  return user;
};
