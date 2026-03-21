import { query } from '../config/database';

/**
 * Biased Matrix Factorization (BMF) Recommendation Service
 *
 * Model: r_ui = mu + b_u + b_i + p_u^T * q_i
 * where:
 *   mu     = global mean rating
 *   b_u    = user bias
 *   b_i    = item (event) bias
 *   p_u    = user latent factor vector
 *   q_i    = item latent factor vector
 *
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

  /**
   * Train the model on a list of (userId, eventId, rating) tuples.
   * Rating is implicit: booking = 5, view = 1.
   */
  train(ratings: Array<{ userId: number; eventId: number; rating: number }>): void {
    if (ratings.length === 0) return;

    // Compute global mean
    this.globalMean = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

    // Initialize biases and factors for all users and items
    const userIds = [...new Set(ratings.map(r => r.userId))];
    const eventIds = [...new Set(ratings.map(r => r.eventId))];

    for (const uid of userIds) {
      this.userBiases.set(uid, 0);
      this.userFactors.set(uid, this.randomVector());
    }

    for (const eid of eventIds) {
      this.itemBiases.set(eid, 0);
      this.itemFactors.set(eid, this.randomVector());
    }

    // SGD optimization
    for (let epoch = 0; epoch < this.numEpochs; epoch++) {
      // Shuffle ratings
      const shuffled = [...ratings].sort(() => Math.random() - 0.5);

      for (const { userId, eventId, rating } of shuffled) {
        const b_u = this.userBiases.get(userId) ?? 0;
        const b_i = this.itemBiases.get(eventId) ?? 0;
        const p_u = this.userFactors.get(userId) ?? this.randomVector();
        const q_i = this.itemFactors.get(eventId) ?? this.randomVector();

        // Predicted rating
        const predicted = this.globalMean + b_u + b_i + this.dot(p_u, q_i);
        const error = rating - predicted;

        // Update biases
        this.userBiases.set(userId, b_u + this.learningRate * (error - this.regularization * b_u));
        this.itemBiases.set(eventId, b_i + this.learningRate * (error - this.regularization * b_i));

        // Update latent factors
        const newPu = p_u.map((val, k) =>
          val + this.learningRate * (error * q_i[k] - this.regularization * val)
        );
        const newQi = q_i.map((val, k) =>
          val + this.learningRate * (error * p_u[k] - this.regularization * val)
        );

        this.userFactors.set(userId, newPu);
        this.itemFactors.set(eventId, newQi);
      }
    }
  }

  /**
   * Predict the affinity score for a user-event pair.
   * Returns a float score (higher = more likely to be interested).
   */
  predict(userId: number, eventId: number): number {
    const b_u = this.userBiases.get(userId) ?? 0;
    const b_i = this.itemBiases.get(eventId) ?? 0;
    const p_u = this.userFactors.get(userId);
    const q_i = this.itemFactors.get(eventId);

    if (!p_u || !q_i) {
      // Cold-start: return global mean + item bias only
      return this.globalMean + b_i;
    }

    return this.globalMean + b_u + b_i + this.dot(p_u, q_i);
  }

  /**
   * Get top-N recommendations for a user from a list of candidate event IDs.
   */
  getRecommendations(userId: number, candidateEventIds: number[], topN: number = 10): number[] {
    const scores = candidateEventIds.map(eventId => ({
      eventId,
      score: this.predict(userId, eventId),
    }));

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topN).map(s => s.eventId);
  }
}

// Singleton instance
let modelInstance: BiasedMatrixFactorization | null = null;

/**
 * Retrain the model from database interactions.
 * Bookings count as rating 5, views count as rating 1.
 */
export const trainModel = async (): Promise<BiasedMatrixFactorization> => {
  const bookingRatings = await query(
    `SELECT attendee_id as user_id, event_id, 5 as rating
     FROM bookings WHERE booking_status = 'CONFIRMED'`
  );

  const viewRatings = await query(
    `SELECT user_id, event_id, 1 as rating FROM event_views`
  );

  const allRatings = [
    ...bookingRatings.rows.map((r: any) => ({
      userId: r.user_id, eventId: r.event_id, rating: parseInt(r.rating),
    })),
    ...viewRatings.rows.map((r: any) => ({
      userId: r.user_id, eventId: r.event_id, rating: parseInt(r.rating),
    })),
  ];

  // Merge: if user has both a view and a booking for same event, keep max (booking wins)
  const ratingMap = new Map<string, { userId: number; eventId: number; rating: number }>();
  for (const r of allRatings) {
    const key = `${r.userId}_${r.eventId}`;
    const existing = ratingMap.get(key);
    if (!existing || existing.rating < r.rating) {
      ratingMap.set(key, r);
    }
  }

  const model = new BiasedMatrixFactorization(20, 0.005, 0.02, 50);
  model.train([...ratingMap.values()]);

  modelInstance = model;
  return model;
};

/**
 * Get recommendations for a user.
 * If no interaction history exists, returns empty (caller should show popular events).
 */
export const getRecommendationsForUser = async (userId: number, topN: number = 10): Promise<number[]> => {
  if (!modelInstance) {
    await trainModel();
  }

  // Get events the user has NOT booked or viewed (candidate events)
  const candidateResult = await query(
    `SELECT id FROM events
     WHERE status = 'PUBLISHED'
       AND id NOT IN (
         SELECT event_id FROM bookings WHERE attendee_id = $1
         UNION
         SELECT event_id FROM event_views WHERE user_id = $1
       )
     ORDER BY start_datetime ASC
     LIMIT 200`,
    [userId]
  );

  const candidateIds = candidateResult.rows.map((r: any) => r.id);

  if (candidateIds.length === 0) return [];

  // Check if user has any interactions (bookings or views)
  const hasInteractions = await query(
    `SELECT 1 FROM bookings WHERE attendee_id = $1
     UNION SELECT 1 FROM event_views WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (hasInteractions.rows.length === 0) {
    // Cold-start: return empty, frontend will show popular/newest events
    return [];
  }

  return modelInstance!.getRecommendations(userId, candidateIds, topN);
};
