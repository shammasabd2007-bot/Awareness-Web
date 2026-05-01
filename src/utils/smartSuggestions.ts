/**
 * Smart Suggestions Engine
 * Analyzes data to suggest high-priority areas and patterns
 */

import { getAllLocations, getAnalyticsSummary } from '../database/db.web';

export interface Suggestion {
  id: string;
  type: 'high_priority' | 'ignored_region' | 'category_focus';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

/**
 * Generate smart suggestions based on stored data
 */
export const generateSuggestions = async (): Promise<Suggestion[]> => {
  try {
    const locations = await getAllLocations();
    const analytics = await getAnalyticsSummary();
    const suggestions: Suggestion[] = [];

    // Suggestion 1: High-priority areas (not visited for long time)
    const notVisitedLocations = locations.filter(
      (loc) => loc.status === 'not_visited'
    );

    if (notVisitedLocations.length > 0) {
      const oldestNotVisited = notVisitedLocations.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];

      const daysOld = Math.floor(
        (Date.now() - new Date(oldestNotVisited.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysOld > 7) {
        suggestions.push({
          id: 'high_priority_1',
          type: 'high_priority',
          title: 'Urgent: Oldest Unvisited Location',
          description: `"${oldestNotVisited.title}" hasn't been visited for ${daysOld} days. Consider prioritizing this location.`,
          priority: 'high',
          actionable: true,
        });
      }
    }

    // Suggestion 2: Ignored regions (high not_visited percentage)
    if (analytics.total > 0) {
      const notVisitedPercentage = (analytics.notVisited / analytics.total) * 100;

      if (notVisitedPercentage > 60) {
        suggestions.push({
          id: 'ignored_region_1',
          type: 'ignored_region',
          title: 'Many Unvisited Locations',
          description: `${notVisitedPercentage.toFixed(0)}% of marked locations are still not visited. Focus on completing these visits.`,
          priority: 'high',
          actionable: true,
        });
      }
    }

    // Suggestion 3: Category focus
    const categoryStats: { [key: string]: number } = {};
    locations.forEach((loc) => {
      categoryStats[loc.category] = (categoryStats[loc.category] || 0) + 1;
    });

    const maxCategory = Object.entries(categoryStats).sort(
      (a, b) => b[1] - a[1]
    )[0];

    if (maxCategory) {
      const percentage = (maxCategory[1] / locations.length) * 100;
      if (percentage > 50) {
        suggestions.push({
          id: 'category_focus_1',
          type: 'category_focus',
          title: `Focus on ${maxCategory[0]}`,
          description: `${percentage.toFixed(0)}% of locations are in the "${maxCategory[0]}" category. Consider diversifying efforts.`,
          priority: 'medium',
          actionable: true,
        });
      }
    }

    // Suggestion 4: Completion rate
    if (analytics.total > 0) {
      const completionRate = (analytics.completed / analytics.total) * 100;

      if (completionRate < 30 && analytics.total > 5) {
        suggestions.push({
          id: 'completion_rate_1',
          type: 'high_priority',
          title: 'Low Completion Rate',
          description: `Only ${completionRate.toFixed(0)}% of locations are completed. Accelerate completion efforts.`,
          priority: 'high',
          actionable: true,
        });
      } else if (completionRate > 70) {
        suggestions.push({
          id: 'completion_rate_2',
          type: 'high_priority',
          title: 'Great Progress!',
          description: `${completionRate.toFixed(0)}% completion rate achieved! Keep up the momentum.`,
          priority: 'low',
          actionable: false,
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
};

/**
 * Get high-priority locations
 */
export const getHighPriorityLocations = async (limit: number = 5) => {
  try {
    const locations = await getAllLocations();

    // Score locations based on:
    // 1. Status (not_visited = highest priority)
    // 2. Age (older = higher priority)
    // 3. Category importance

    const scored = locations.map((loc) => {
      let score = 0;

      // Status scoring
      if (loc.status === 'not_visited') score += 100;
      else if (loc.status === 'in_progress') score += 50;

      // Age scoring (older = higher priority)
      const ageInDays = Math.floor(
        (Date.now() - new Date(loc.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += ageInDays * 5;

      // Category importance
      const importantCategories = ['Healthcare', 'Education', 'Government Schemes'];
      if (importantCategories.includes(loc.category)) {
        score += 30;
      }

      return { ...loc, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('Error getting high-priority locations:', error);
    return [];
  }
};

/**
 * Get frequently ignored regions
 */
export const getIgnoredRegions = async () => {
  try {
    const locations = await getAllLocations();

    // Group by category and calculate not_visited percentage
    const categoryStats: {
      [key: string]: { total: number; notVisited: number };
    } = {};

    locations.forEach((loc) => {
      if (!categoryStats[loc.category]) {
        categoryStats[loc.category] = { total: 0, notVisited: 0 };
      }
      categoryStats[loc.category].total++;
      if (loc.status === 'not_visited') {
        categoryStats[loc.category].notVisited++;
      }
    });

    // Calculate percentages and sort
    const ignored = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        ...stats,
        percentage: (stats.notVisited / stats.total) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return ignored;
  } catch (error) {
    console.error('Error getting ignored regions:', error);
    return [];
  }
};

export default {
  generateSuggestions,
  getHighPriorityLocations,
  getIgnoredRegions,
};
