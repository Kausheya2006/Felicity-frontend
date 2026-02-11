import { useState, useEffect } from 'react';
import { getEventFeedback, getFeedbackStats, exportFeedback } from '../api/feedbackService';

const FeedbackViewer = ({ eventId, eventTitle, onClose }) => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadData();
  }, [eventId, filterRating, sortBy, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [feedbackData, statsData] = await Promise.all([
        getEventFeedback(eventId, { rating: filterRating, sortBy, order: sortOrder }),
        getFeedbackStats(eventId)
      ]);

      setFeedback(feedbackData.feedback);
      setStats(statsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportFeedback(eventId);
    } catch (err) {
      setError('Failed to export feedback');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderStatsBar = (count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div
            className="bg-purple-600 h-3 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Event Feedback</h2>
              <p className="text-gray-600 mt-1">{eventTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading feedback...</p>
            </div>
          ) : (
            <>
              {/* Statistics Section */}
              {stats && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600">
                        {stats.averageRating.toFixed(1)}
                      </div>
                      <div className="flex justify-center mt-2">
                        {renderStars(Math.round(stats.averageRating))}
                      </div>
                      <p className="text-gray-600 mt-1">Average Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600">
                        {stats.totalFeedback}
                      </div>
                      <p className="text-gray-600 mt-1">Total Responses</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600">
                        {stats.totalFeedback > 0 
                          ? Math.round((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalFeedback * 100)
                          : 0}%
                      </div>
                      <p className="text-gray-600 mt-1">Positive Reviews</p>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Rating Distribution</h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-20">
                            <span className="text-sm text-gray-600">{rating}</span>
                            <span className="text-yellow-400">★</span>
                          </div>
                          {renderStatsBar(
                            stats.ratingDistribution[rating],
                            stats.totalFeedback
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Filters and Actions */}
              <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>

                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newOrder] = e.target.value.split('-');
                      setSortBy(newSortBy);
                      setSortOrder(newOrder);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="rating-desc">Highest Rating</option>
                    <option value="rating-asc">Lowest Rating</option>
                  </select>
                </div>

                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>

              {/* Feedback List */}
              <div className="space-y-4">
                {feedback.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No feedback yet</p>
                  </div>
                ) : (
                  feedback.map((fb) => (
                    <div
                      key={fb._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {renderStars(fb.rating)}
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(fb.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {fb.participant ? (
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {fb.participant.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {fb.participant.email}
                            </p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            Anonymous
                          </span>
                        )}
                      </div>
                      {fb.comment && (
                        <p className="text-gray-700 whitespace-pre-wrap">{fb.comment}</p>
                      )}
                      {fb.attendedEvent && (
                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          ✓ Attended
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackViewer;
