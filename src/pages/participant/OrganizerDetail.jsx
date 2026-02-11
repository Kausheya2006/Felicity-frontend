import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrganizerById, getOrganizerEvents, followOrganizer, unfollowOrganizer, getFollowedOrganizers } from '../../api/participantService';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';

const OrganizerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchOrganizerDetails();
    fetchOrganizerEvents();
    checkFollowStatus();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      const data = await getOrganizerById(id);
      setOrganizer(data);
    } catch (error) {
      console.error('Error fetching organizer details:', error);
    }
  };

  const fetchOrganizerEvents = async () => {
    try {
      const data = await getOrganizerEvents(id);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching organizer events:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const data = await getFollowedOrganizers();
      const followedIds = (data.followedOrganizers || [])
        .filter(o => o && o._id)
        .map(o => o._id);
      setIsFollowing(followedIds.includes(id));
    } catch (error) {
      console.error('Error checking follow status:', error);
      setIsFollowing(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowOrganizer(id);
        setIsFollowing(false);
        alert('Unfollowed successfully');
      } else {
        await followOrganizer(id);
        setIsFollowing(true);
        alert('Followed successfully');
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update follow status';
      alert(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Organizer Details" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Organizer Details" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Organizer not found</p>
        </div>
      </div>
    );
  }

  const displayEvents = activeTab === 'upcoming' ? events.upcoming : events.past;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Organizer Details" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Button onClick={() => navigate('/clubs')} variant="secondary" size="sm">
          ← Back to Clubs
        </Button>

        {/* Organizer Info Card */}
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {organizer.organizerProfile?.name || 'N/A'}
              </h1>
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                {organizer.organizerProfile?.category || 'N/A'}
              </span>
            </div>
            <Button
              onClick={handleToggleFollow}
              variant={isFollowing ? 'danger' : 'primary'}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-gray-700 mt-1">
                {organizer.organizerProfile?.description || 'No description available'}
              </p>
            </div>

            {organizer.organizerProfile?.contactEmail && (
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Email</p>
                <p className="text-gray-700 mt-1">{organizer.organizerProfile.contactEmail}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-700 mt-1">{organizer.email}</p>
            </div>
          </div>
        </Card>

        {/* Events Card */}
        <Card title="Events">
          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'upcoming'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Events ({events.upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'past'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Past Events ({events.past.length})
              </button>
            </div>
          </div>

          {/* Events List */}
          {displayEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No {activeTab} events</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayEvents.map((event) => (
                <div
                  key={event._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      event.type === 'MERCH' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {event.type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                  <div className="space-y-1 text-sm text-gray-700">
                    {event.eventStartDate && (
                      <p>{new Date(event.eventStartDate).toLocaleDateString()}</p>
                    )}
                    {event.venue && <p>{event.venue}</p>}
                    {event.fee > 0 && <p className="text-green-600 font-semibold">💰 ${event.fee}</p>}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event._id}`);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default OrganizerDetail;
