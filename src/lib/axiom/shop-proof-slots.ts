export type ProofJobCard = {
  id: string;
  imageUrl: string;
  caption: string;
  city: string;
};

export type ProofBeforeAfter = {
  id: string;
  title: string;
  summary: string;
  beforeUrl: string;
  afterUrl: string;
};

export type ShopProofSlots = {
  heroUrl: string;
  heroVideoUrl: string;
  recentJobs: ProofJobCard[];
  beforeAfter: ProofBeforeAfter[];
  city: string;
};
