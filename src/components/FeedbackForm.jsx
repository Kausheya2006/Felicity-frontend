import { useState, useEffect } from 'react';
import { submitFeedback, checkFeedbackStatus, updateFeedback } from '../api/feedbackService';

const FeedbackForm = ({ eventId, eventTitle, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    checkExistingFeedback();
  }, [eventId]);

  const checkExistingFeedback = async () => {
    try {
      const data = await checkFeedbackStatus(eventId);
      if (data.hasSubmitted && data.feedback) {
        setExistingFeedback(data.feedback);
        setRating(data.feedback.rating);
        setComment(data.feedback.comment || '');
        
        // Check if within 24 hours
        const hoursSince = (Date.now() - new Date(data.feedback.createdAt)) / (1000 * 60 * 60);
        setCanEdit(hoursSince < 24);
      }
    } catch (err) {
      console.error('Error checking feedback status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const feedbackData = {
        rating,
        comment: comment.trim(),
        isAnonymous
      };

      if (existingFeedback && canEdit) {
        await updateFeedback(eventId, feedbackData);
      } else {
        await submitFeedback(eventId, feedbackData);
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2 justify-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-4xl transition-transform hover:scale-110 focus:outline-none"
            disabled={existingFeedback && !canEdit}
          >
            <span className={
              star <= (hoverRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {existingFeedback ? 'Your Feedback' : 'Share Your Feedback'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            {eventTitle}
          </p>

          {existingFeedback && !canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                Your feedback was submitted on{' '}
                {new Date(existingFeedback.createdAt).toLocaleDateString()}.
                Feedback can only be edited within 24 hours of submission.
              </p>
            </div>
          )}

          {existingFeedback && canEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                You can still edit your feedback within 24 hours of submission.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3 text-center">
                Rate your experience
              </label>
              {renderStars()}
              {rating > 0 && (
                <p className="text-center text-gray-600 mt-2">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="4"
                placeholder="Share your thoughts about this event..."
                maxLength="2000"
                disabled={existingFeedback && !canEdit}
              />
              <p className="text-sm text-gray-500 mt-1">
                {comment.length}/2000 characters
              </p>
            </div>

            {!existingFeedback && (
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700">
                    Submit anonymously (organizers won't see your name)
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              {(!existingFeedback || canEdit) && (
                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
