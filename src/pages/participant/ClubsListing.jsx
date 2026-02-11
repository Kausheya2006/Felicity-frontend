import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrganizers, followOrganizer, unfollowOrganizer, getFollowedOrganizers } from '../../api/participantService';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';

const ClubsListing = () => {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizerIds, setFollowedOrganizerIds] = useState([]);

  useEffect(() => {
    fetchOrganizers();
    fetchFollowedOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const data = await getAllOrganizers();
      console.log(data)
      setOrganizers(data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const data = await getFollowedOrganizers();
      const ids = (data.followedOrganizers || [])
        .filter(o => o && o._id)
        .map(o => o._id);
      setFollowedOrganizerIds(ids);
    } catch (error) {
      console.error('Error fetching followed organizers:', error);
      setFollowedOrganizerIds([]);
    }
  };

  const handleToggleFollow = async (organizerId) => {
    try {
      if (followedOrganizerIds.includes(organizerId)) {
        await unfollowOrganizer(organizerId);
        setFollowedOrganizerIds(followedOrganizerIds.filter(id => id !== organizerId));
        alert('Unfollowed successfully');
      } else {
        await followOrganizer(organizerId);
        setFollowedOrganizerIds([...followedOrganizerIds, organizerId]);
        alert('Followed successfully');
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update follow status';
      alert(errorMsg);
    }
  };

  const isFollowing = (organizerId) => followedOrganizerIds.includes(organizerId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Clubs / Organizers" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card title="All Approved Organizers">
          {organizers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No organizers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizers.map((organizer) => (
                <div
                  key={organizer._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {organizer.organizerProfile?.name || 'N/A'}
                      </h3>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                        {organizer.organizerProfile?.category || 'N/A'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {organizer.organizerProfile?.description || 'No description available'}
                    </p>
                    
                    {organizer.organizerProfile?.contactEmail && (
                      <p className="text-sm text-gray-500 mb-3">
                        📧 {organizer.organizerProfile.contactEmail}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/organizers/${organizer._id}`)}
                      variant="info"
                      size="sm"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleToggleFollow(organizer._id)}
                      variant={isFollowing(organizer._id) ? 'danger' : 'primary'}
                      size="sm"
                      className="flex-1"
                    >
                      {isFollowing(organizer._id) ? 'Unfollow' : 'Follow'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default ClubsListing;
