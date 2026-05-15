import prisma from '../config/prisma';

/**
 * Biased Matrix Factorization (BMF) Recommendation Service
 *
 * Model: r_ui = mu + b_u + b_i + p_u^T * q_i
 * Optimized via Stochastic Gradient Descent (SGD).
 */
export class BiasedMatrixFactorization {
  private numFactors: number;
  private learningRate: number;
  private regularization: number;
  private numEpochs: number;

  private globalMean: number = 0;
  private userBiases: Map<number, number> = new Map();
  private itemBiases: Map<number, number> = new Map();
  private userFactors: Map<number, number[]> = new Map();
  private itemFactors: Map<number, number[]> = new Map();

  constructor(
    numFactors: number = 20,
    learningRate: number = 0.005,
    regularization: number = 0.02,
    numEpochs: number = 50
  ) {
    this.numFactors = numFactors;
    this.learningRate = learningRate;
    this.regularization = regularization;
    this.numEpochs = numEpochs;
  }

  private randomVector(): number[] {
    return Array.from({ length: this.numFactors }, () => (Math.random() - 0.5) * 0.1);
  }

  private dot(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  train(ratings: Array<{ userId: number; eventId: number; rating: number }>): void {
    if (ratings.length === 0) return;

    this.globalMean = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

    const userIds = [...new Set(ratings.map((r) => r.userId))];
    const eventIds = [...new Set(ratings.map((r) => r.eventId))];

    for (const uid of userIds) {
      this.userBiases.set(uid, 0);
      this.userFactors.set(uid, this.randomVector());
    }
    for (const eid of eventIds) {
      this.itemBiases.set(eid, 0);
      this.itemFactors.set(eid, this.randomVector());
    }

    for (let epoch = 0; epoch < this.numEpochs; epoch++) {
      const shuffled = [...ratings].sort(() => Math.random() - 0.5);
      for (const { userId, eventId, rating } of shuffled) {
        const b_u = this.userBiases.get(userId) ?? 0;
        const b_i = this.itemBiases.get(eventId) ?? 0;
        const p_u = this.userFactors.get(userId) ?? this.randomVector();
        const q_i = this.itemFactors.get(eventId) ?? this.randomVector();

        const predicted = this.globalMean + b_u + b_i + this.dot(p_u, q_i);
        const error = rating - predicted;

        this.userBiases.set(userId, b_u + this.learningRate * (error - this.regularization * b_u));
        this.itemBiases.set(eventId, b_i + this.learningRate * (error - this.regularization * b_i));
        this.userFactors.set(userId, p_u.map((val, k) => val + this.learningRate * (error * q_i[k] - this.regularization * val)));
        this.itemFactors.set(eventId, q_i.map((val, k) => val + this.learningRate * (error * p_u[k] - this.regularization * val)));
      }
    }
  }

  predict(userId: number, eventId: number): number {
    const b_u = this.userBiases.get(userId) ?? 0;
    const b_i = this.itemBiases.get(eventId) ?? 0;
    const p_u = this.userFactors.get(userId);
    const q_i = this.itemFactors.get(eventId);
    if (!p_u || !q_i) return this.globalMean + b_i;
    return this.globalMean + b_u + b_i + this.dot(p_u, q_i);
  }

  getRecommendations(userId: number, candidateEventIds: number[], topN: number = 10): number[] {
    return candidateEventIds
      .map((eventId) => ({ eventId, score: this.predict(userId, eventId) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((s) => s.eventId);
  }
}

let modelInstance: BiasedMatrixFactorization | null = null;

export const trainModel = async (): Promise<BiasedMatrixFactorization> => {
  const [bookings, views] = await Promise.all([
    prisma.booking.findMany({ where: { booking_status: 'CONFIRMED' }, select: { attendee_id: true, event_id: true } }),
    prisma.eventView.findMany({ select: { user_id: true, event_id: true } }),
  ]);

  const allRatings = [
    ...bookings.map((b) => ({ userId: b.attendee_id, eventId: b.event_id, rating: 5 })),
    ...views.map((v) => ({ userId: v.user_id, eventId: v.event_id, rating: 1 })),
  ];

  const ratingMap = new Map<string, { userId: number; eventId: number; rating: number }>();
  for (const r of allRatings) {
    const key = `${r.userId}_${r.eventId}`;
    const existing = ratingMap.get(key);
    if (!existing || existing.rating < r.rating) ratingMap.set(key, r);
  }

  const model = new BiasedMatrixFactorization(20, 0.005, 0.02, 50);
  model.train([...ratingMap.values()]);
  modelInstance = model;
  return model;
};

export const getRecommendationsForUser = async (userId: number, topN: number = 10): Promise<number[]> => {
  if (!modelInstance) await trainModel();

  const [bookedIds, viewedIds] = await Promise.all([
    prisma.booking.findMany({ where: { attendee_id: userId }, select: { event_id: true } }).then((r) => r.map((b) => b.event_id)),
    prisma.eventView.findMany({ where: { user_id: userId }, select: { event_id: true } }).then((r) => r.map((v) => v.event_id)),
  ]);

  const excludedIds = [...new Set([...bookedIds, ...viewedIds])];

  const candidates = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
    },
    select: { id: true },
    orderBy: { start_datetime: 'asc' },
    take: 200,
  });

  const candidateIds = candidates.map((e) => e.id);
  if (candidateIds.length === 0) return [];

  const hasInteractions = bookedIds.length > 0 || viewedIds.length > 0;
  if (!hasInteractions) return [];

  return modelInstance!.getRecommendations(userId, candidateIds, topN);
};
